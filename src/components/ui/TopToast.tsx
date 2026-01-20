import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'alert';

interface TopToastProps {
  visible: boolean;
  title?: string;
  message: string;
  type: ToastType;
  onDismiss: () => void;
  duration?: number;
}

const { width } = Dimensions.get('window');

const TopToast: React.FC<TopToastProps> = ({
  visible,
  title,
  message,
  type,
  onDismiss,
  duration = 4000,
}) => {
  const theme = useTheme();
  const themeColors = theme.colors as any;
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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
  }, [visible]);

  const hide = () => {
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
  };

  if (!visible) return null;

  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: themeColors.successContainer, border: themeColors.success, icon: themeColors.success };
      case 'error':
        return { bg: themeColors.errorContainer, border: themeColors.error, icon: themeColors.error };
      case 'alert':
      case 'warning':
        return { bg: theme.colors.elevation.level3, border: themeColors.warning, icon: themeColors.warning };
      case 'info':
      default:
        return { bg: theme.colors.elevation.level3, border: themeColors.info || theme.colors.primary, icon: themeColors.info || theme.colors.primary };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'error';
      case 'alert': return 'notifications-active';
      case 'warning': return 'warning';
      case 'info': default: return 'info';
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
        <TouchableOpacity style={styles.content} onPress={hide} activeOpacity={0.9}>
          <View style={styles.iconContainer}>
            <MaterialIcons name={getIcon()} size={28} color={colors.icon} />
          </View>
          <View style={styles.textContainer}>
            {title && (
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                {title}
              </Text>
            )}
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {message}
            </Text>
          </View>
          <TouchableOpacity onPress={hide} style={styles.closeButton}>
            <MaterialIcons name="close" size={20} color={theme.colors.onSurfaceDisabled} />
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
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default TopToast;
