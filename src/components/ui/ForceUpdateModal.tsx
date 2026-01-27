import React, { useState } from 'react';
import { View, StyleSheet, Modal, StatusBar, Linking, Platform } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/theme';
import CustomButton from './CustomButton';

interface ForceUpdateModalProps {
  visible: boolean;
  storeUrl?: string;
}

const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({ visible, storeUrl }) => {
  const theme = useAppTheme();
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    const url = storeUrl || (Platform.OS === 'ios' 
        ? 'https://apps.apple.com/app/idYOUR_APP_ID' 
        : 'market://details?id=com.vtradingapp'); // Replace with actual package name
    
    try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            // Fallback for emulator or weird states
            console.warn("Cannot open URL:", url);
        }
    } catch (err) {
        console.error("An error occurred", err);
    } finally {
        setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <StatusBar backgroundColor="rgba(0,0,0,0.8)" barStyle="light-content" />
        
        <Surface 
            style={[
                styles.modalContainer, 
                { 
                    backgroundColor: theme.dark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                    borderColor: theme.colors.outlineVariant,
                }
            ]} 
            elevation={5}
        >
          {/* Decorative Glow */}
          <View style={[styles.glowEffect, { backgroundColor: theme.colors.primary, opacity: theme.dark ? 0.2 : 0.1 }]} />

          <View style={styles.content}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primary + '15' }]}>
                <View style={[styles.pulseCircle, { borderColor: theme.colors.primary + '30' }]} />
                <MaterialCommunityIcons 
                    name="rocket-launch" 
                    size={48} 
                    color={theme.colors.primary} 
                />
            </View>

            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
              Actualización Requerida
            </Text>
            
            <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
              ¡Hemos mejorado VTrading! Existe una nueva versión disponible con características importantes y mejoras de rendimiento.
            </Text>
            <Text variant="bodySmall" style={[styles.subMessage, { color: theme.colors.outline }]}>
              Debes actualizar para continuar usando la aplicación.
            </Text>

            <View style={styles.footer}>
              <CustomButton 
                variant="primary"
                label="Actualizar Ahora"
                onPress={handleUpdate}
                loading={loading}
                fullWidth
                style={styles.button}
                contentStyle={{ height: 56 }}
                icon="update"
              />
            </View>
          </View>

          {/* Bottom Gradient Accent */}
          <LinearGradient 
            colors={[theme.colors.primary + '00', theme.colors.primary + '20']} 
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  glowEffect: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    filter: 'blur(40px)',
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
    marginBottom: 8,
    lineHeight: 22,
    opacity: 0.9,
  },
  subMessage: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
      borderRadius: 16,
      overflow: 'hidden',
  },
  bottomAccent: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      zIndex: 0,
  }
});

export default ForceUpdateModal;
