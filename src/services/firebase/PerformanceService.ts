import perf, { FirebasePerformanceTypes } from '@react-native-firebase/perf';

class PerformanceService {
  /**
   * Start a custom trace
   */
  async startTrace(traceName: string): Promise<FirebasePerformanceTypes.Trace> {
    const trace = await perf().startTrace(traceName);
    return trace;
  }

  /**
   * Stop a custom trace
   */
  async stopTrace(trace: FirebasePerformanceTypes.Trace): Promise<void> {
    await trace.stop();
  }

  /**
   * Track an API call manually (if needed)
   */
  async trackApiCall(url: string, method: string, responseCode: number, duration: number, requestPayloadSize: number, responsePayloadSize: number): Promise<void> {
      const metric = await perf().newHttpMetric(url, method as FirebasePerformanceTypes.HttpMethod);
      await metric.start();
      metric.putAttribute('response_code', responseCode.toString());
      metric.setHttpResponseCode(responseCode);
      metric.setRequestPayloadSize(requestPayloadSize);
      metric.setResponsePayloadSize(responsePayloadSize);
      // Duration is calculated by start/stop, but for manual logging of past requests we might just log attributes
      await metric.stop();
  }
}

export const performanceService = new PerformanceService();
