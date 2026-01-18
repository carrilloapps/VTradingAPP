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
  };
});

const messagingMock = {
  hasPermission: jest.fn(() => Promise.resolve(true)),
  requestPermission: jest.fn(() => Promise.resolve(1)), // AuthorizationStatus.AUTHORIZED
  getToken: jest.fn(() => Promise.resolve('mock-token')),
  onTokenRefresh: jest.fn(() => jest.fn()),
  onMessage: jest.fn(() => jest.fn()),
  setBackgroundMessageHandler: jest.fn(),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  subscribeToTopic: jest.fn(),
  unsubscribeFromTopic: jest.fn(),
};

const messagingFn = () => messagingMock;

// Add statics
messagingFn.AuthorizationStatus = {
  AUTHORIZED: 1,
  DENIED: 0,
  NOT_DETERMINED: -1,
  PROVISIONAL: 2,
};

jest.mock('@react-native-firebase/messaging', () => messagingFn);

jest.mock('@react-native-firebase/auth', () => {
  const authFn = () => ({
    onAuthStateChanged: jest.fn(() => jest.fn()),
    currentUser: { uid: 'test-user', email: 'test@example.com' },
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    signInWithCredential: jest.fn(),
    signInAnonymously: jest.fn(),
  });
  authFn.GoogleAuthProvider = {
    credential: jest.fn(),
  };
  return authFn;
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
  return () => ({
    setMessagesDisplaySuppressed: jest.fn(),
    triggerEvent: jest.fn(),
  });
});

jest.mock('@react-native-firebase/analytics', () => {
  return () => ({
    logEvent: jest.fn(),
    logScreenView: jest.fn(),
    setUserProperty: jest.fn(),
    setUserId: jest.fn(),
  });
});

jest.mock('@react-native-firebase/app-check', () => {
  const appCheckMock = {
    newReactNativeFirebaseAppCheckProvider: jest.fn(() => ({
      configure: jest.fn(),
    })),
    initializeAppCheck: jest.fn(),
    getToken: jest.fn(() => Promise.resolve({ token: 'mock-app-check-token' })),
  };
  return {
    firebase: {
      appCheck: () => appCheckMock,
    },
  };
});

jest.mock('@react-native-firebase/remote-config', () => {
  return () => ({
    setDefaults: jest.fn(),
    fetchAndActivate: jest.fn(() => Promise.resolve(true)),
    setConfigSettings: jest.fn(),
    getValue: jest.fn((key) => ({
      asString: () => 'mock-string',
      asNumber: () => 123,
      asBoolean: () => true,
    })),
  });
});

jest.mock('@react-native-firebase/perf', () => {
  return () => ({
    startTrace: jest.fn(() => Promise.resolve({
      stop: jest.fn(),
      putAttribute: jest.fn(),
    })),
    newHttpMetric: jest.fn(() => Promise.resolve({
      start: jest.fn(),
      stop: jest.fn(),
      putAttribute: jest.fn(),
      setHttpResponseCode: jest.fn(),
      setRequestPayloadSize: jest.fn(),
      setResponsePayloadSize: jest.fn(),
      setResponseContentType: jest.fn(),
    })),
  });
});

jest.mock('@react-native-firebase/app-distribution', () => {
  return () => ({
    checkForUpdate: jest.fn(),
  });
});
