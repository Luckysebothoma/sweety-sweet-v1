import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment, metrics } from 'src/environments/environment';
import { AppMetrics } from '../models/candy-list';
import { LoggerRequestService } from './logger-request.service';

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private metricTimers: Record<string, { start?: number; end?: number; latency?: number }> = {};

  private readonly urls = {
    backend: metrics.monitoring.server,
    metrics: metrics.monitoring.frontendMetricsEndpoint,
    console: metrics.frontEndFullUrl.frontendConsoleUrl,
    error: metrics.frontEndFullUrl.frontendErrorUrl
  };

  constructor(private logger: LoggerRequestService) {}

  /** Start time tracking */
  trackMetricStart(metricKey: string) {
    this.metricTimers[metricKey] = { start: performance.now() };
  }

  /** End time tracking and return latency */
  trackMetricEnd(metricKey: string): number {
    const timer = this.metricTimers[metricKey];
    if (timer?.start) {
      timer.end = performance.now();
      timer.latency = timer.end - timer.start;
      return timer.latency;
    }
    return 0;
  }

  /** Unified HTTP metric sender */
  private async postMetric(url: string, payload: any, label = 'metric') {
    try {
      
      await axios.post(url, payload);
    } catch (err) {
      console.error(`❌ Failed to send ${label}`, err);
    }
  }

  sendFrontendMetric(metricName: string, value: number, type: 'gauge' | 'counter' = 'gauge', labels: Record<string, string> = {}) {
    const payload = { metricName, value, type, labels };
    const url = `${this.urls.backend}${this.urls.metrics}`;
    console.log(`📤 Sending frontend metric: ${JSON.stringify(payload)}`);
    //return this.postMetric(url, payload, 'frontend metric');
    return
  }

  sendFrontendConsoleMetric(metricName: string, value: number, type: 'gauge' | 'counter' = 'gauge', labels: { appName: string, metrics: string }) {
    const payload = { metricName, value, type, labels };
    //return this.postMetric(this.urls.console, payload, 'frontend console metric');  
    return;
  }

  sendFrontendConsoleLog(componentName: string, value: string) {
    if (!value ) {
      console.error('❌ Invalid log format. Expected a string.');
      return;
    }
    console.log("📝 Logging frontend console message:", value);
    //return this.postMetric(metrics.monitoring.server + metrics.monitoring.frontendConsolePath, { value }, 'frontend console log');
  
    return;
  }

  sendFrontendError(componentName: string, value: string) {
    const payload = { componentName, value };
    console.log("🔥 Sending frontend error:", payload);
    //return this.postMetric(this.urls.error, payload, 'frontend error');
      
    return;
  }

  sendFrontendErrors(componentName: string, value: string) {
    const start = new Date();

    this.sendFrontendConsoleLog(`Sending frontend error: ${componentName} with value: ${value} at ${start.toISOString()}`, value);
    this.sendFrontendError(componentName, value);
    const end = new Date();
    this.sendFrontendConsoleLog(`Finished sending frontend error at ${end.toISOString()}. Duration: ${end.getTime() - start.getTime()}ms`, '');
  
  }

  // Dynamically create and return AppMetric
  createAppMetric(metricName: string, value: number, labels: { appName: string; metrics: string }): AppMetrics {
    return { metricName, value, labels };
  }
}
