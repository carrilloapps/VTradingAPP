import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import DeviceInfo from 'react-native-device-info';
import CustomDialog from './CustomDialog';
import { useAppTheme } from '../../theme/theme';

interface AboutDialogProps {
  visible: boolean;
  onDismiss: () => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ visible, onDismiss }) => {
  const theme = useAppTheme();
  const appName = DeviceInfo.getApplicationName();
  const version = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();

  return (
    <CustomDialog
      visible={visible}
      onDismiss={onDismiss}
      title="Acerca de"
      showCancel={false}
      confirmLabel="Cerrar"
      onConfirm={onDismiss}
      fullWidthActions
    >
      <View style={styles.content}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo}
        />
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
          {appName}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
          Versión {version} ({buildNumber})
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.l, textAlign: 'center' }}>
          © {new Date().getFullYear()} VTradingAPP. Todos los derechos reservados.
        </Text>
      </View>
    </CustomDialog>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  logo: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
    marginBottom: 16,
  },
});

export default AboutDialog;
