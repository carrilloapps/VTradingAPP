import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme/theme';

export type ButtonVariant = 
  | 'primary'      // Contained, Primary Color (Default)
  | 'secondary'    // Contained, Secondary Color
  | 'outlined'     // Outlined, Primary Color
  | 'ghost'        // Text only, Primary Color
  | 'destructive'  // Contained, Error Color
  | 'outlined-destructive' // Outlined, Error Color
  | 'link';        // Text only, Link style (Underlined optional)

interface CustomButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  fullWidth?: boolean;
  testID?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  labelStyle,
  fullWidth = false,
  testID,
}) => {
  const theme = useTheme<AppTheme>();

  // Determine Button Mode
  const getMode = (): 'contained' | 'outlined' | 'text' => {
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'destructive':
        return 'contained';
      case 'outlined':
      case 'outlined-destructive':
        return 'outlined';
      case 'ghost':
      case 'link':
        return 'text';
      default:
        return 'contained';
    }
  };

  // Determine Colors
  const getButtonColor = () => {
    if (disabled) return undefined; // Let Paper handle disabled state
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondaryContainer; // M3 Secondary
      case 'destructive':
        return theme.colors.error;
      case 'outlined':
      case 'outlined-destructive':
      case 'ghost':
      case 'link':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return undefined;
    switch (variant) {
      case 'primary':
        return theme.colors.onPrimary;
      case 'secondary':
        return theme.colors.onSecondaryContainer;
      case 'destructive':
        return theme.colors.onError;
      case 'outlined-destructive':
        return theme.colors.error;
      case 'outlined':
        return theme.colors.primary; // Outlined usually primary
      case 'ghost':
        return theme.colors.primary;
      case 'link':
        return theme.colors.primary;
      default:
        return theme.colors.onPrimary;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outlined') {
        return disabled ? theme.colors.onSurfaceDisabled : theme.colors.primary;
    }
    if (variant === 'outlined-destructive') {
        return disabled ? theme.colors.onSurfaceDisabled : theme.colors.error;
    }
    return 'transparent';
  };

  return (
    <Button
      mode={getMode()}
      onPress={onPress}
      icon={icon}
      loading={loading}
      disabled={disabled || loading}
      buttonColor={getButtonColor()}
      textColor={getTextColor()}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        (variant === 'outlined' || variant === 'outlined-destructive') && { borderColor: getBorderColor() },
        style
      ]}
      labelStyle={[
        styles.label,
        variant === 'link' && styles.link,
        labelStyle
      ]}
      testID={testID}
    >
      {label}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12, // Standard Pill/Rounded Shape for VTradingAPP
    marginVertical: 4,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  link: {
    textDecorationLine: 'underline',
  }
});

export default CustomButton;
