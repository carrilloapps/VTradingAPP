import React from 'react';
import { render } from '@testing-library/react-native';
import SettingsScreen from '../src/screens/SettingsScreen';
import { Provider as PaperProvider } from 'react-native-paper';
import { LightTheme } from '../src/theme/theme';

jest.mock('react-native-paper', () => {
  const Actual = jest.requireActual('react-native-paper');
  const { View, Text } = require('react-native');
  return {
    ...Actual,
    Switch: (props: any) => <View testID="switch" {...props} />,
    Snackbar: (props: any) => <View testID="snackbar" {...props} />,
    Button: (props: any) => (
      <View testID="button" {...props}>
        {props.children}
      </View>
    ),
    Text: (props: any) => <Text {...props}>{props.children}</Text>,
  };
});

// Mock dependencies
jest.mock('react-native-device-info', () => ({
  getApplicationName: jest.fn(() => 'Finanzas VE'),
  getVersion: jest.fn(() => '1.0.0'),
  getBuildNumber: jest.fn(() => '100'),
  getDeviceId: jest.fn(() => 'TEST_DEVICE_ID'),
  getSystemName: jest.fn(() => 'Android'),
  getSystemVersion: jest.fn(() => '12'),
}));

jest.mock('../src/services/StorageService', () => ({
  storageService: {
    getSettings: jest.fn().mockResolvedValue({ pushEnabled: true }),
    getAlerts: jest.fn().mockResolvedValue([]),
    saveSettings: jest.fn(),
    saveAlerts: jest.fn(),
  },
}));

jest.mock('../src/services/firebase/FCMService', () => ({
  fcmService: {
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
  },
}));

jest.mock('../src/services/firebase/AnalyticsService', () => ({
  analyticsService: {
    logEvent: jest.fn(),
  },
}));

jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: () => null,
  BannerAdSize: {},
  TestIds: {},
}));

jest.mock('../src/context/NotificationContext', () => ({
  useNotifications: () => ({
    unreadCount: 0,
    notifications: [],
    markAsRead: jest.fn(),
  }),
}));

const mockShowToast = jest.fn();
const mockToastContextValue = {
  showToast: mockShowToast,
};
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => mockToastContextValue,
}));

jest.mock('../src/components/ui/UnifiedHeader', () => {
  const { Text } = require('react-native');
  return ({ title }: any) => <Text>{title}</Text>;
});

jest.mock('../src/components/settings/SettingsSkeleton', () => {
  const { View } = require('react-native');
  return () => <View testID="settings-skeleton" />;
});

jest.mock('../src/components/settings/UserProfileCard', () => {
  const { View } = require('react-native');
  return () => <View testID="user-profile-card" />;
});

jest.mock('../src/components/settings/AlertItem', () => {
  const { View } = require('react-native');
  return () => <View testID="alert-item" />;
});

jest.mock('../src/components/settings/ThemeSelector', () => {
  const { View } = require('react-native');
  return () => <View testID="theme-selector" />;
});

jest.mock('../src/components/settings/MenuButton', () => {
  const { View } = require('react-native');
  return () => <View testID="menu-button" />;
});

jest.mock('../src/components/ui/CustomDialog', () => {
  const { View } = require('react-native');
  return ({ visible, children }: any) =>
    visible ? <View testID="custom-dialog">{children}</View> : null;
});

jest.mock('../src/components/ui/AboutDialog', () => {
  const { View } = require('react-native');
  return () => <View testID="about-dialog" />;
});

jest.mock('../src/components/settings/ProfileEditDialog', () => {
  const { View } = require('react-native');
  return () => <View testID="profile-edit-dialog" />;
});

jest.mock('../src/components/settings/LogoutDialog', () => {
  const { View } = require('react-native');
  return () => <View testID="logout-dialog" />;
});

jest.mock('react-native-safe-area-context', () => {
  const ReactMock = require('react');
  const MOCK_INITIAL_METRICS = {
    frame: { x: 0, y: 0, width: 0, height: 0 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  };
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaConsumer: ({ children }: any) =>
      children(MOCK_INITIAL_METRICS.insets),
    SafeAreaInsetsContext: ReactMock.createContext(MOCK_INITIAL_METRICS.insets),
    useSafeAreaInsets: () => MOCK_INITIAL_METRICS.insets,
    useSafeAreaFrame: () => MOCK_INITIAL_METRICS.frame,
    initialWindowMetrics: MOCK_INITIAL_METRICS,
  };
});

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const { View } = require('react-native');
  return (props: any) => <View testID="icon" {...props} />;
});

// Mock Navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  addListener: jest.fn(() => jest.fn()), // Mock addListener
  isFocused: jest.fn(() => true),
};

jest.mock('@react-navigation/native', () => {
  const MockReact = require('react');
  return {
    useNavigation: () => mockNavigation,
    useFocusEffect: (effect: any) =>
      MockReact.useEffect(() => {
        effect();
      }, [effect]),
    createNavigationContainerRef: jest.fn(() => ({
      isReady: jest.fn().mockReturnValue(true),
      navigate: jest.fn(),
      dispatch: jest.fn(),
    })),
  };
});

// Mock ThemeContext
const mockSetThemeMode = jest.fn();
jest.mock('../src/theme/ThemeContext', () => ({
  useThemeContext: () => ({
    themeMode: 'system',
    setThemeMode: mockSetThemeMode,
    isDark: false,
  }),
}));

const mockAuthContextValue = {
  user: {
    displayName: 'Alejandro Rodriguez',
    email: 'test@example.com',
    isAnonymous: false,
  },
  signOut: jest.fn(),
  updateProfileName: jest.fn(),
  deleteAccount: jest.fn(),
};

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => mockAuthContextValue,
}));

jest.mock('../src/services/ObservabilityService', () => ({
  observabilityService: {
    captureError: jest.fn(),
  },
}));

describe('SettingsScreen', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <PaperProvider theme={LightTheme}>{component}</PaperProvider>,
    );
  };

  it('renders correctly', async () => {
    const { findByText } = renderWithProvider(<SettingsScreen />);

    // Check Header
    expect(await findByText('Configuración')).toBeTruthy();
  });

  /*
    it('renders app info values correctly', async () => {
      const { findByText } = renderWithProvider(<SettingsScreen />);
      expect(await findByText(/Finanzas VE v1.0.0 \(BUILD 100\)/)).toBeTruthy();
    });
  
    it('toggles alerts', async () => {
      const { storageService } = require('../src/services/StorageService');
      storageService.getAlerts.mockResolvedValue([
         { id: '1', symbol: 'ves_usd', target: 50, condition: 'above', isActive: true, iconName: 'currency-usd' }
      ]);
  
      const { getAllByTestId, findByText } = renderWithProvider(<SettingsScreen />);
      await findByText('Configuración');
      const switches = getAllByTestId('switch');
      expect(switches.length).toBeGreaterThanOrEqual(1);
      expect(switches[0]).toBeTruthy();
    });
  
    it('renders theme selector', async () => {
      const { findByText, getByText } = renderWithProvider(<SettingsScreen />);
      await findByText('Configuración');
      expect(getByText('Claro')).toBeTruthy();
      expect(getByText('Oscuro')).toBeTruthy();
      expect(getByText('Sistema')).toBeTruthy();
    });
  */
});
