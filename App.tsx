import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, UIManager } from 'react-native';
import { ThemeProvider } from './src/theme/ThemeContext';

// Enable LayoutAnimation for Android (Old Architecture only)
if (Platform.OS === 'android' && !(globalThis as any).nativeFabricUIManager) {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

import { FilterProvider } from './src/context/FilterContext';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { fcmService } from './src/services/firebase/FCMService';
import { inAppMessagingService } from './src/services/firebase/InAppMessagingService';
import { appCheckService } from './src/services/firebase/AppCheckService';
import { remoteConfigService } from './src/services/firebase/RemoteConfigService';
import { appDistributionService } from './src/services/firebase/AppDistributionService';
import NotificationController from './src/components/ui/NotificationController';
import mobileAds from 'react-native-google-mobile-ads';
import { getCrashlytics, setCrashlyticsCollectionEnabled, log } from '@react-native-firebase/crashlytics';
import { getPerformance, trace, initializePerformance } from '@react-native-firebase/perf';
import * as Sentry from '@sentry/react-native';

// Silence Firebase modular deprecation warnings
// @ts-ignore
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

const isProd = !__DEV__;

Sentry.init({
  dsn: 'https://8978e60b895f59f65a44a1aee2a3e1f3@o456904.ingest.us.sentry.io/4510745960120320',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: false,

  // Enable Logs
  enableLogs: !isProd,

  // Configure Session Replay
  replaysSessionSampleRate: isProd ? 0.0 : 0.1,
  replaysOnErrorSampleRate: isProd ? 0.1 : 1,
  tracesSampleRate: isProd ? 0.1 : 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

function App(): React.JSX.Element {
  useEffect(() => {
    const initializeFirebase = async () => {
      const crashlytics = getCrashlytics();
      await setCrashlyticsCollectionEnabled(crashlytics, true);
      log(crashlytics, 'App start');

      const perf = getPerformance();
      if (!perf.dataCollectionEnabled) {
        await initializePerformance(perf.app, { dataCollectionEnabled: true });
      }
      const initTrace = trace(perf, 'app_initialize');
      await initTrace.start();

      try {
        await appCheckService.initialize();

        await mobileAds().initialize();

        await remoteConfigService.initialize();

        await inAppMessagingService.initialize();

        await appDistributionService.checkForUpdate();

        const hasPermission = await fcmService.requestUserPermission();
        if (hasPermission) {
          await fcmService.getFCMToken();
          await fcmService.subscribeToDemographics();
        }
      } finally {
        await initTrace.stop();
      }
    };

    initializeFirebase();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <NotificationProvider>
                <FilterProvider>
                  <AppNavigator />
                  <NotificationController />
                </FilterProvider>
              </NotificationProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);
