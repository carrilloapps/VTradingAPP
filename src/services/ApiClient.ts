import { appCheckService } from './firebase/AppCheckService';
import { getPerformance, httpMetric, FirebasePerformanceTypes } from '@react-native-firebase/perf';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
            console.log(`[ApiClient] Serving from cache: ${url}`);
            return data;
          }
        }
      } catch (e) {
        console.warn('[ApiClient] Cache read error', e);
      }
    }

    // 2. Setup Performance Monitoring
    let metric: FirebasePerformanceTypes.HttpMetric | null = null;
    try {
      const perf = getPerformance();
      if (!perf.dataCollectionEnabled) {
          await perf.setPerformanceCollectionEnabled(true);
      }
      metric = httpMetric(perf, url, 'GET');
      await metric.start();
    } catch (e) {
      console.warn('[ApiClient] Perf monitor failed', e);
    }

    // 3. Setup Headers
    const token = await appCheckService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': 'admin_key', // Default API Key as requested
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
          const contentType = response.headers.get('Content-Type');
          if (contentType) metric.setResponseContentType(contentType);
          const contentLength = response.headers.get('Content-Length');
          if (contentLength) metric.setResponsePayloadSize(parseInt(contentLength, 10));
          await metric.stop();
        } catch (e) {
            console.warn('[ApiClient] Perf metric stop failed', e);
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
          console.warn('[ApiClient] Cache write error', e);
        }
      }

      return data;
    } catch (error: any) {
      if (metric) {
          try { await metric.stop(); } catch {}
      }
      console.error(`[ApiClient] Error fetching ${url}:`, error);
      
      // Return stale cache if available on network error
      if (options.useCache) {
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                console.log(`[ApiClient] Network failed, serving stale cache: ${url}`);
                const { data } = JSON.parse(cached) as CacheItem<T>;
                return data;
            }
        } catch { /* ignore */ }
      }
      
      throw error;
    }
  }
}

export const apiClient = new ApiClient('https://vt.isapp.dev/');
