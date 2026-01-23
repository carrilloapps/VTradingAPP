import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import DeviceInfo from 'react-native-device-info';
import CustomDialog from './CustomDialog';
import { useAppTheme } from '../../theme/theme';
import MenuButton from '../settings/MenuButton';
import AuthLogo from './AuthLogo';
import { AppConfig } from '../../constants/AppConfig';
import { useNavigation } from '@react-navigation/native';

interface AboutDialogProps {
  visible: boolean;
  onDismiss: () => void;
  showDeleteAccount?: boolean;
  onDeleteAccount?: () => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ 
  visible, 
  onDismiss,
  showDeleteAccount = false,
  onDeleteAccount
}) => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const appName = DeviceInfo.getApplicationName();
  const version = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();

  const openExternalUrl = (url: string, title?: string) => {
    onDismiss();
    // @ts-ignore
    navigation.navigate('WebView', { url, title: title || 'Navegador' });
  };

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
        <AuthLogo 
          size={64} 
          showBadge={false} 
          tintColor={theme.colors.primary} 
          containerStyle={{ marginBottom: 8 }} 
        />
        <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.onSurface, textAlign: 'center', marginBottom: 0 }}>
          {appName || 'VTradingAPP'}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
          Versión {version}
        </Text>
        <Text variant="bodySmall" style={{ textAlign: 'center', marginBottom: 16, paddingHorizontal: 16, color: theme.colors.onSurfaceVariant }}>
          Diseñado para el seguimiento financiero en tiempo real.
        </Text>

        <View style={styles.aboutLinksContainer}>
          <View style={[styles.cardContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.elevation.level1 }]}>
            <MenuButton
              icon="policy"
              label="Políticas de privacidad"
              onPress={() => openExternalUrl(AppConfig.PRIVACY_POLICY_URL, 'Políticas de privacidad')}
            />
            <MenuButton
              icon="gavel"
              label="Términos y condiciones"
              onPress={() => openExternalUrl(AppConfig.TERMS_OF_USE_URL, 'Términos y condiciones')}
              hasTopBorder
            />
            <MenuButton
              icon="assignment"
              label="Licencias de uso"
              onPress={() => openExternalUrl(AppConfig.LICENSES_URL, 'Licencias de uso')}
              hasTopBorder
            />
            <MenuButton
              icon="web"
              label="Uso de Cookies"
              onPress={() => openExternalUrl(AppConfig.COOKIES_URL, 'Uso de Cookies')}
              hasTopBorder
            />
            {showDeleteAccount && onDeleteAccount && (
              <MenuButton
                icon="delete-forever"
                label="Eliminar cuenta"
                onPress={() => {
                  onDismiss();
                  onDeleteAccount();
                }}
                isDanger
                hasTopBorder
              />
            )}
          </View>
        </View>

        <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
          © {new Date().getFullYear()} VTradingAPP
        </Text>
      </View>
    </CustomDialog>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: 0,
  },
  aboutLinksContainer: {
    width: '100%',
    marginBottom: 16,
  },
  cardContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 0,
  },
});

export default AboutDialog;
