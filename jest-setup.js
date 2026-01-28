/* global jest */

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

jest.mock('react-native-vector-icons', () => ({
  createIconSet: () => 'Icon',
  createIconSetFromIcoMoon: () => 'Icon',
  createIconSetFromFontello: () => 'Icon',
}));

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const Icon = () => 'Icon';
  Icon.default = Icon;
  return Icon;
});
jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const Icon = () => 'Icon';
  Icon.default = Icon;
  return Icon;
});
jest.mock('react-native-vector-icons/Ionicons', () => {
  const Icon = () => 'Icon';
  Icon.default = Icon;
  return Icon;
});
jest.mock('react-native-vector-icons/Feather', () => {
  const Icon = () => 'Icon';
  Icon.default = Icon;
  return Icon;
});
jest.mock('react-native-vector-icons/FontAwesome', () => {
  const Icon = () => 'Icon';
  Icon.default = Icon;
  return Icon;
});

jest.mock('react-native-device-info', () => {
  return {
    getApplicationName: jest.fn(() => 'Finanzas VE'),
    getVersion: jest.fn(() => '1.0.0'),
    getBuildNumber: jest.fn(() => '100'),
    getLastUpdateTime: jest.fn(() => Promise.resolve(1672531200000)), // Some timestamp
    getDeviceId: jest.fn(() => 'test-device-id'),
    getSystemName: jest.fn(() => 'iOS'),
    getSystemVersion: jest.fn(() => '16.0'),
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
    }),
    useFocusEffect: jest.fn((callback) => callback()),
    createNavigationContainerRef: jest.fn(() => ({
      isReady: jest.fn().mockReturnValue(true),
      navigate: jest.fn(),
      dispatch: jest.fn(),
    })),
  };
});

const messagingMock = {
  hasPermission: jest.fn(() => Promise.resolve(true)),
  requestPermission: jest.fn(() => Promise.resolve(1)),
  getToken: jest.fn(() => Promise.resolve('mock-token')),
  onTokenRefresh: jest.fn(() => jest.fn()),
  onMessage: jest.fn(() => jest.fn()),
  setBackgroundMessageHandler: jest.fn(),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  subscribeToTopic: jest.fn(),
  unsubscribeFromTopic: jest.fn(),
};

const messagingModule = () => messagingMock;
messagingModule.getMessaging = jest.fn(() => messagingMock);
messagingModule.getToken = jest.fn(() => Promise.resolve('mock-token'));
messagingModule.onTokenRefresh = jest.fn(() => jest.fn());
messagingModule.onMessage = jest.fn(() => jest.fn());
messagingModule.setBackgroundMessageHandler = jest.fn();
messagingModule.onNotificationOpenedApp = jest.fn(() => jest.fn());
messagingModule.getInitialNotification = jest.fn(() => Promise.resolve(null));
messagingModule.subscribeToTopic = jest.fn(() => Promise.resolve());
messagingModule.unsubscribeFromTopic = jest.fn(() => Promise.resolve());
messagingModule.requestPermission = jest.fn(() => Promise.resolve(1));
messagingModule.AuthorizationStatus = {
  AUTHORIZED: 1,
  DENIED: 0,
  NOT_DETERMINED: -1,
  PROVISIONAL: 2,
};

jest.mock('@react-native-firebase/messaging', () => messagingModule);

require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};

  return Reanimated;
});

jest.mock('@react-native-firebase/auth', () => {
  const authInstance = {
    onAuthStateChanged: jest.fn(),
    currentUser: {
      email: 'test@test.com',
      uid: 'test-uid',
      displayName: 'Test User',
    },
    signOut: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };
  return {
    __esModule: true,
    default: () => authInstance,
    getAuth: () => authInstance,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };
});

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: View,
  };
});

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ data: { idToken: 'mock-google-token' } })),
    signOut: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/in-app-messaging', () => {
  const inAppMessagingMock = {
    setMessagesDisplaySuppressed: jest.fn(),
    triggerEvent: jest.fn(),
  };
  return {
    __esModule: true,
    default: () => inAppMessagingMock,
    getInAppMessaging: () => inAppMessagingMock,
    setMessagesDisplaySuppressed: jest.fn(),
  };
});

jest.mock('@react-native-firebase/analytics', () => {
  const analyticsInstance = {
    logEvent: jest.fn(),
    logScreenView: jest.fn(),
    setUserProperty: jest.fn(),
    setUserId: jest.fn(),
  };
  return {
    __esModule: true,
    default: () => analyticsInstance,
    getAnalytics: () => analyticsInstance,
    logEvent: jest.fn(),
    logScreenView: jest.fn(),
    setUserProperty: jest.fn(),
    setUserId: jest.fn(),
  };
});

