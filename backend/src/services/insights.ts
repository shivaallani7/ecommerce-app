import appInsights from 'applicationinsights';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let initialized = false;

export function initAppInsights(): void {
  if (!env.azure.appInsightsConnectionString || initialized) return;

  appInsights
    .setup(env.azure.appInsightsConnectionString)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(true)
    .start();

  initialized = true;
  logger.info('Azure Application Insights initialized.');
}

function getClient(): appInsights.TelemetryClient | null {
  if (!initialized) return null;
  return appInsights.defaultClient;
}

export function trackEvent(name: string, properties?: Record<string, string>): void {
  getClient()?.trackEvent({ name, properties });
}

export function trackException(error: Error, properties?: Record<string, string>): void {
  getClient()?.trackException({ exception: error, properties });
}

export function trackMetric(name: string, value: number): void {
  getClient()?.trackMetric({ name, value });
}

export function trackPageView(name: string, url?: string): void {
  getClient()?.trackPageView({ id: name, name, url });
}
