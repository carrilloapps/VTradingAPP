import { appCheckService } from './firebase/AppCheckService';
import { getPerformance, httpMetric, initializePerformance, FirebasePerformanceTypes } from '@react-native-firebase/perf';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '../constants/AppConfig';
import { observabilityService } from './ObservabilityService';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  useCache?: boolean;
  updateCache?: boolean; // Force update cache even if useCache is false
  cacheTTL?: number; // in milliseconds
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    
    // Append query params if present
    if (options.params) {
        const queryString = Object.entries(options.params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&');
        url += (url.includes('?') ? '&' : '?') + queryString;
    }

    const cacheKey = `api_cache_${url}`;
    
    // 1. Check Cache
    if (options.useCache) {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached) as CacheItem<T>;
          const ttl = options.cacheTTL || 5 * 60 * 1000; // Default 5 mins
          if (Date.now() - timestamp < ttl) {
            return data;
          }
        }
      } catch (e) {
        observabilityService.captureError(e);
        // Cache read error
      }
    }

    // 2. Setup Performance Monitoring
    let metric: FirebasePerformanceTypes.HttpMetric | null = null;
    try {
      const perf = getPerformance();
        if (!perf.dataCollectionEnabled) {
            await initializePerformance(perf.app, { dataCollectionEnabled: true });
        }
        metric = httpMetric(perf, url, 'GET');
        await metric.start();
    } catch (e) {
      observabilityService.captureError(e);
      // Perf monitor failed
    }

    // 3. Setup Headers
    const token = await appCheckService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': AppConfig.API_KEY,
      ...options.headers,
    };

    if (token) {
      headers['X-Firebase-AppCheck'] = token;
    }

    try {
      // 4. Perform Request
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      // 5. Record Performance Data
      if (metric) {
        try {
          metric.setHttpResponseCode(response.status);
          
          // Capture Content-Type
          const contentType = response.headers.get('Content-Type');
          if (contentType) metric.setResponseContentType(contentType);
          
          // Capture Content-Length (Response Payload Size)
          const contentLength = response.headers.get('Content-Length');
          if (contentLength) metric.setResponsePayloadSize(parseInt(contentLength, 10));
          
          // Optional: You could add custom attributes here
          // metric.putAttribute('custom_attr', 'value');

          await metric.stop();
        } catch (e) {
            observabilityService.captureError(e);
            // Perf metric stop failed
        }
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      // 6. Process Response
      const data = await response.json();

      // 7. Save to Cache
      if (options.useCache || options.updateCache) {
        try {
          const cacheItem: CacheItem<T> = {
            data,
            timestamp: Date.now(),
          };
          await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));
        } catch (e) {
          observabilityService.captureError(e);
          // Cache write error
        }
      }

      return data;
    } catch (e: any) {
      observabilityService.captureError(e);
      if (metric) {
          try { await metric.stop(); } catch (stopError) { observabilityService.captureError(stopError); }
      }
      
      // Return stale cache if available on network error
      if (options.useCache) {
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                const { data } = JSON.parse(cached) as CacheItem<T>;
                return data;
            }
        } catch (cacheError) { observabilityService.captureError(cacheError); /* ignore */ }
      }
      
      throw e;
    }
  }
}

export const apiClient = new ApiClient(AppConfig.API_BASE_URL);
