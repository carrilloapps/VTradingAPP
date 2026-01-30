import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Portal, Snackbar, IconButton } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';
import { useToastStore } from '../../stores/toastStore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ToastContainer = () => {
  const theme = useAppTheme();
  const toasts = useToastStore((state) => state.toasts);
  const hideToast = useToastStore((state) => state.hideToast);

  const getIconName = (type: string) => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'alert';
      case 'trendUp': return 'trending-up';
      case 'trendDown': return 'trending-down';
      case 'info': return 'information';
      default: return 'information';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      case 'trendUp': return theme.colors.trendUp;
      case 'trendDown': return theme.colors.trendDown;
      case 'info': return theme.colors.info;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getBackgroundColor = (type: string) => {
    // Usamos elevation.level3 como base con un tinte sutil del color del tipo
    switch (type) {
      case 'success': return theme.colors.successContainer;
      case 'error': return theme.colors.errorContainer;
      case 'warning': return theme.colors.primaryContainer;
      case 'info': return theme.colors.infoContainer;
      default: return theme.colors.elevation.level3;
    }
  };

  const getTextColor = (type: string) => {
    // Aseguramos contraste adecuado para accesibilidad
    switch (type) {
      case 'success': return theme.colors.onPrimaryContainer;
      case 'error': return theme.colors.onErrorContainer;
      case 'warning': return theme.colors.onPrimaryContainer;
      case 'info': return theme.colors.onTertiaryContainer;
      default: return theme.colors.onSurface;
    }
  };

  return (
    <Portal>
      {toasts.map((toast, index) => {
        const textColor = getTextColor(toast.type);
        const iconColor = getIconColor(toast.type);
        const backgroundColor = getBackgroundColor(toast.type);

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
                bottom: toast.position === 'bottom' ? 16 + (index * 70) : undefined,
                top: toast.position === 'top' ? 56 + (index * 70) : undefined,
                borderColor: theme.colors.outline,
              }
            ]}
            action={toast.action ? {
              label: toast.action.label,
              onPress: () => {
                toast.action?.onPress();
                hideToast(toast.id);
              },
              labelStyle: { color: textColor, fontWeight: '600' }
            } : undefined}
          >
            <View style={styles.toastContent}>
              <MaterialCommunityIcons
                name={getIconName(toast.type)}
                size={24}
                color={iconColor}
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
                  size={20}
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
    borderRadius: 16,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
    lineHeight: 20,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  closeButton: {
    margin: 0,
  },
});

export default ToastContainer;
