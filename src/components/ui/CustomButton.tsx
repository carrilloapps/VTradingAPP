import React from 'react';
import { StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme/theme';

export type ButtonVariant =
  | 'primary' // Contained, Primary Color (Default)
  | 'secondary' // Contained, Secondary Color
  | 'outlined' // Outlined, Primary Color
  | 'ghost' // Text only, Primary Color
  | 'destructive' // Contained, Error Color
  | 'outlined-destructive' // Outlined, Error Color
  | 'link'; // Text only, Link style (Underlined optional)

interface CustomButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
  compact?: boolean;
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
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
  contentStyle,
  labelStyle,
  fullWidth = false,
  compact = false,
  mode: propMode,
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
      mode={propMode || getMode()}
      onPress={onPress}
      icon={icon}
      loading={loading}
      disabled={disabled || loading}
      buttonColor={getButtonColor()}
      textColor={getTextColor()}
      compact={compact || variant === 'link'}
      rippleColor={variant === 'link' ? 'transparent' : undefined}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        (variant === 'outlined' || variant === 'outlined-destructive') && [
          styles.outlined,
          { borderColor: getBorderColor() },
        ],
        variant === 'link' && styles.linkButton,
        style,
      ]}
      contentStyle={contentStyle}
      labelStyle={[
        styles.label,
        variant === 'link' && styles.linkLabel,
        labelStyle,
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
  outlined: {},
  fullWidth: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  linkButton: {
    marginVertical: 0,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    minWidth: 0,
  },
  linkLabel: {
    fontWeight: 'bold',
    textDecorationLine: 'none',
    marginHorizontal: 4, // Small margin for links as requested
  },
});

export default CustomButton;
