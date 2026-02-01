import { performanceService } from '../../src/services/firebase/PerformanceService';
import { getPerformance, trace, httpMetric } from '@react-native-firebase/perf';

describe('PerformanceService', () => {
  it('starts a custom trace', async () => {
    const traceName = 'test_trace';
    const traceInstance = await performanceService.startTrace(traceName);

    expect(getPerformance).toHaveBeenCalled();
    expect(trace).toHaveBeenCalledWith(expect.anything(), traceName);
    expect(traceInstance.start).toHaveBeenCalled();
  });

  it('stops a custom trace', async () => {
    const mockTrace = {
      stop: jest.fn(() => Promise.resolve()),
    } as any;

    await performanceService.stopTrace(mockTrace);
    expect(mockTrace.stop).toHaveBeenCalled();
  });

  it('tracks an API call manually', async () => {
    const url = 'https://api.test.com';
    const method = 'GET';

    await performanceService.trackApiCall(
      url,
      method,
      200,
      'application/json',
      500,
      1000,
    );

    expect(getPerformance).toHaveBeenCalled();
    expect(httpMetric).toHaveBeenCalledWith(expect.anything(), url, method);
  });

  it('tracks an API call with attributes', async () => {
    const url = 'https://api.test.com';
    const method = 'POST';
    const attributes = { key1: 'value1', key2: 'value2' };

    await performanceService.trackApiCall(
      url,
      method,
      200,
      undefined,
      undefined,
      undefined,
      attributes,
    );

    expect(httpMetric).toHaveBeenCalledWith(expect.anything(), url, method);
  });
});
