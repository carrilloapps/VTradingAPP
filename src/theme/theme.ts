import { 
  MD3LightTheme as DefaultLightTheme, 
  MD3DarkTheme as DefaultDarkTheme,
  useTheme as usePaperTheme,
  MD3Theme,
  configureFonts,
} from 'react-native-paper';

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
    buttonBorder: string;
}

// Define AppTheme Type
export type AppTheme = Omit<MD3Theme, 'colors'> & {
    colors: MD3Theme['colors'] & CustomColors;
    spacing: typeof spacing;
};

// Custom Hook to use the theme with types
export const useAppTheme = () => usePaperTheme<AppTheme>();

// Paleta de Colores Material 3 (Green/Financial Focus)
// Generated for primary color: #006C4C (Financial Green)

const lightColors = {
  primary: '#006C4C',
  onPrimary: '#FFFFFF',
  primaryContainer: '#89F8C6',
  onPrimaryContainer: '#002114',
  secondary: '#4C6358',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#CEE9DA',
  onSecondaryContainer: '#092016',
  tertiary: '#3E6373',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#C2E8FB',
  onTertiaryContainer: '#001F29',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  background: '#FBFDF9',
  onBackground: '#191C1A',
  surface: '#FBFDF9',
  onSurface: '#191C1A',
  surfaceVariant: '#DBE5DE',
  onSurfaceVariant: '#404944',
  outline: '#CFD6D2', // Even subtler for light mode
  outlineVariant: '#E0E6E2', // Very light for decorative borders
  buttonBorder: '#747C78', // Stronger contrast for buttons
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2E312F',
  inverseOnSurface: '#F0F2EE',
  inversePrimary: '#6DDBAC',
  elevation: {
    level0: 'transparent',
    level1: '#F0F5F2', 
    level2: '#EAF1ED',
    level3: '#E4EDE8',
    level4: '#E2ECE7',
    level5: '#DDE9E4',
  },
};

const darkColors = {
  primary: '#6DDBAC',
  onPrimary: '#003825',
  primaryContainer: '#005138',
  onPrimaryContainer: '#89F8C6',
  secondary: '#B3CCBE',
  onSecondary: '#1F352B',
  secondaryContainer: '#354B41',
  onSecondaryContainer: '#CEE9DA',
  tertiary: '#A6CCE0',
  onTertiary: '#083543',
  tertiaryContainer: '#254B5B',
  onTertiaryContainer: '#C2E8FB',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#191C1A',
  onBackground: '#E1E3DF',
  surface: '#191C1A',
  onSurface: '#E1E3DF',
  surfaceVariant: '#404944',
  onSurfaceVariant: '#BFC9C2',
  outline: '#2F3633', // Slightly more visible/lighter than #262A28
  outlineVariant: '#1F2321', // Almost blends with background
  buttonBorder: '#8E9692', // Stronger contrast for buttons
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E1E3DF',
  inverseOnSurface: '#2E312F',
  inversePrimary: '#006C4C',
  elevation: {
    level0: 'transparent',
    level1: '#212523', // Surface + 5% primary tint approx (Dark)
    level2: '#262A28',
    level3: '#2B2F2D',
    level4: '#2C312E',
    level5: '#303532',
  },
};

// Semantic Colors for Financial App
const semanticColors = {
  trendUp: '#006C4C', // Using primary green for positive trend
  trendDown: '#BA1A1A', // Using error red for negative trend
  
  // Custom Semantic definitions mapped to M3 logic
  success: '#006C4C',
  successContainer: '#89F8C6',
  
  info: '#3E6373', // Using Tertiary for info
  infoContainer: '#C2E8FB',
  
  neutral: '#4C6358', // Using Secondary for neutral
  neutralContainer: '#CEE9DA',
  
  danger: '#BA1A1A', // Error
  warning: '#E6C449', // Custom yellow/gold, ensuring visibility
};

// Tema Claro Personalizado
export const LightTheme: AppTheme = {
  ...DefaultLightTheme,
  colors: {
    ...DefaultLightTheme.colors,
    ...lightColors,
    
    // Custom Semantic
    ...semanticColors,
    trendUp: '#168953', // Slightly brighter green for charts/trends
    trendDown: '#D32F2F', // Standard Red
    warning: '#F57C00', // Orange-ish warning
    
    skeleton: '#E1E9EE',
    skeletonHighlight: '#F2F8FC',
    buttonBorder: '#747C78',
  },
  spacing,
};

// Tema Oscuro Personalizado
export const DarkTheme: AppTheme = {
  ...DefaultDarkTheme,
  colors: {
    ...DefaultDarkTheme.colors,
    ...darkColors,
    
    // Custom Semantic
    ...semanticColors,
    // Adjust semantics for dark mode visibility
    trendUp: '#6DDBAC', // Primary Light Green
    trendDown: '#FFB4AB', // Error Light Red
    
    success: '#6DDBAC',
    successContainer: '#005138',
    
    info: '#A6CCE0',
    infoContainer: '#254B5B',
    
    neutral: '#B3CCBE',
    neutralContainer: '#354B41',
    
    danger: '#FFB4AB',
    warning: '#FFCC80', // Light Orange
    
    skeleton: '#2C312E', // Matches elevation level 4
    skeletonHighlight: '#303532', // Matches elevation level 5
    buttonBorder: '#8E9692',
  },
  spacing,
};
