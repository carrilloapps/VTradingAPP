import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | 'alert'
  | 'trendUp'
  | 'trendDown';

interface TopToastProps {
  visible: boolean;
  title?: string;
  message: string | React.ReactNode;
  caption?: string;
  type: ToastType;
  onDismiss: () => void;
  duration?: number;
}

const TopToast: React.FC<TopToastProps> = ({
  visible,
  title,
  message,
  caption,
  type,
  onDismiss,
  duration = 4000,
}) => {
  const theme = useTheme();
  const themeColors = theme.colors as any;
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (visible) onDismiss();
    });
  }, [onDismiss, opacity, translateY, visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hide();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hide();
    }
  }, [duration, hide, opacity, translateY, visible]);

  if (!visible) return null;

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: themeColors.successContainer,
          border: themeColors.success,
          icon: themeColors.success,
          text: theme.colors.onSurface,
          textVariant: theme.colors.onSurfaceVariant,
        };
      case 'error':
        return {
          bg: themeColors.errorContainer,
          border: themeColors.error,
          icon: themeColors.error,
          text: theme.colors.onSurface,
          textVariant: theme.colors.onSurfaceVariant,
        };
      case 'trendUp':
        return {
          bg: themeColors.trendUp,
          border: themeColors.trendUp,
          icon: themeColors.onPrimary,
          text: themeColors.onPrimary,
          textVariant: themeColors.onPrimary,
        };
      case 'trendDown':
        return {
          bg: themeColors.trendDown,
          border: themeColors.trendDown,
          icon: themeColors.onError,
          text: themeColors.onError,
          textVariant: themeColors.onError,
        };
      case 'alert':
      case 'warning':
        return {
          bg: theme.colors.elevation.level3,
          border: themeColors.warning,
          icon: themeColors.warning,
          text: theme.colors.onSurface,
          textVariant: theme.colors.onSurfaceVariant,
        };
      case 'info':
      default:
        return {
          bg: theme.colors.elevation.level3,
          border: themeColors.info || theme.colors.primary,
          icon: themeColors.info || theme.colors.primary,
          text: theme.colors.onSurface,
          textVariant: theme.colors.onSurfaceVariant,
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'alert':
        return 'bell-ring';
      case 'warning':
        return 'alert';
      case 'trendUp':
        return 'trending-up';
      case 'trendDown':
        return 'trending-down';
      case 'info':
      default:
        return 'information';
    }
  };

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 10,
          transform: [{ translateY }],
          opacity: opacity,
        },
      ]}
    >
      <Surface
        style={[
          styles.card,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
          },
        ]}
        elevation={4}
      >
        <TouchableOpacity
          style={styles.content}
          onPress={hide}
          activeOpacity={0.9}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={getIcon()}
              size={28}
              color={colors.icon}
            />
          </View>
          <View style={styles.textContainer}>
            {title && (
              <Text
                variant="titleSmall"
                style={[styles.title, { color: colors.text }]}
              >
                {title}
              </Text>
            )}
            <Text variant="bodyMedium" style={{ color: colors.textVariant }}>
              {message}
            </Text>
            {caption && (
              <View style={styles.captionContainer}>
                <MaterialCommunityIcons
                  name="target"
                  size={14}
                  color={colors.textVariant}
                  style={styles.captionIcon}
                />
                <Text
                  variant="labelSmall"
                  style={[styles.captionText, { color: colors.textVariant }]}
                >
                  {caption}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={hide} style={styles.closeButton}>
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={colors.textVariant}
              style={styles.closeIcon}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Surface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
  },
  captionContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  captionIcon: {
    marginRight: 4,
    opacity: 0.8,
  },
  captionText: {
    opacity: 0.9,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeIcon: {
    opacity: 0.7,
  },
});

export default TopToast;
