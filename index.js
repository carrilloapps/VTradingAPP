if (!__DEV__) {
    console.log = () => { };
    console.info = () => { };
    console.debug = () => { };
}

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { fcmService } from './src/services/firebase/FCMService';
import { handleBackgroundMessage } from './src/services/NotificationLogic';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widget/widgetTaskHandler';

// Register background handler
fcmService.setBackgroundMessageHandler(handleBackgroundMessage);

// Register widget task handler
registerWidgetTaskHandler(widgetTaskHandler);

AppRegistry.registerComponent(appName, () => App);
