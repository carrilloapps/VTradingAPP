import { queryClient } from '../../src/config/queryClient';

describe('queryClient config', () => {
  it('uses expected default query options', () => {
    const options = queryClient.getDefaultOptions();
    const queryOptions = options.queries;

    expect(queryOptions?.staleTime).toBe(5 * 60 * 1000);
    expect(queryOptions?.gcTime).toBe(30 * 60 * 1000);
    expect(queryOptions?.retry).toBe(3);
    expect(queryOptions?.refetchOnReconnect).toBe(true);
    expect(queryOptions?.refetchOnMount).toBe(false);
    expect(queryOptions?.refetchOnWindowFocus).toBe(!__DEV__);
  });

  it('caps retryDelay at 30 seconds', () => {
    const options = queryClient.getDefaultOptions();
    const retryDelay = options.queries?.retryDelay;

    expect(typeof retryDelay).toBe('function');
    if (typeof retryDelay === 'function') {
      const error = new Error('retry');
      expect(retryDelay(0, error)).toBe(1000);
      expect(retryDelay(4, error)).toBe(16000);
      expect(retryDelay(6, error)).toBe(30000);
    }
  });

  it('uses expected default mutation options', () => {
    const options = queryClient.getDefaultOptions();

    expect(options.mutations?.retry).toBe(1);
  });
});
