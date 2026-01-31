import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Clarity from '@microsoft/react-native-clarity';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, UIManager, StyleSheet } from 'react-native';
import { ThemeProvider } from './src/theme/ThemeContext';

// Enable LayoutAnimation for Android (Old Architecture only)
if (Platform.OS === 'android' && !(globalThis as any).nativeFabricUIManager) {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { inAppMessagingService } from './src/services/firebase/InAppMessagingService';
import { appCheckService } from './src/services/firebase/AppCheckService';
import { remoteConfigService } from './src/services/firebase/RemoteConfigService';
import { appDistributionService } from './src/services/firebase/AppDistributionService';
import NotificationController from './src/components/ui/NotificationController';
import NoInternetModal from './src/components/ui/NoInternetModal';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/config/queryClient';
import mobileAds from 'react-native-google-mobile-ads';
import { getCrashlytics, setCrashlyticsCollectionEnabled, log } from '@react-native-firebase/crashlytics';
import { getPerformance, trace, initializePerformance } from '@react-native-firebase/perf';
import * as Sentry from '@sentry/react-native';
import { AppConfig } from './src/constants/AppConfig';
import { deepLinkService } from './src/services/DeepLinkService';
import { notificationInitService } from './src/services/NotificationInitService';
import { analyticsService } from './src/services/firebase/AnalyticsService';
import { useNetworkStore } from './src/stores/networkStore';

// Silence Firebase modular deprecation warnings
// @ts-ignore
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

const isProd = AppConfig.IS_PROD;

Clarity.initialize(AppConfig.CLARITY_PROJECT_ID, {
  logLevel: isProd ? Clarity.LogLevel.None : Clarity.LogLevel.Verbose,
});

Sentry.init({
  dsn: AppConfig.SENTRY_DSN,

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

import ErrorBoundary from './src/components/ErrorBoundary';
import ToastContainer from './src/components/ui/ToastContainer';

function App(): React.JSX.Element {
  useEffect(() => {
    const sessionStartTime = Date.now();

    // Log session start (Custom event)
    analyticsService.logSessionStart();

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
        // App Check must be first to ensure tokens are ready for other requests
        await appCheckService.initialize();

        await mobileAds().initialize();

        // Initialize Remote Config early to apply feature flags
        await remoteConfigService.initialize();

        await inAppMessagingService.initialize();

        await appDistributionService.checkForUpdate();

        // Initialize notification system (checks permissions, gets token, subscribes to topics)
        await notificationInitService.initialize();
      } catch (e) {
        // Safe catch to ensure app continues even if initialization fails
        console.error('Firebase initialization error:', e);
      } finally {
        await initTrace.stop();
      }
    };

    initializeFirebase();

    // Initialize Deep Link Handling
    const cleanupDeepLinks = deepLinkService.init();

    // Initialize Network Listener
    const cleanupNetwork = useNetworkStore.getState().initialize();

    return () => {
      // Log session end with duration (Custom event)
      const sessionDuration = Date.now() - sessionStartTime;
      analyticsService.logSessionEnd(sessionDuration);

      cleanupDeepLinks();
      cleanupNetwork();
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.container}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <NotificationProvider>
                <NotificationController />
                <NoInternetModal />
                <ToastContainer />
                <AppNavigator />
              </NotificationProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Sentry.wrap(App);
