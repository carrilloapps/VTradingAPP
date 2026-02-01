import {
  getPerformance,
  httpMetric,
  initializePerformance,
  FirebasePerformanceTypes,
} from '@react-native-firebase/perf';

import { appCheckService } from '@/services/firebase/AppCheckService';
import { mmkvStorage } from '@/services/StorageService';
import { observabilityService } from '@/services/ObservabilityService';
import { AppConfig } from '@/constants/AppConfig';
import SafeLogger from '@/utils/safeLogger';

interface CacheItem<T> {
  data: T;
  headers?: Record<string, string>; // Store headers for pagination fallback
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

interface ApiResponse<T> {
  data: T;
  headers: Headers;
  status: number;
}

export class ApiClient {
  private baseUrl: string;
  private config: ApiClientConfig;

  constructor(
    baseUrl: string,
    config: ApiClientConfig = { apiKey: AppConfig.API_KEY, useAppCheck: true },
  ) {
    this.baseUrl = baseUrl;
    this.config = config;
    this.initializeMonitoring();
  }

  private async initializeMonitoring() {
    try {
      const perf = getPerformance();
      if (!perf.dataCollectionEnabled) {
        await initializePerformance(perf.app, { dataCollectionEnabled: true });
      }
    } catch (e) {
      if (__DEV__)
        SafeLogger.warn('[ApiClient] Perf init failed', { error: e });
    }
  }

