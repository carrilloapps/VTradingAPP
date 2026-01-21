import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SettingsScreen from '../src/screens/SettingsScreen';
import { Provider as PaperProvider } from 'react-native-paper';

// Mock dependencies
jest.mock('react-native-safe-area-context', () => {
  const ReactMock = require('react');
  const MOCK_INITIAL_METRICS = {
    frame: { x: 0, y: 0, width: 0, height: 0 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  };
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaConsumer: ({ children }: any) => children(MOCK_INITIAL_METRICS.insets),
    SafeAreaInsetsContext: ReactMock.createContext(MOCK_INITIAL_METRICS.insets),
    useSafeAreaInsets: () => MOCK_INITIAL_METRICS.insets,
    useSafeAreaFrame: () => MOCK_INITIAL_METRICS.frame,
    initialWindowMetrics: MOCK_INITIAL_METRICS,
  };
});

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock ThemeContext
jest.mock('../src/theme/ThemeContext', () => ({
  useThemeContext: () => ({
    themeMode: 'system',
    setThemeMode: jest.fn(),
    isDark: false,
  }),
}));

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      displayName: 'Alejandro Rodriguez',
      email: 'test@example.com',
      isAnonymous: false,
    },
    signOut: jest.fn(),
    updateProfileName: jest.fn(),
    deleteAccount: jest.fn(),
  }),
}));

describe('SettingsScreen', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <PaperProvider>
        {component}
      </PaperProvider>
    );
  };

  it('renders correctly', () => {
    const { getByText } = renderWithProvider(<SettingsScreen />);
    
    // Check Header
    expect(getByText('Configuración')).toBeTruthy();
    
    // Check User Profile
    expect(getByText('Alejandro Rodriguez')).toBeTruthy();
    expect(getByText('PRO')).toBeTruthy();
    
    // Check Alerts Section
    expect(getByText('ALERTAS ACTIVAS')).toBeTruthy();
    expect(getByText('Crea tu primera alerta')).toBeTruthy();
    
    // Check Preferences Section
    expect(getByText('PREFERENCIAS')).toBeTruthy();
    expect(getByText('Notificaciones push')).toBeTruthy();
    expect(getByText('Apariencia')).toBeTruthy();
    
    // Check Account Section
    expect(getByText('CUENTA')).toBeTruthy();
    expect(getByText('Políticas de privacidad')).toBeTruthy();
    expect(getByText('Términos y condiciones')).toBeTruthy();
    expect(getByText('Eliminar cuenta')).toBeTruthy();
    expect(getByText('Cerrar sesión')).toBeTruthy();
    
    // Check Footer (Wait for effect)
    // We expect "Finanzas VE v1.0.0 (100)"
  });

  it('renders app info values correctly', async () => {
    const { findByText } = renderWithProvider(<SettingsScreen />);
    
    // Check for the footer string format
    expect(await findByText(/Finanzas VE v1.0.0 \(BUILD 100\)/)).toBeTruthy();
  });

  it('toggles alerts', () => {
    const { getAllByRole } = renderWithProvider(<SettingsScreen />);
    
    // Assuming AlertItem uses Switch which has role 'switch' or we can find by other means
    // Since AlertItem implementation might use custom switch or paper Switch
    // Let's check the code of AlertItem in previous turn. 
    // It used: <Switch value={isActive} onValueChange={onToggle} color={theme.colors.primary} />
    
    const switches = getAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(1);
    
    // Toggle first alert
    fireEvent(switches[0], 'valueChange', false);
    // State change is internal to SettingsScreen for now (mock state), so we verify it doesn't crash
  });

  it('renders theme selector', () => {
    const { getByText } = renderWithProvider(<SettingsScreen />);
    expect(getByText('Claro')).toBeTruthy();
    expect(getByText('Oscuro')).toBeTruthy();
    expect(getByText('Sistema')).toBeTruthy();
  });
});
