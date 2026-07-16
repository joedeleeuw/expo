import { NativeModule, registerWebModule } from 'expo';
import AppMetrics, { type LogEventOptions, type MetricAttributes } from 'expo-app-metrics';

import type {
  ObserveConfig,
  ObserveIntegrationsConfig,
  ObserveModule,
  ObserveModuleEvents,
  ObserveAttributes,
} from './types';

class ExpoObserveModule extends NativeModule<ObserveModuleEvents> implements ObserveModule {
  async dispatchEvents() {}
  configure(config: ObserveConfig): void {}
  getIntegrations(): ObserveIntegrationsConfig {
    return {};
  }
  logEvent(name: string, options?: LogEventOptions): void {
    AppMetrics.logEvent(name, options);
  }
  reportError(error: unknown): void {
    const err = error as { name?: string; message?: string; stack?: string } | undefined;
    AppMetrics.reportError({
      source: 'caught',
      type: err?.name,
      message: err?.message ?? String(error),
      stacktrace: err?.stack,
      isFatal: false,
    });
  }
  markFirstRender(): void {
    AppMetrics.markFirstRender();
  }
  markInteractive(attributes?: MetricAttributes): void {
    AppMetrics.markInteractive(attributes);
  }
  setGlobalAttributes(attributes?: ObserveAttributes | null): void {
    AppMetrics.setGlobalAttributes(attributes);
  }
  setBundleDefaults(defaults: { environment: string; isJsDev: boolean }): void {}
}

export default registerWebModule(ExpoObserveModule, 'ExpoObserve');
