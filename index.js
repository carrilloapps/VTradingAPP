/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { fcmService } from './src/services/firebase/FCMService';
import { handleBackgroundMessage } from './src/services/NotificationLogic';

// Register background handler
fcmService.setBackgroundMessageHandler(handleBackgroundMessage);

AppRegistry.registerComponent(appName, () => App);
