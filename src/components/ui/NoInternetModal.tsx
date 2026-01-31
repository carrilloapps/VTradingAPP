import React, { useState } from 'react';
import { View, StyleSheet, Modal, StatusBar } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import { useAppTheme } from '../../theme/theme';
import { useNetworkStore } from '../../stores/networkStore';
import CustomButton from './CustomButton';

const NoInternetModal = () => {
  const { isConnected } = useNetworkStore();
  const theme = useAppTheme();
  const [isChecking, setIsChecking] = useState(false);

  // Show when explicitly disconnected
  const visible = isConnected === false;

  const handleRetry = async () => {
    setIsChecking(true);
    // Fetch force a refresh of the network state
    await NetInfo.fetch();
    // Small delay for UX feel
    setTimeout(() => setIsChecking(false), 1200);
  };

  if (!visible) return null;

  // Pre-calculate dynamic styles
  const surfaceBackgroundColor = theme.dark
    ? 'rgba(30, 30, 30, 0.95)'
    : 'rgba(255, 255, 255, 0.95)';
  const glowOpacityValue = theme.dark ? 0.15 : 0.1;
  const iconWrapperBg = theme.colors.error + '15';
  const pulseCircleBorder = theme.colors.error + '30';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />

        <Surface
          style={[
            styles.modalContainer,
            styles.modalSurface,
            {
              backgroundColor: surfaceBackgroundColor,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
          elevation={5}
        >
          {/* Decorative Glow */}
          <View
            style={[
              styles.glowEffect,
              styles.glowOpacity,
              {
                backgroundColor: theme.colors.error,
                opacity: glowOpacityValue,
              },
            ]}
          />

          <View style={styles.content}>
            <View
              style={[styles.iconWrapper, { backgroundColor: iconWrapperBg }]}
            >
              <View
                style={[styles.pulseCircle, { borderColor: pulseCircleBorder }]}
              />
              <MaterialCommunityIcons
                name="wifi-off"
                size={48}
                color={theme.colors.error}
              />
            </View>

            <Text
              variant="headlineSmall"
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              Sin conexión
            </Text>

            <Text
              variant="bodyMedium"
              style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
            >
              Parece que tienes problemas con tu red. Verifica tu conexión para
              continuar operando en VTrading.
            </Text>

            <View style={styles.footer}>
              <CustomButton
                variant="primary"
                label="Reintentar conexión"
                onPress={handleRetry}
                loading={isChecking}
                fullWidth
                style={styles.button}
                contentStyle={styles.buttonContent}
              />

              <View style={styles.statusIndicator}>
                <View
                  style={[styles.statusDot, { backgroundColor: iconWrapperBg }]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Servidores fuera de alcance
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Gradient Accent */}
          <LinearGradient
            colors={[theme.colors.error + '00', theme.colors.error + '20']}
            style={styles.bottomAccent}
          />
        </Surface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  modalSurface: {},
  glowEffect: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    filter: 'blur(40px)',
  },
  glowOpacity: {},
  content: {
    padding: 32,
    alignItems: 'center',
    zIndex: 1,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
  },
  title: {
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  message: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    opacity: 0.8,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonContent: {
    height: 56,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 0,
  },
});

export default NoInternetModal;
