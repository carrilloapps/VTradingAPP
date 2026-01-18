import { 
  MD3LightTheme as DefaultLightTheme, 
  MD3DarkTheme as DefaultDarkTheme,
} from 'react-native-paper';

// Definición de colores personalizados del diseño (basados en ajustes.html)
const customColors = {
  primary: '#0e4981',
  primaryDark: '#083056',
  primaryLight: '#a5c8ea', // Light variant for Dark Mode Primary
  secondary: '#243647',
  backgroundLight: '#f2f5f8',
  backgroundDark: '#0e1720',
  surfaceDark: '#16212e',
  textSecondary: '#93aec8',
  danger: '#cf4848',
  
  // Semantic colors for Light Mode
  successLight: '#15803d', // green-700
  successBgLight: '#dcfce7', // green-100
  errorLight: '#e11d48', // rose-600
  errorBgLight: '#ffe4e6', // rose-100
  infoLight: '#1d4ed8', // blue-700
  infoBgLight: '#dbeafe', // blue-100
  neutralLight: '#475569', // slate-600
  neutralBgLight: '#f1f5f9', // slate-100
  
  // Semantic colors for Dark Mode
  successDark: '#4ade80', // green-400
  successBgDark: 'rgba(34, 197, 94, 0.2)', // green-500/20
  errorDark: '#fb7185', // rose-400
  errorBgDark: 'rgba(225, 29, 72, 0.3)', // rose-900/30
  infoDark: '#60a5fa', // blue-400
  infoBgDark: 'rgba(59, 130, 246, 0.2)', // blue-500/20
  neutralDark: '#cbd5e1', // slate-300
  neutralBgDark: '#334155', // slate-700
  warning: '#eab308', // yellow-500
  warningDark: '#facc15', // yellow-400

  // Skeleton Colors
  skeletonLight: '#E1E9EE',
  skeletonHighlightLight: '#F2F8FC',
  skeletonDark: '#1c2a3b', // Matches elevation level 2
  skeletonHighlightDark: '#2b3d54', // Matches elevation level 4
};

// Sistema de espaciado centralizado
export const spacing = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
};

// Extendemos el tipo de Theme de React Native Paper
declare global {
  namespace ReactNativePaper {
    interface ThemeColors {
      success: string;
      successContainer: string;
      info: string;
      infoContainer: string;
      neutral: string;
      neutralContainer: string;
      danger: string;
      warning: string;
      skeleton: string;
      skeletonHighlight: string;
    }

    // Add this for MD3
    interface MD3Colors {
        success: string;
        successContainer: string;
        info: string;
        infoContainer: string;
        neutral: string;
        neutralContainer: string;
        danger: string;
        warning: string;
        skeleton: string;
        skeletonHighlight: string;
    }

    interface Theme {
      spacing: typeof spacing;
    }
    interface MD3Theme {
      spacing: typeof spacing;
    }
  }
}

// Tema Claro Personalizado
export const LightTheme = {
  ...DefaultLightTheme,
  roundness: 4,
  spacing,
  colors: {
    ...DefaultLightTheme.colors,
    primary: customColors.primary,
    onPrimary: '#ffffff',
    primaryContainer: '#DBEAFE',
    onPrimaryContainer: customColors.primary,
    secondary: customColors.secondary,
    onSecondary: '#ffffff',
    secondaryContainer: customColors.neutralBgLight,
    onSecondaryContainer: customColors.secondary,
    tertiary: customColors.secondary,
    onTertiary: '#ffffff',
    tertiaryContainer: customColors.neutralBgLight,
    onTertiaryContainer: customColors.secondary,
    background: customColors.backgroundLight,
    surface: '#ffffff',
    surfaceVariant: '#E2E8F0',
    onSurface: '#0F172A',
    onSurfaceVariant: '#64748B',
    error: customColors.errorLight,
    errorContainer: customColors.errorBgLight,
    outline: '#CBD5E1', // slate-300 for better visibility in light mode
    elevation: {
      level0: 'transparent',
      level1: '#ffffff',
      level2: '#f8fafc', // slate-50
      level3: '#f1f5f9', // slate-100
      level4: '#e2e8f0', // slate-200
      level5: '#cbd5e1', // slate-300
    },
    
    // Extensiones semánticas (disponibles vía theme.colors.extension...)
    success: customColors.successLight,
    successContainer: customColors.successBgLight,
    info: customColors.infoLight,
    infoContainer: customColors.infoBgLight,
    neutral: customColors.neutralLight,
    neutralContainer: customColors.neutralBgLight,
    danger: customColors.danger,
    warning: customColors.warning,
    skeleton: customColors.skeletonLight,
    skeletonHighlight: customColors.skeletonHighlightLight,
  },
};

// Tema Oscuro Personalizado (Coincide con el diseño HTML)
export const DarkTheme = {
  ...DefaultDarkTheme,
  roundness: 4,
  spacing,
  colors: {
    ...DefaultDarkTheme.colors,
    primary: customColors.primaryLight,
    onPrimary: customColors.primaryDark,
    primaryContainer: customColors.primaryDark,
    onPrimaryContainer: customColors.primaryLight,
    secondary: customColors.secondary,
    onSecondary: '#ffffff',
    secondaryContainer: customColors.neutralBgDark,
    onSecondaryContainer: '#ffffff',
    tertiary: customColors.secondary,
    onTertiary: '#ffffff',
    tertiaryContainer: customColors.neutralBgDark,
    onTertiaryContainer: '#ffffff',
    background: customColors.backgroundDark,
    surface: customColors.surfaceDark,
    surfaceVariant: customColors.surfaceDark,
    onSurface: '#ffffff',
    onSurfaceVariant: customColors.textSecondary,
    error: customColors.errorDark,
    errorContainer: customColors.errorBgDark,
    outline: 'rgba(255, 255, 255, 0.05)', // border-white/5
    elevation: {
      level0: 'transparent',
      level1: '#16212e', // surfaceDark
      level2: '#1c2a3b', // slightly lighter
      level3: '#233348', // even lighter
      level4: '#2b3d54',
      level5: '#324661',
    },
    
    // Extensiones semánticas
    success: customColors.successDark,
    successContainer: customColors.successBgDark,
    info: customColors.infoDark,
    infoContainer: customColors.infoBgDark,
    neutral: customColors.neutralDark,
    neutralContainer: customColors.neutralBgDark,
    danger: customColors.danger,
    warning: customColors.warningDark,
    skeleton: customColors.skeletonDark,
    skeletonHighlight: customColors.skeletonHighlightDark,
  },
};
