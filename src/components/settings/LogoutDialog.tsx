import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface LogoutDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}

const LogoutDialog = ({ visible, onDismiss, onConfirm }: LogoutDialogProps) => {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onDismiss}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          pointerEvents="box-none"
        >
          <View 
            style={[
              styles.container, 
              { 
                backgroundColor: theme.dark ? 'rgba(22, 33, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)', // surface-dark/90
                borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }
            ]}
          >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.errorContainer }]}>
              <MaterialIcons name="logout" size={32} color={theme.colors.error} />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Cerrar Sesión
            </Text>

            {/* Message */}
            <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
              ¿Estás seguro de que deseas cerrar tu sesión? Tendrás que ingresar tus credenciales nuevamente para acceder.
            </Text>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.error }]}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: theme.colors.onError }]}>
                  Cerrar Sesión
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button, 
                  { 
                    backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    marginTop: 12 
                  }
                ]}
                onPress={onDismiss}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 23, 32, 0.8)', // background-dark/80
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 40, // rounded-[2.5rem] ~ 40px
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    // Shadow properties
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64, // size-16 (16 * 4 = 64px)
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20, // text-xl
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5, // tracking-tight
  },
  message: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
    textAlign: 'center',
    lineHeight: 22, // leading-relaxed
    marginBottom: 32,
  },
  actions: {
    width: '100%',
  },
  button: {
    width: '100%',
    paddingVertical: 14, // py-3.5
    borderRadius: 16, // rounded-2xl
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LogoutDialog;
