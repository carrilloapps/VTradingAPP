import { appCheckService } from './firebase/AppCheckService';
import { getPerformance, httpMetric, initializePerformance, FirebasePerformanceTypes } from '@react-native-firebase/perf';
import { mmkvStorage } from './StorageService';
import { AppConfig } from '../constants/AppConfig';
import { observabilityService } from './ObservabilityService';
import SafeLogger from '../utils/safeLogger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  useCache?: boolean;
  bypassCache?: boolean; // Force bypass cache and fetch fresh data
  updateCache?: boolean; // Force update cache even if useCache is false
  cacheTTL?: number; // in milliseconds
}

interface ApiClientConfig {
  apiKey?: string;
  useAppCheck?: boolean; // Default: true (for internal backend)
}

export class ApiClient {
  private baseUrl: string;
  private config: ApiClientConfig;

  constructor(baseUrl: string, config: ApiClientConfig = { apiKey: AppConfig.API_KEY, useAppCheck: true }) {
    this.baseUrl = baseUrl;
    this.config = config;
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${cleanBaseUrl}${cleanEndpoint}`;

    // Append query params if present
    if (options.params) {
      const queryString = Object.entries(options.params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    const cacheKey = `api_cache_${url}`;

    // 1. Check Cache (using MMKV for 30x better performance)
    // Skip cache if bypassCache is true (e.g., on pull-to-refresh)
    if (options.useCache && !options.bypassCache) {
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
        observabilityService.captureError(e, {
          context: 'ApiClient.get.cacheRead',
          endpoint: endpoint,
          cacheKey: cacheKey
        });
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
      observabilityService.captureError(e, {
        context: 'ApiClient.get.perfSetup',
        endpoint: endpoint
      });
      if (__DEV__) SafeLogger.warn('[ApiClient] Perf setup failed', { error: e });
    }

    // 3. Setup Headers
    let token: string | undefined;

    // Only fetch AppCheck token if enabled in config (dflt: true)
    if (this.config.useAppCheck !== false) {
      token = await appCheckService.getToken();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    // Add API Key if configured
    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    if (token) {
      headers['X-Firebase-AppCheck'] = token;
      if (metric) metric.putAttribute('has_app_check_token', 'true');
    } else {
      if (metric) metric.putAttribute('has_app_check_token', 'false');
    }

    try {
      // 4. Perform Request
      if (__DEV__) {
        SafeLogger.log(`[ApiClient] Fetching: ${endpoint}`);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (__DEV__) {
        SafeLogger.log(`[ApiClient] Status: ${response.status} for ${endpoint}`);
      }

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
          observabilityService.captureError(e, {
            context: 'ApiClient.get.perfStop',
            endpoint: endpoint,
            httpStatus: response.status
          });
          if (__DEV__) SafeLogger.warn('[ApiClient] Perf stop failed', { error: e });
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
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP Error ${response.status}` };
        }
        throw new Error(errorData.message || errorData.error || `API Error: ${response.status}`);
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
          observabilityService.captureError(e, {
            context: 'ApiClient.get.cacheWrite',
            endpoint: endpoint,
            cacheKey: cacheKey
          });
          // Cache write error
        }
      }

      return data;
    } catch (e: any) {
      const isNetworkError = e instanceof TypeError && e.message === 'Network request failed';

      if (!isNetworkError) {
        observabilityService.captureError(e, {
          context: 'ApiClient.get',
          endpoint: endpoint,
          method: 'GET',
          hasCache: !!options.useCache
        });
      }

      if (metric) {
        try {
          // Set a failure response code to avoid Firebase warnings when request fails prematurely
          // 0 is a common convention for network/corrupted requests in analytics
          metric.setHttpResponseCode(0);
          await metric.stop();
        } catch (stopError) {
          if (!isNetworkError) observabilityService.captureError(stopError, {
            context: 'ApiClient.request.metricStop',
            endpoint,
            action: 'stop_performance_metric'
          });
        }
      }

      if (sentryTransaction) {
        observabilityService.finishTransaction(sentryTransaction, isNetworkError ? 'deadline_exceeded' : 'internal_error');
      }

      // Return stale cache if available on network error
      if (options.useCache) {
        try {
          const cached = mmkvStorage.getString(cacheKey);
          if (cached) {
            const { data } = JSON.parse(cached) as CacheItem<T>;
            return data;
          }
        } catch (cacheError) {
          observabilityService.captureError(cacheError, {
            context: 'ApiClient.request.cacheFallback',
            endpoint,
            cacheKey,
            action: 'read_cache_on_error'
          });
          /* ignore */
        }
      }

      throw e;
    }
  }

  /**
   * Performs a GET request and returns both the data and the response headers.
   * Useful for pagination where information is stored in headers (X-WP-Total, X-WP-TotalPages).
   */
  async getWithFullResponse<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T; headers: Headers }> {
    const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${cleanBaseUrl}${cleanEndpoint}`;

    if (options.params) {
      const queryString = Object.entries(options.params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    // Note: This implementation is a simplified version of get() that returns headers.
    // It doesn't include all the performance metrics for brevity as it's primarily for internal data fetching.

    let token: string | undefined;
    if (this.config.useAppCheck !== false) {
      token = await appCheckService.getToken();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }
    if (token) {
      headers['X-Firebase-AppCheck'] = token;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP Error ${response.status}` };
      }
      throw new Error(errorData.message || errorData.error || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return { data, headers: response.headers };
  }
}

export const apiClient = new ApiClient(AppConfig.API_BASE_URL);
