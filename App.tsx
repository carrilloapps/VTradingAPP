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
import { getCrashlytics } from '@react-native-firebase/crashlytics';
import { getPerformance } from '@react-native-firebase/perf';

function App(): React.JSX.Element {
  useEffect(() => {
    const initializeFirebase = async () => {
      const crashlytics = getCrashlytics();
      await crashlytics.setCrashlyticsCollectionEnabled(true);
      crashlytics.log('App start');

      const perf = getPerformance();
      if (!perf.dataCollectionEnabled) {
        await perf.setPerformanceCollectionEnabled(true);
      }

      // App Check (Initialize first)
      await appCheckService.initialize();

      await mobileAds().initialize();

      // Remote Config
      await remoteConfigService.initialize();

      // In-App Messaging
      await inAppMessagingService.initialize();

      // App Distribution (Check for updates)
      await appDistributionService.checkForUpdate();

      // FCM
      const hasPermission = await fcmService.requestUserPermission();
      if (hasPermission) {
        await fcmService.getFCMToken();
        await fcmService.subscribeToDemographics();
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

export default App;
