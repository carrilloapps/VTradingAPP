import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, useTheme, Text } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastContextData {
  showToast: (message: string, type?: ToastType, action?: ToastAction) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((message: string, type: ToastType = 'info', action?: ToastAction) => {
    setToast({ visible: true, message, type, action });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const getToastColor = useCallback(() => {
    switch (toast.type) {
      case 'success':
        return theme.colors.primary; // Or a specific success color
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.tertiary || '#FFA500';
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
  }
});

export const useToast = () => useContext(ToastContext);
