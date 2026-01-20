import { 
  MD3LightTheme as DefaultLightTheme, 
  MD3DarkTheme as DefaultDarkTheme,
  useTheme as usePaperTheme,
  MD3Theme,
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

  // Trend Colors (Matching StockItem and MarketStatus)
  trendUp: '#10B981', // emerald-500
  trendDown: '#EF4444', // red-500
  
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

// Define Custom Colors Interface
export interface CustomColors {
    trendUp: string;
    trendDown: string;
    skeleton: string;
    skeletonHighlight: string;
    success: string;
    successContainer: string;
    info: string;
    infoContainer: string;
    neutral: string;
    neutralContainer: string;
    danger: string;
    warning: string;
}

// Define AppTheme Type
export type AppTheme = Omit<MD3Theme, 'colors'> & {
    colors: MD3Theme['colors'] & CustomColors;
    spacing: typeof spacing;
};

// Custom Hook to use the theme with types
export const useAppTheme = () => usePaperTheme<AppTheme>();

// Tema Claro Personalizado
export const LightTheme: AppTheme = {
  ...DefaultLightTheme,
  colors: {
    ...DefaultLightTheme.colors,
    primary: customColors.primary,
    onPrimary: '#ffffff',
    primaryContainer: customColors.primaryLight,
    onPrimaryContainer: customColors.primaryDark,
    secondary: customColors.secondary,
    onSecondary: '#ffffff',
    secondaryContainer: '#d1e4f6',
    onSecondaryContainer: '#0e1d2a',
    tertiary: '#526679',
    onTertiary: '#ffffff',
    tertiaryContainer: '#d7e2ee',
    onTertiaryContainer: '#0f1d2a',
    error: customColors.errorLight,
    errorContainer: customColors.errorBgLight,
    onError: '#ffffff',
    onErrorContainer: '#881337', // rose-900
    background: customColors.backgroundLight,
    onBackground: '#1a1c1e',
    surface: '#ffffff',
    onSurface: '#1a1c1e',
    surfaceVariant: '#dfe3eb',
    onSurfaceVariant: '#42474e',
    outline: '#E0E4EA', // Material Level Match (Subtle Light)
    outlineVariant: '#EFF2F7',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#2e3135',
    inverseOnSurface: '#f0f0f3',
    inversePrimary: '#a5c8ea',
    elevation: {
      level0: 'transparent',
      level1: '#f6f9fc',
      level2: '#f0f4f9',
      level3: '#e9eff6',
      level4: '#e4eaf4',
      level5: '#dee5f1',
    },
    // Custom Semantic Colors
    success: customColors.successLight,
    successContainer: customColors.successBgLight,
    info: customColors.infoLight,
    infoContainer: customColors.infoBgLight,
    neutral: customColors.neutralLight,
    neutralContainer: customColors.neutralBgLight,
    danger: customColors.danger,
    warning: customColors.warning,
    trendUp: customColors.trendUp,
    trendDown: customColors.trendDown,
    skeleton: customColors.skeletonLight,
    skeletonHighlight: customColors.skeletonHighlightLight,
  },
  spacing,
};

// Tema Oscuro Personalizado
export const DarkTheme: AppTheme = {
  ...DefaultDarkTheme,
  colors: {
    ...DefaultDarkTheme.colors,
    primary: customColors.primaryLight,
    onPrimary: customColors.primaryDark,
    primaryContainer: customColors.primaryDark,
    onPrimaryContainer: customColors.primaryLight,
    secondary: '#b9c8da',
    onSecondary: '#243240',
    secondaryContainer: '#3a4857',
    onSecondaryContainer: '#d5e4f7',
    tertiary: '#baccdd',
    onTertiary: '#243240',
    tertiaryContainer: '#3c4956',
    onTertiaryContainer: '#d7e2ee',
    error: customColors.errorDark,
    errorContainer: customColors.errorBgDark,
    onError: '#601410',
    onErrorContainer: customColors.errorDark,
    background: customColors.backgroundDark,
    onBackground: '#e2e2e5',
    surface: customColors.surfaceDark,
    onSurface: '#e2e2e5',
    surfaceVariant: '#42474e',
    onSurfaceVariant: '#c2c7cf',
    outline: '#2A3744', // Material Level Match (Subtle Dark)
    outlineVariant: '#2B3846',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#e2e2e5',
    inverseOnSurface: '#2e3135',
    inversePrimary: customColors.primary,
    elevation: {
      level0: 'transparent',
      level1: '#1e2b38', // Slightly lighter than background
      level2: '#23303e',
      level3: '#293645',
      level4: '#2e3c4d',
      level5: '#344355',
    },
    // Custom Semantic Colors
    success: customColors.successDark,
    successContainer: customColors.successBgDark,
    info: customColors.infoDark,
    infoContainer: customColors.infoBgDark,
    neutral: customColors.neutralDark,
    neutralContainer: customColors.neutralBgDark,
    danger: customColors.danger,
    warning: customColors.warningDark,
    trendUp: customColors.trendUp,
    trendDown: customColors.trendDown,
    skeleton: customColors.skeletonDark,
    skeletonHighlight: customColors.skeletonHighlightDark,
  },
  spacing,
};
