import { useTheme, MD3Theme } from 'react-native-paper';
import { spacing } from './theme';

type CustomColors = {
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
};

export type AppTheme = Omit<MD3Theme, 'colors'> & {
  colors: MD3Theme['colors'] & CustomColors;
  spacing: typeof spacing;
};

export const useAppTheme = () => useTheme<AppTheme>();
