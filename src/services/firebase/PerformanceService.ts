import { getPerformance, trace as createTrace, httpMetric } from '@react-native-firebase/perf';
import { FirebasePerformanceTypes } from '@react-native-firebase/perf';

class PerformanceService {
  /**
   * Start a custom trace
   */
  async startTrace(traceName: string): Promise<FirebasePerformanceTypes.Trace> {
    const perf = getPerformance();
    const trace = createTrace(perf, traceName);
    await trace.start();
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
  async trackApiCall(
    url: string, 
    method: string, 
    responseCode: number, 
    contentType?: string, 
    requestPayloadSize?: number, 
    responsePayloadSize?: number,
    attributes?: Record<string, string>
  ): Promise<void> {
      const perf = getPerformance();
      const metric = httpMetric(perf, url, method as FirebasePerformanceTypes.HttpMethod);
      await metric.start();
      
      metric.setHttpResponseCode(responseCode);
      if (contentType) metric.setResponseContentType(contentType);
      if (requestPayloadSize) metric.setRequestPayloadSize(requestPayloadSize);
      if (responsePayloadSize) metric.setResponsePayloadSize(responsePayloadSize);
      
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          metric.putAttribute(key, value);
        });
      }

      await metric.stop();
  }
}

export const performanceService = new PerformanceService();
