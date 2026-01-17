import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { FilterProvider } from './src/context/FilterContext';
import AppNavigator from './src/navigation/AppNavigator';
import { fcmService } from './src/services/firebase/FCMService';
import { inAppMessagingService } from './src/services/firebase/InAppMessagingService';
import { appCheckService } from './src/services/firebase/AppCheckService';
import { remoteConfigService } from './src/services/firebase/RemoteConfigService';
import { appDistributionService } from './src/services/firebase/AppDistributionService';

function App(): React.JSX.Element {
  useEffect(() => {
    const initializeFirebase = async () => {
      // App Check (Initialize first)
      await appCheckService.initialize();

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
      }
    };

    initializeFirebase();

    // Foreground listener
    const unsubscribe = fcmService.onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', remoteMessage);
    });

    // Background/Quit state handlers
    fcmService.onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
    });

    fcmService.getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification caused app to open from quit state:', remoteMessage);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FilterProvider>
          <AppNavigator />
        </FilterProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
