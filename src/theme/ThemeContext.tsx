import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider as PaperProvider } from 'react-native-paper';
import { LightTheme, DarkTheme } from './theme';
import { observabilityService } from '../services/ObservabilityService';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeType;
  setThemeMode: (mode: ThemeType) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  setThemeMode: () => {},
  isDark: false,
  toggleTheme: () => {},
});

const THEME_KEY = 'user_theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeType>('system');
  const [isReady, setIsReady] = useState(false);

  // Cargar preferencia guardada al iniciar
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme) {
          setThemeModeState(savedTheme as ThemeType);
        }
      } catch (e) {
        observabilityService.captureError(e, {
          context: 'ThemeContext.loadTheme',
          action: 'load_theme_preference'
        });
        // Failed to load theme preference
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeType) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'ThemeContext.setThemeMode',
        action: 'save_theme_preference',
        mode: mode
      });
      // Failed to save theme preference
    }
  };

  const toggleTheme = () => {
    if (themeMode === 'light') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('light');
    else {
      // Si está en 'system', cambiamos al opuesto del sistema y lo fijamos manual
      const currentIsDark = systemScheme === 'dark';
      setThemeMode(currentIsDark ? 'light' : 'dark');
    }
  };

  // Determinar si es oscuro
  const isDark = themeMode === 'system' 
    ? systemScheme === 'dark' 
    : themeMode === 'dark';

  const theme = isDark ? DarkTheme : LightTheme;

  if (!isReady) {
    return null; // O un splash screen
  }

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, toggleTheme }}>
      <PaperProvider theme={theme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
