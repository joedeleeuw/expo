import { requireNativeModule } from 'expo';
import AppMetrics from 'expo-app-metrics';

import { initRouterIntegration } from './integrations/expo-router/init';
import { isRouterInstalled } from './integrations/expo-router/router';
import { initReactNavigationIntegration } from './integrations/react-navigation/init';
import { isReactNavigationInstalled } from './integrations/react-navigation/reactNavigation';
import type { ObserveConfig, ObserveModule } from './types';

const native = requireNativeModule<ObserveModule>('ExpoObserve');

const Observe: ObserveModule = new Proxy(native, {
  get(target, prop, receiver) {
    if (prop === 'configure') {
      return (config: ObserveConfig) => {
        const routerEnabled = !!config.integrations?.['expo-router'];
        const reactNavigationEnabled = !!config.integrations?.['react-navigation'];

        if (routerEnabled && !isRouterInstalled) {
          console.warn(
            "[expo-observe] `integrations: { 'expo-router': true }` was set, but `expo-router` is not installed. The integration will not initialize."
          );
        }
        if (reactNavigationEnabled && !isReactNavigationInstalled) {
          console.warn(
            "[expo-observe] `integrations: { 'react-navigation': true }` was set, but `@react-navigation/native` is not installed. The integration will not initialize."
          );
        }

        const shouldInitRouterIntegration = routerEnabled && isRouterInstalled;
        const shouldInitReactNavigationIntegration =
          reactNavigationEnabled && isReactNavigationInstalled;

        if (shouldInitRouterIntegration && shouldInitReactNavigationIntegration) {
          console.warn(
            "[expo-observe] Both 'expo-router' and 'react-navigation' integrations are enabled. " +
              "Only 'expo-router' will initialize; 'react-navigation' will be ignored. "
          );
        }

        if (shouldInitRouterIntegration) {
          initRouterIntegration(config.integrations?.['expo-router']);
        } else if (shouldInitReactNavigationIntegration) {
          initReactNavigationIntegration(config.integrations?.['react-navigation']);
        }
        return target.configure(config);
      };
    }

    if (prop === 'reportError') {
      return (error: unknown) => {
        // Normalize an arbitrary thrown value the way the global `ErrorUtils` handler does: read
        // name/message/stack off an `Error`, and fall back to `String(error)` for non-Error throws
        // (strings, plain objects), which have no stack.
        const err = error as { name?: string; message?: string; stack?: string } | undefined;
        AppMetrics.reportError({
          source: 'caught',
          type: err?.name,
          message: err?.message ?? String(error),
          stacktrace: err?.stack,
          isFatal: false,
        });
      };
    }

    // On Android, the native module is a JSI host object, so `prop in target` (and `hasOwnProperty`) report
    // `true` for names it doesn't implement — a host object has no `has` hook. `Object.keys(target)`
    // goes through `getPropertyNames`, which lists the module's actual members, so use it to forward
    // anything not really there (e.g. `logEvent`) to the AppMetrics module.
    if (typeof prop === 'string' && !Object.keys(target).includes(prop)) {
      return Reflect.get(AppMetrics, prop);
    }
    return Reflect.get(target, prop, receiver);
  },
});

export default Observe;