  private sanitizeUrl(url: string): string {
    try {
      // Remove sensitive query params if needed, or just log base + endpoint
      // For now, simpler sanitization: log only path if not in DEV, or full url if safe
      // Assuming headers carry secrets, query params might carry identifiers.
      const urlObj = new URL(url);
      // Example: Redact 'token' or 'key' params
      // urlObj.searchParams.set('token', '***');
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  private async getHeaders(
    options: RequestOptions,
    metric?: FirebasePerformanceTypes.HttpMetric | null,
  ): Promise<Record<string, string>> {
    let token: string | undefined;

    // Only fetch AppCheck token if enabled in config (dflt: true)
    if (this.config.useAppCheck !== false) {
      token = await appCheckService.getToken();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
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

    return headers;
  }

  /**
   * Core request method that handles Network, Headers, Metrics, and Response parsing.
   * Does NOT handle caching.
   */
  private async _request<T>(
    endpoint: string,
    options: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const cleanBaseUrl = this.baseUrl.endsWith('/')
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${cleanBaseUrl}${cleanEndpoint}`;

    // Append query params if present
    if (options.params) {
      const queryString = Object.entries(options.params)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
        )
        .join('&');
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    // Setup Performance Monitoring
    let metric: FirebasePerformanceTypes.HttpMetric | null = null;
    let sentryTransaction: any = null;
    try {
      const perf = getPerformance();
      metric = httpMetric(perf, url, 'GET');
      metric.putAttribute('http_method', 'GET');
      metric.putAttribute('api_endpoint', endpoint);
      await metric.start();

      sentryTransaction = observabilityService.startTransaction(
        `GET ${endpoint}`,
        'http.client',
      );
    } catch (e) {
      // Ignore perf setup errors
    }

    try {
      const headers = await this.getHeaders(options, metric);

      if (__DEV__) {
        SafeLogger.log(`[ApiClient] Fetching: ${this.sanitizeUrl(url)}`);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (metric) {
        metric.setHttpResponseCode(response.status);
        const contentType = response.headers.get('Content-Type');
        if (contentType) metric.setResponseContentType(contentType);
        const contentLength = response.headers.get('Content-Length');
        if (contentLength)
          metric.setResponsePayloadSize(parseInt(contentLength, 10));
        await metric.stop();
      }

      if (sentryTransaction) {
        observabilityService.setTransactionAttribute(
          sentryTransaction,
          'http.status_code',
          String(response.status),
        );
        observabilityService.finishTransaction(
          sentryTransaction,
          response.ok ? 'ok' : 'unknown_error',
        );
      }

      if (!response.ok) {
        const text = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = {
            message: `HTTP Error ${response.status}`,
            details: text.substring(0, 100),
          };
        }
        throw new Error(
          errorData.message ||
            errorData.error ||
            `API Error: ${response.status}`,
        );
      }

      const text = await response.text();
      let data: T;
      try {
        data = text ? JSON.parse(text) : ({} as T);
      } catch (e) {
        throw new Error(
          `JSON Parse Error: ${e instanceof Error ? e.message : String(e)}`,
        );
      }

      return { data, headers: response.headers, status: response.status };
    } catch (e) {
      // Handle Metric Stop on Error
      if (metric) {
        try {
          metric.stop();
        } catch {}
      }
      if (sentryTransaction) {
        const isNetworkError =
          e instanceof TypeError && e.message === 'Network request failed';
        observabilityService.finishTransaction(
          sentryTransaction,
          isNetworkError ? 'deadline_exceeded' : 'internal_error',
        );
      }

      const isNetworkError =
        e instanceof TypeError && e.message === 'Network request failed';
      if (!isNetworkError) {
        observabilityService.captureError(e, {
          context: 'ApiClient._request',
          endpoint,
          url: this.sanitizeUrl(url),
        });
      }

      throw e;
    }
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const cleanBaseUrl = this.baseUrl.endsWith('/')
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // Re-construct URL just for cache key, or pass it?
    // Using simple approach: base + endpoint because query params might vary.
    // Ideally we should include query params in cache key.
    // _request builds the full URL. We duplicate that logic slightly or extract URL builder.
    // Let's rely on endpoint + params for cache key.
    let cacheKey = `api_cache_${cleanBaseUrl}${cleanEndpoint}`;
    if (options.params) {
      const queryString = Object.entries(options.params)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
        )
        .join('&');
      cacheKey += (cacheKey.includes('?') ? '&' : '?') + queryString;
    }

    // 1. Check Cache
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
        // Cache miss/error, proceed to fetch
      }
    }

    try {
      const response = await this._request<T>(endpoint, options);

      // Write to Cache
      if (options.useCache || options.updateCache) {
        try {
          const cacheItem: CacheItem<T> = {
            data: response.data,
            timestamp: Date.now(),
          };
          mmkvStorage.set(cacheKey, JSON.stringify(cacheItem));
        } catch (e) {
          // Ignore cache write error
        }
      }

      return response.data;
    } catch (e) {
      // Fallback to Stale Cache on Network Error
      if (options.useCache) {
        try {
          const cached = mmkvStorage.getString(cacheKey);
          if (cached) {
            const { data } = JSON.parse(cached) as CacheItem<T>;
            return data;
          }
        } catch {}
      }
      throw e;
    }
  }

  async getWithFullResponse<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<{ data: T; headers: Headers }> {
    const cleanBaseUrl = this.baseUrl.endsWith('/')
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let cacheKey = `api_cache_full_${cleanBaseUrl}${cleanEndpoint}`;
    if (options.params) {
      const queryString = Object.entries(options.params)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
        )
        .join('&');
      cacheKey += (cacheKey.includes('?') ? '&' : '?') + queryString;
    }

    try {
      const response = await this._request<T>(endpoint, options);

      // Cache full response if requested
      if (options.useCache || options.updateCache) {
        try {
          // Convert Headers to plain object
          const headerObj: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            headerObj[key] = value;
          });

          const cacheItem: CacheItem<T> = {
            data: response.data,
            headers: headerObj,
            timestamp: Date.now(),
          };
          mmkvStorage.set(cacheKey, JSON.stringify(cacheItem));
        } catch (e) {
          // Ignore cache write error
        }
      }

      return { data: response.data, headers: response.headers };
    } catch (e) {
      // Fallback to Cache
      if (options.useCache) {
        try {
          const cached = mmkvStorage.getString(cacheKey);
          if (cached) {
            const { data, headers: cachedHeaders } = JSON.parse(
              cached,
            ) as CacheItem<T>;

            // Reconstruct Headers object
            const headers = new Headers();
            if (cachedHeaders) {
              Object.entries(cachedHeaders).forEach(([k, v]) =>
                headers.append(k, String(v)),
              );
            }

            return { data, headers };
          }
        } catch {}
      }
      throw e;
    }
  }
}

export const apiClient = new ApiClient(AppConfig.API_BASE_URL);
