import { 
  MD3LightTheme as DefaultLightTheme, 
  MD3DarkTheme as DefaultDarkTheme,
} from 'react-native-paper';

// Definición de colores personalizados del diseño
const customColors = {
  primary: '#3B82F6',
  backgroundDark: '#0A0F14',
  surfaceDark: '#161D26',
  surfaceAccent: '#1E293B',
  accentGreen: '#10B981',
  accentRed: '#EF4444',
  textSecondary: '#94A3B8',
};

// Tema Claro Personalizado (Adaptado para mantener coherencia, aunque el diseño es dark-first)
export const LightTheme = {
  ...DefaultLightTheme,
  colors: {
    ...DefaultLightTheme.colors,
    primary: customColors.primary,
    onPrimary: '#ffffff',
    primaryContainer: '#DBEAFE', // Azul claro
    secondary: customColors.surfaceAccent,
    background: '#F8FAFC', // Slate 50
    surface: '#ffffff',
    surfaceVariant: '#E2E8F0',
    onSurface: '#0F172A',
    onSurfaceVariant: '#64748B',
    error: customColors.accentRed,
    outline: '#E2E8F0',
    // Custom properties
    accentGreen: customColors.accentGreen,
    accentRed: customColors.accentRed,
  },
};

// Tema Oscuro Personalizado (Coincide con el diseño HTML)
export const DarkTheme = {
  ...DefaultDarkTheme,
  colors: {
    ...DefaultDarkTheme.colors,
    primary: customColors.primary,
    onPrimary: '#ffffff',
    primaryContainer: '#1D4ED8',
    secondary: customColors.surfaceAccent,
    background: customColors.backgroundDark,
    surface: customColors.surfaceDark,
    surfaceVariant: customColors.surfaceAccent,
    onSurface: '#ffffff',
    onSurfaceVariant: customColors.textSecondary,
    error: customColors.accentRed,
    outline: 'rgba(255, 255, 255, 0.05)', // border-white/5
    // Custom properties for easy access
    accentGreen: customColors.accentGreen,
    accentRed: customColors.accentRed,
  },
};
