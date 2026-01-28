import { appCheckService } from './firebase/AppCheckService';
import { getPerformance, httpMetric, initializePerformance, FirebasePerformanceTypes } from '@react-native-firebase/perf';
import { mmkvStorage } from './StorageService';
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

    // 1. Check Cache (using MMKV for 30x better performance)
    if (options.useCache) {
      try {
        const cached = mmkvStorage.getString(cacheKey);
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
    let sentryTransaction: any = null;
    try {
      // Firebase Perf
      const perf = getPerformance();
      if (!perf.dataCollectionEnabled) {
        await initializePerformance(perf.app, { dataCollectionEnabled: true });
      }
      metric = httpMetric(perf, url, 'GET');

      // Add detailed attributes to Firebase Perf
      metric.putAttribute('http_method', 'GET');
      metric.putAttribute('api_endpoint', endpoint);
      metric.putAttribute('cache_enabled', options.useCache ? 'true' : 'false');

      await metric.start();

      // Sentry Perf
      sentryTransaction = observabilityService.startTransaction(`GET ${endpoint}`, 'http.client');
      if (sentryTransaction) {
        // En versiones nuevas de Sentry SDK, se usa setTag o setAttribute (para spans)
        // setData fue removido o renombrado. Usaremos setTag para compatibilidad segura.
        const setTagFn = sentryTransaction.setTag || sentryTransaction.setData;
        if (typeof setTagFn === 'function') {
          const safeSetTag = setTagFn.bind(sentryTransaction);
          safeSetTag('url', url);
          safeSetTag('http.method', 'GET');
          safeSetTag('api.endpoint', endpoint);
          safeSetTag('cache.enabled', String(!!options.useCache));
          if (options.params) {
            safeSetTag('query_params_keys', Object.keys(options.params).join(','));
          }
        }
      }
    } catch (e) {
      observabilityService.captureError(e);
      if (__DEV__) console.warn('[ApiClient] Perf setup failed', e);
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
      if (metric) metric.putAttribute('has_app_check_token', 'true');
    } else {
      if (metric) metric.putAttribute('has_app_check_token', 'false');
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

          // Capture Request Payload Size (0 for GET)
          metric.setRequestPayloadSize(0);

          await metric.stop();
        } catch (e) {
          observabilityService.captureError(e);
          if (__DEV__) console.warn('[ApiClient] Perf stop failed', e);
        }
      }

      if (sentryTransaction) {
        if (response.headers.get('Content-Length')) {
          observabilityService.setTransactionAttribute(sentryTransaction, 'content_length', response.headers.get('Content-Length') || '0');
        }
        observabilityService.setTransactionAttribute(sentryTransaction, 'http.status_code', String(response.status));
        observabilityService.setTransactionAttribute(sentryTransaction, 'has_app_check_token', token ? 'true' : 'false');

        observabilityService.finishTransaction(sentryTransaction, response.ok ? 'ok' : 'unknown_error');
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      // 6. Process Response
      const data = await response.json();

      // 7. Save to Cache (using MMKV for instant synchronous writes)
      if (options.useCache || options.updateCache) {
        try {
          const cacheItem: CacheItem<T> = {
            data,
            timestamp: Date.now(),
          };
          mmkvStorage.set(cacheKey, JSON.stringify(cacheItem));
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

      if (sentryTransaction) {
        observabilityService.finishTransaction(sentryTransaction, 'internal_error');
      }

      // Return stale cache if available on network error
      if (options.useCache) {
        try {
          const cached = mmkvStorage.getString(cacheKey);
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
