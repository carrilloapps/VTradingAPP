import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import DeviceInfo from 'react-native-device-info';
import { useNavigation } from '@react-navigation/native';

import CustomDialog from './CustomDialog';
import AuthLogo from './AuthLogo';
import { AppConfig } from '@/constants/AppConfig';
import { useAppTheme } from '@/theme';
import MenuButton from '@/components/settings/MenuButton';

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
  onDeleteAccount,
}) => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const appName = DeviceInfo.getApplicationName();
  const version = DeviceInfo.getVersion();

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
          containerStyle={styles.logoContainer}
        />
        <Text
          variant="headlineSmall"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          {appName || 'VTrading'}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.version, { color: theme.colors.onSurfaceVariant }]}
        >
          Versión {version}
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
        >
          Diseñado para el seguimiento financiero en tiempo real.
        </Text>

        <View style={styles.aboutLinksContainer}>
          <View
            style={[
              styles.cardContainer,
              {
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.elevation.level1,
              },
            ]}
          >
            <MenuButton
              icon="shield-account"
              label="Políticas de privacidad"
              onPress={() =>
                openExternalUrl(
                  AppConfig.PRIVACY_POLICY_URL,
                  'Políticas de privacidad',
                )
              }
            />
            <MenuButton
              icon="gavel"
              label="Términos y condiciones"
              onPress={() =>
                openExternalUrl(
                  AppConfig.TERMS_OF_USE_URL,
                  'Términos y condiciones',
                )
              }
              hasTopBorder
            />
            <MenuButton
              icon="clipboard-text"
              label="Licencias de uso"
              onPress={() =>
                openExternalUrl(AppConfig.LICENSES_URL, 'Licencias de uso')
              }
              hasTopBorder
            />
            <MenuButton
              icon="web"
              label="Uso de Cookies"
              onPress={() =>
                openExternalUrl(AppConfig.COOKIES_URL, 'Uso de Cookies')
              }
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

        <Text variant="labelSmall" style={styles.copyright}>
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
  logoContainer: {
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 0,
  },
  version: {
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  copyright: {
    color: '#8e8e93', // Fallback or use theme if possible, but earlier it was theme.colors.outline
  },
});

export default AboutDialog;
