import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, useTheme, Text } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import TopToast, { ToastType } from '../components/ui/TopToast';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastState {
  visible: boolean;
  message: string;
  title?: string;
  type: ToastType;
  position: 'top' | 'bottom';
  action?: ToastAction;
}

interface ShowToastOptions {
  type?: ToastType;
  position?: 'top' | 'bottom';
  title?: string;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextData {
  showToast: (message: string, options?: ShowToastOptions | ToastType) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    title: '',
    type: 'info',
    position: 'bottom',
  });

  const showToast = useCallback((message: string, options?: ShowToastOptions | ToastType) => {
    let type: ToastType = 'info';
    let position: 'top' | 'bottom' = 'bottom';
    let title: string | undefined;
    let action: ToastAction | undefined;

    if (typeof options === 'string') {
        type = options as ToastType;
    } else if (options) {
        type = options.type || 'info';
        position = options.position || 'bottom';
        title = options.title;
        action = options.action;
    }

    setToast({ visible: true, message, type, position, title, action });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const getToastColor = useCallback(() => {
    switch (toast.type) {
      case 'success':
        return theme.colors.primary; 
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.tertiary || '#FFA500';
      case 'alert':
        return theme.colors.surfaceVariant;
      case 'info':
      default:
        return theme.colors.inverseSurface;
    }
  }, [toast.type, theme]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return 'check-circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'alert': return 'notifications-active';
      case 'info': default: return 'info';
    }
  };

  const themeStyles = React.useMemo(() => ({
    snackbar: {
      backgroundColor: getToastColor(),
      borderRadius: 8,
      marginBottom: 20,
    },
    text: {
      color: theme.colors.inverseOnSurface
    }
  }), [getToastColor, theme]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Top Toast */}
      {toast.position === 'top' && (
        <TopToast 
          visible={toast.visible}
          message={toast.message}
          title={toast.title}
          type={toast.type}
          onDismiss={hideToast}
        />
      )}

      {/* Bottom Toast (Snackbar) */}
      {toast.position === 'bottom' && (
        <Snackbar
            visible={toast.visible}
            onDismiss={hideToast}
            duration={3000}
            style={themeStyles.snackbar}
            action={toast.action ? {
            label: toast.action.label,
            onPress: () => {
                toast.action?.onPress();
                hideToast();
            },
            textColor: theme.colors.inverseOnSurface,
            } : {
            label: 'Cerrar',
            onPress: hideToast,
            textColor: theme.colors.inverseOnSurface,
            }}
        >
            <View style={styles.content}>
            <MaterialIcons 
                name={getIcon()} 
                size={20} 
                color={theme.colors.inverseOnSurface} 
                style={styles.icon}
            />
            <Text style={themeStyles.text}>{toast.message}</Text>
            </View>
        </Snackbar>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
});
