import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useContext,
} from 'react';
import { useColorScheme } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { LightTheme, DarkTheme } from './theme';
import { mmkvStorage } from '../services/StorageService';
import { observabilityService } from '../services/ObservabilityService';

export type ThemeType = 'light' | 'dark' | 'system';

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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useColorScheme();

  // Initialize synchronously with MMKV to prevent theme flicker
  const [themeMode, setThemeModeState] = useState<ThemeType>(() => {
    try {
      const saved = mmkvStorage.getString(THEME_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved as ThemeType;
      }
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'ThemeContext.init',
        action: 'read_theme_preference',
      });
    }
    return 'system';
  });

  const setThemeMode = useCallback((mode: ThemeType) => {
    try {
      setThemeModeState(mode);
      mmkvStorage.set(THEME_KEY, mode);
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'ThemeContext.setThemeMode',
        action: 'save_theme_preference',
        mode,
      });
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState(current => {
      let next: ThemeType;
      if (current === 'light') next = 'dark';
      else if (current === 'dark') next = 'light';
      else {
        // If 'system', toggle to the opposite of the current system scheme
        const isSystemDark = systemScheme === 'dark';
        next = isSystemDark ? 'light' : 'dark';
      }

      // Persist the change
      try {
        mmkvStorage.set(THEME_KEY, next);
      } catch (e) {
        // Log silently
      }
      return next;
    });
  }, [systemScheme]);

  // Determine effective theme
  const isDark = useMemo(() => {
    return themeMode === 'system'
      ? systemScheme === 'dark'
      : themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const theme = useMemo(() => (isDark ? DarkTheme : LightTheme), [isDark]);

  const contextValue = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      isDark,
      toggleTheme,
    }),
    [themeMode, setThemeMode, isDark, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <PaperProvider theme={theme}>
        {/* StatusBar management could be here or in screens, 
            but context-aware is better. */}
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