jest.mock(
  '@react-native-firebase/crashlytics',
  () => {
    const crashlyticsInstance = {
      log: jest.fn(),
      recordError: jest.fn(),
      crash: jest.fn(),
      setCrashlyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
      setUserId: jest.fn(() => Promise.resolve()),
      setAttributes: jest.fn(() => Promise.resolve()),
      setAttribute: jest.fn(() => Promise.resolve()),
    };
    return {
      __esModule: true,
      getCrashlytics: () => crashlyticsInstance,
      setUserId: jest.fn((instance, id) => Promise.resolve()),
      setAttributes: jest.fn((instance, attrs) => Promise.resolve()),
      setAttribute: jest.fn((instance, key, val) => Promise.resolve()),
      setCrashlyticsCollectionEnabled: jest.fn((instance, enabled) => Promise.resolve()),
      log: jest.fn((instance, msg) => Promise.resolve()),
      recordError: jest.fn((instance, error) => Promise.resolve()),
    };
  },
  { virtual: true }
);

jest.mock('@react-native-firebase/app-check', () => ({
  initializeAppCheck: jest.fn(() => Promise.resolve({})),
  getToken: jest.fn(() => Promise.resolve({ token: 'mock-app-check-token' })),
}));

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/remote-config', () => {
  const remoteConfigMock = {
    setDefaults: jest.fn(),
    fetchAndActivate: jest.fn(() => Promise.resolve(true)),
    setConfigSettings: jest.fn(),
    getValue: jest.fn((key) => ({
      asString: () => 'mock-string',
      asNumber: () => 123,
      asBoolean: () => true,
    })),
  };
  return {
    __esModule: true,
    default: () => remoteConfigMock,
    getRemoteConfig: () => remoteConfigMock,
    setDefaults: jest.fn(),
    fetchAndActivate: jest.fn(() => Promise.resolve(true)),
    getValue: jest.fn((rc, key) => ({
      asString: () => '{}', // Return valid JSON by default
      asNumber: () => 123,
      asBoolean: () => true,
    })),
  };
});

jest.mock('@react-native-firebase/perf', () => {
  const perfInstance = {
    dataCollectionEnabled: true,
    app: {},
  };
  const traceInstance = {
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    putAttribute: jest.fn(),
  };
  const metricInstance = {
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    putAttribute: jest.fn(),
    setHttpResponseCode: jest.fn(),
    setRequestPayloadSize: jest.fn(),
    setResponsePayloadSize: jest.fn(),
    setResponseContentType: jest.fn(),
  };
  return {
    getPerformance: jest.fn(() => perfInstance),
    initializePerformance: jest.fn(() => Promise.resolve(perfInstance)),
    trace: jest.fn(() => traceInstance),
    httpMetric: jest.fn(() => metricInstance),
  };
});

jest.mock('@react-native-firebase/app-distribution', () => {
  return {
    getAppDistribution: jest.fn(() => ({})),
    checkForUpdate: jest.fn(() => Promise.resolve()),
  };
});

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({
    initialize: jest.fn(() => Promise.resolve()),
  }),
  BannerAd: 'BannerAd',
  BannerAdSize: {
    BANNER: 'BANNER',
    FULL_BANNER: 'FULL_BANNER',
    LARGE_BANNER: 'LARGE_BANNER',
    LEADERBOARD: 'LEADERBOARD',
    MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  },
  TestIds: {
    BANNER: 'test-banner',
  },
}));

// --- New Mocks ---

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: jest.fn((c) => c),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  startTransaction: jest.fn(() => ({
    finish: jest.fn(),
    setTag: jest.fn(),
    setData: jest.fn(),
  })),
  startInactiveSpan: jest.fn(() => ({
    end: jest.fn(),
    setStatus: jest.fn(),
    setAttribute: jest.fn(),
  })),
  mobileReplayIntegration: jest.fn(),
  feedbackIntegration: jest.fn(),
}));

jest.mock('react-native-share', () => ({
  default: {
    open: jest.fn(),
    shareSingle: jest.fn(),
  },
}));

jest.mock('@microsoft/react-native-clarity', () => ({
  initialize: jest.fn(),
  setCustomUserId: jest.fn(),
  setCustomTag: jest.fn(),
  sendCustomEvent: jest.fn(),
  LogLevel: {
    None: 0,
    Verbose: 1,
  },
}));

jest.mock('react-native-view-shot', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    captureRef: jest.fn(() => Promise.resolve('mock-uri')),
    default: (props) => React.createElement(View, props),
    __esModule: true,
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
  })),
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Svg = (props) => React.createElement(View, props);
  const Circle = (props) => React.createElement(View, props);
  const Rect = (props) => React.createElement(View, props);
  const Path = (props) => React.createElement(View, props);
  return {
    __esModule: true,
    default: Svg,
    Circle,
    Rect,
    Path,
    Svg,
    G: (props) => React.createElement(View, props),
    Defs: (props) => React.createElement(View, props),
    ClipPath: (props) => React.createElement(View, props),
    LinearGradient: (props) => React.createElement(View, props),
    Stop: (props) => React.createElement(View, props),
  };
});

jest.mock('react-native-pager-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props) => React.createElement(View, props);
});

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  Screen: ({ children }) => children,
  ScreenContainer: ({ children }) => children,
}));
