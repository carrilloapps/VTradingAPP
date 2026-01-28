import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from '../src/navigation/AppNavigator';
import * as AuthStore from '../src/stores/authStore';
import * as ThemeContext from '../src/theme/ThemeContext';

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra loading cuando auth está cargando', async () => {
    jest.spyOn(AuthStore, 'useAuthStore').mockReturnValue({
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

    expect(getByText(/Cargando/i)).toBeTruthy();

    await waitFor(() => {});
  });
});
