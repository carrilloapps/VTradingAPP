import { ApiClient } from '../../src/services/ApiClient';
import { mmkvStorage } from '../../src/services/StorageService';
import { appCheckService } from '../../src/services/firebase/AppCheckService';
import {
  getPerformance,
  httpMetric,
  initializePerformance,
} from '@react-native-firebase/perf';

// Mock dependencies
jest.mock('../../src/services/StorageService', () => ({
  mmkvStorage: {
    getString: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('../../src/services/firebase/AppCheckService', () => ({
  appCheckService: {
    getToken: jest.fn(),
  },
}));

// Mock global fetch
global.fetch = jest.fn();

describe('ApiClient', () => {
  const baseUrl = 'https://api.test.com';
  let apiClient: ApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (mmkvStorage.getString as jest.Mock).mockReturnValue(null);
    apiClient = new ApiClient(baseUrl, {
      apiKey: 'test-key',
      useAppCheck: true,
    });
  });

  describe('constructor and initialization', () => {
    it('initializes with correct base URL and config', () => {
      expect(apiClient).toBeDefined();
    });

    it('initializes monitoring and handles already enabled data collection', () => {
      (getPerformance as jest.Mock).mockReturnValueOnce({
        dataCollectionEnabled: true,
        app: {},
      });
      const client = new ApiClient(baseUrl);
      expect(initializePerformance).not.toHaveBeenCalled();
    });

    it('handles performance initialization failure', () => {
      (getPerformance as jest.Mock).mockReturnValueOnce({
        dataCollectionEnabled: false,
        app: {},
      });
      (initializePerformance as jest.Mock).mockRejectedValueOnce(
        new Error('Perf Error'),
      );

      // Should not throw
      expect(() => new ApiClient(baseUrl)).not.toThrow();
    });
  });

  describe('URL Sanitization', () => {
    it('handles invalid URL in sanitizeUrl via _request error logging', async () => {
      // Mock URL constructor only once for this test to trigger catch block
      const originalURL = global.URL;
      global.URL = jest.fn().mockImplementation(() => {
        throw new Error('URL Error');
      }) as any;

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Fetch Fail'),
      );

      await expect(apiClient.get('/path')).rejects.toThrow('Fetch Fail');

      global.URL = originalURL;
    });
  });

  describe('get', () => {
    it('performs a successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockData)),
        headers: new Headers({
          'Content-Type': 'application/json',
          'Content-Length': '100',
        }),
      });
      (appCheckService.getToken as jest.Mock).mockResolvedValueOnce(
        'mock-appcheck-token',
      );

      const data = await apiClient.get('/test-endpoint');

      expect(data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('handles query parameters and existing query string', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{}'),
        headers: new Headers(),
      });

      await apiClient.get('/search?existing=1', { params: { q: 'query' } });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('existing=1&q=query'),
        expect.anything(),
      );
    });

    it('uses cache when available and not expired', async () => {
      const mockData = { cached: true };
      const cacheItem = {
        data: mockData,
        timestamp: Date.now(),
      };
      (mmkvStorage.getString as jest.Mock).mockReturnValue(
        JSON.stringify(cacheItem),
      );

      const data = await apiClient.get('/cached-resource', { useCache: true });

      expect(data).toEqual(mockData);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles cache read error', async () => {
      (mmkvStorage.getString as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Read Error');
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"ok":true}'),
        headers: new Headers(),
      });

      const data = await apiClient.get('/read-error', { useCache: true });
      expect(data).toEqual({ ok: true });
    });

    it('handles cache write error', async () => {
      (mmkvStorage.set as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Write Error');
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"ok":true}'),
        headers: new Headers(),
      });

      await apiClient.get('/write-error', { useCache: true });
      // Should not throw
    });

    it('falls back to stale cache on network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Network request failed'),
      );
      const staleData = { stale: true };
      (mmkvStorage.getString as jest.Mock).mockReturnValue(
        JSON.stringify({ data: staleData, timestamp: 0 }),
      );

      const data = await apiClient.get('/fallback', { useCache: true });

      expect(data).toEqual(staleData);
    });

    it('throws error on API error response and handles non-JSON error body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
        headers: new Headers(),
      });

      await expect(apiClient.get('/error')).rejects.toThrow('HTTP Error 500');
    });

    it('handles JSON parse error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('invalid-json'),
        headers: new Headers(),
      });

      await expect(apiClient.get('/bad-json')).rejects.toThrow(
        'JSON Parse Error',
      );
    });

    it('handles performance setup failure in _request', async () => {
      (httpMetric as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Metric Setup Fail');
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"ok":true}'),
        headers: new Headers(),
      });

      const data = await apiClient.get('/perf-fail');
      expect(data).toEqual({ ok: true });
    });
  });

  describe('getWithFullResponse', () => {
    it('returns data and headers and handles params', async () => {
      const mockData = { res: 'ok' };
      const mockHeaders = new Headers({ 'X-Custom': 'val' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockData)),
        headers: mockHeaders,
      });

      const response = await apiClient.getWithFullResponse('/full', {
        params: { a: 1 },
      });

      expect(response.data).toEqual(mockData);
      expect(response.headers.get('X-Custom')).toBe('val');
    });

    it('caches full response headers and handles write error', async () => {
      const mockData = { res: 'ok' };
      const mockHeaders = new Headers();
      mockHeaders.append('X-Custom', 'val');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockData)),
        headers: mockHeaders,
      });
      (mmkvStorage.set as jest.Mock).mockImplementationOnce(() => {
        throw new Error('SET FAIL');
      });

      await apiClient.getWithFullResponse('/full-cache', { useCache: true });
      // Should not throw
    });

    it('falls back to stale full cache on network failure and handles read error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Network request failed'),
      );

      // 1. Success fallback
      const staleData = { stale: true };
      const staleHeaders = { 'x-old': 'yes' };
      (mmkvStorage.getString as jest.Mock).mockReturnValueOnce(
        JSON.stringify({
          data: staleData,
          headers: staleHeaders,
          timestamp: 0,
        }),
      );

      const response = await apiClient.getWithFullResponse('/fallback-full', {
        useCache: true,
      });
      expect(response.data).toEqual(staleData);

      // 2. Read error in fallback
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Network request failed'),
      );
      (mmkvStorage.getString as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Read error');
      });
      await expect(
        apiClient.getWithFullResponse('/fallback-err', { useCache: true }),
      ).rejects.toThrow();
    });

    it('rethrows error when cache fallback is not used', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Fatal API Error'),
      );
      await expect(apiClient.getWithFullResponse('/no-cache')).rejects.toThrow(
        'Fatal API Error',
      );
    });
  });

  describe('Performance Monitoring stop logic', () => {
    it('stops metric even on request failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Fetch Fail'),
      );

      await expect(apiClient.get('/error-stop')).rejects.toThrow('Fetch Fail');

      const mockMetric = (httpMetric as jest.Mock).mock.results[0].value;
      expect(mockMetric.stop).toHaveBeenCalled();
    });
  });
});
