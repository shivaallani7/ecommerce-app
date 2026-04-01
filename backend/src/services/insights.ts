import { env } from '../config/env';
import { logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let appInsights: any = null;
let initialized = false;

export function initAppInsights(): void {
  if (!env.azure.appInsightsConnectionString || initialized) return;

  try {
    // Dynamic require so the app starts even if the module is missing
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    appInsights = require('applicationinsights');

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
  } catch {
    logger.warn('applicationinsights module not available — telemetry disabled.');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getClient(): any | null {
  if (!initialized || !appInsights) return null;
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
