import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Portal, Snackbar, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '@/theme';
import { useToastStore } from '@/stores/toastStore';

const ToastContainer = () => {
  const theme = useAppTheme();
  const toasts = useToastStore(state => state.toasts);
  const hideToast = useToastStore(state => state.hideToast);

  const getIconName = (type: string) => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert';
      case 'trendUp':
        return 'trending-up';
      case 'trendDown':
        return 'trending-down';
      case 'info':
        return 'information';
      default:
        return 'information';
    }
  };

  const getIconColor = (type: string) => {
    // Ensure distinct colors for all types
    switch (type) {
      case 'success':
        return theme.colors.primary;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return (theme.colors as any).warning || theme.colors.error;
      case 'trendUp':
        return (theme.colors as any).trendUp;
      case 'trendDown':
        return (theme.colors as any).trendDown;
      case 'info':
        return theme.colors.info;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <Portal>
      {toasts.map((toast, index) => {
        const typeColor = getIconColor(toast.type);
        // Use elevation.level5 for a subtle, themed card look
        const backgroundColor = theme.colors.elevation.level5;
        // Use onSurface for standard readability against level5
        const textColor = theme.colors.onSurface;

        return (
          <Snackbar
            key={toast.id}
            visible={true}
            onDismiss={() => hideToast(toast.id)}
            duration={toast.duration}
            style={[
              styles.snackbar,
              {
                backgroundColor,
                // Lifted to 90 to clear TabBar (approx 80px)
                bottom: toast.position === 'bottom' ? 100 + index * 70 : undefined,
                top: toast.position === 'top' ? 56 + index * 70 : undefined,
                borderColor: typeColor, // Dynamic border color = TYPE variation
                // Info type does not need a border as per user request, others do
                borderWidth: toast.type === 'success' ? 0 : 1.5,
              },
            ]}
            action={
              toast.action
                ? {
                    label: toast.action.label,
                    onPress: () => {
                      toast.action?.onPress();
                      hideToast(toast.id);
                    },
                    labelStyle: {
                      color: theme.colors.primary,
                      fontWeight: 'bold',
                    },
                  }
                : undefined
            }
          >
            <View style={styles.toastContent}>
              <MaterialCommunityIcons
                name={getIconName(toast.type)}
                size={22} // Slightly smaller icon
                color={typeColor}
                style={styles.icon}
                accessible={true}
                accessibilityLabel={`${toast.type} icon`}
              />
              <View style={styles.textContainer}>
                {toast.title && (
                  <Text
                    style={[styles.titleText, { color: textColor }]}
                    numberOfLines={1}
                    accessible={true}
                    accessibilityRole="header"
                  >
                    {typeof toast.title === 'string' ? toast.title : toast.title}
                  </Text>
                )}
                <Text
                  style={[styles.messageText, { color: textColor }]}
                  numberOfLines={2}
                  accessible={true}
                >
                  {typeof toast.message === 'string' ? toast.message : toast.message}
                </Text>
              </View>
              {!toast.action && (
                <IconButton
                  icon="close"
                  size={18} // Smaller close button
                  onPress={() => hideToast(toast.id)}
                  iconColor={textColor}
                  style={styles.closeButton}
                  accessible={true}
                  accessibilityLabel="Cerrar notificación"
                  accessibilityRole="button"
                />
              )}
            </View>
          </Snackbar>
        );
      })}
    </Portal>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12, // User requested "not so rounded"
    elevation: 4, // Moderate shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    // Reduce internal padding default from Snackbar if possible, but style override works on wrapper
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    // Removed minHeight to let it hug content naturally, reducing vertical bloat
    paddingVertical: 0,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  titleText: {
    fontWeight: '700', // Stronger weight for contrast
    fontSize: 14,
    marginBottom: 0, // Tighter layout
    lineHeight: 18,
  },
  messageText: {
    fontSize: 13, // Slightly smaller for compactness
    lineHeight: 18,
    opacity: 0.9,
  },
  closeButton: {
    margin: 0,
    width: 24, // Tighter touch target visual
    height: 24,
  },
});

export default ToastContainer;
