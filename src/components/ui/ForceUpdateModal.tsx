import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, StatusBar, Linking, Platform } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

import CustomButton from './CustomButton';
import { useAppTheme } from '@/theme';
import { observabilityService } from '@/services/ObservabilityService';
import SafeLogger from '@/utils/safeLogger';

interface ForceUpdateModalProps {
  visible: boolean;
  storeUrl?: string;
}

const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({ visible, storeUrl }) => {
  const theme = useAppTheme();
  const [loading, setLoading] = useState(false);

  // Animations
  const pulseScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      // Entrance animation
      opacity.value = withTiming(1, { duration: 600 });
      translateY.value = withTiming(0, { duration: 800 });

      // Pulse animation for the background circle
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 1500 }), withTiming(1, { duration: 1500 })),
        -1,
        true,
      );

      // Subtle rocket tilt animation
      iconRotate.value = withRepeat(
        withDelay(
          2000,
          withSequence(
            withTiming(5, { duration: 100 }),
            withTiming(-5, { duration: 200 }),
            withTiming(0, { duration: 100 }),
          ),
        ),
        -1,
        true,
      );
    }
  }, [visible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 0.3 * (2 - pulseScale.value),
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.value}deg` }],
  }));

  const handleUpdate = async () => {
    setLoading(true);
    const url =
      storeUrl ||
      (Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/idYOUR_APP_ID'
        : 'market://details?id=com.vtradingapp');

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        SafeLogger.warn('Cannot open URL:', url);
        // Fallback to https version of market link if needed
        if (url.startsWith('market://')) {
          const fallbackUrl = url.replace('market://', 'https://play.google.com/store/apps/');
          await Linking.openURL(fallbackUrl);
        }
      }
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'ForceUpdateModal.handleUpdatePress',
        action: 'open_store_link',
        url: url,
      });
      SafeLogger.error('An error occurred', e);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const surfaceBackgroundColor = theme.dark ? 'rgba(28, 28, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)';
  const iconWrapperBg = theme.colors.primary + '15';
  const pulseCircleBorder = theme.colors.primary + '30';

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, animatedBackdropStyle]}>
        <StatusBar backgroundColor="rgba(0,0,0,0.8)" barStyle="light-content" />

        <Animated.View style={[styles.modalWrapper, animatedContainerStyle]}>
          <Surface
            style={[
              styles.modalContainer,
              {
                backgroundColor: surfaceBackgroundColor,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
            elevation={5}
          >
            {/* Top Glow Accent */}
            <View
              style={[
                styles.glowEffect,
                {
                  backgroundColor: theme.colors.primary,
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 40,
                  elevation: 20,
                },
              ]}
            />

            <View style={styles.content}>
              <View style={[styles.iconWrapper, { backgroundColor: iconWrapperBg }]}>
                <Animated.View style={[styles.pulseCircle, { borderColor: pulseCircleBorder }, animatedPulseStyle]} />
                <Animated.View style={animatedIconStyle}>
                  <MaterialCommunityIcons name="rocket-launch" size={48} color={theme.colors.primary} />
                </Animated.View>
              </View>

              <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
                Actualización Requerida
              </Text>

              <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
                ¡Hemos mejorado VTrading! Existe una nueva versión disponible con características importantes y mejoras de rendimiento.
              </Text>

              <Text variant="bodySmall" style={[styles.subMessage, { color: theme.colors.outline }]}>
                Es necesario actualizar para continuar.
              </Text>

              <View style={styles.footer}>
                <CustomButton
                  variant="primary"
                  label="Actualizar Ahora"
                  onPress={handleUpdate}
                  loading={loading}
                  fullWidth
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  icon="update"
                />
              </View>
            </View>

            {/* Bottom Gradient Accent */}
            <LinearGradient
              colors={[theme.colors.primary + '00', theme.colors.primary + '15']}
              style={styles.bottomAccent}
            />
          </Surface>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  modalContainer: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.4,
  },
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
    borderWidth: 2,
  },
  title: {
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  message: {
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
    opacity: 0.9,
  },
  subMessage: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
    fontWeight: '600',
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
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 0,
  },
});
export default ForceUpdateModal;
