import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from '../src/navigation/AppNavigator';
import * as AuthContext from '../src/context/AuthContext';
import * as ThemeContext from '../src/theme/ThemeContext';

jest.mock('lottie-react-native', () => 'LottieView');

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra loading cuando auth está cargando', () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      isLoading: true,
    } as any);

    jest.spyOn(ThemeContext, 'useThemeContext').mockReturnValue({
      isDark: false,
    } as any);

    const { getByText } = render(
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    );

    expect(getByText('Cargando')).toBeTruthy();
  });
});
