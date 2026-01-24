import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import NetInfo from '@react-native-community/netinfo';
import { useAppTheme } from '../../theme/theme';
import { useNetwork } from '../../context/NetworkContext';
import CustomButton from './CustomButton';

const NoInternetModal = () => {
  const { isConnected } = useNetwork();
  const theme = useAppTheme();
  const [isChecking, setIsChecking] = useState(false);

  // Show modal when explicitly disconnected.
  // We check for isConnected === false.
  // If isConnected is null (initial unknown state), we don't show it.
  const visible = isConnected === false;

  const handleRetry = async () => {
    setIsChecking(true);
    await NetInfo.fetch();
    // The listener in context will update the state automatically if changed
    setTimeout(() => setIsChecking(false), 1000); // Visual delay
  };

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={() => {}} 
        dismissable={false}
        style={{ 
          backgroundColor: theme.colors.elevation.level3, 
          borderRadius: 28, 
          borderColor: theme.colors.outline,
          borderWidth: 1,
          elevation: 0,
        }}
      >
        <Dialog.Content>
          <View style={styles.contentContainer}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.errorContainer }]}>
              <MaterialCommunityIcons 
                name="wifi-off" 
                size={48} 
                color={theme.colors.error} 
              />
            </View>
            
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
              Sin Conexión
            </Text>
            
            <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
              No se ha detectado conexión a internet. Por favor, verifica tu red para continuar usando VTradingAPP.
            </Text>

            <View style={styles.buttonContainer}>
               <CustomButton 
                  variant="primary"
                  label="Reintentar"
                  onPress={handleRetry}
                  loading={isChecking}
                  fullWidth
               />
            </View>
          </View>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
  }
});

export default NoInternetModal;
