import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Animated, Easing, TouchableOpacity } from 'react-native';
import { Text, useTheme, Button, Card, ProgressBar, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FeatureItem = ({ icon, title, description, theme }: any) => (
  <Surface style={[styles.featureItem, { backgroundColor: theme.colors.elevation.level1 }]} elevation={1}>
    <View style={[styles.featureIconBox, { backgroundColor: theme.dark ? 'rgba(16, 185, 129, 0.1)' : '#E6FFFA' }]}>
      <MaterialIcons name={icon} size={24} color={theme.colors.primary} />
    </View>
    <View style={styles.featureText}>
      <Text variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{title}</Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{description}</Text>
    </View>
  </Surface>
);

const DetailsScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [notified, setNotified] = useState(false);
  const [progress, setProgress] = useState(0);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simulate backend data fetching for real-time progress
    const fetchWalletStatus = () => {
      // Mocking a backend response delay
      setTimeout(() => {
        // This value would come from the backend: { "progress": 0.75 }
        setProgress(0.75);
      }, 1000);
    };

    fetchWalletStatus();

    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulse Effect for Main Icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate Effect for Gear
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <UnifiedHeader 
        variant="section" 
        title="Billetera" 
        showNotification={false}
        style={{ borderBottomWidth: 0 }}
      />
      
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <MaterialIcons name="account-balance-wallet" size={80} color={theme.colors.primary} />
              </Animated.View>
              <Animated.View style={[styles.gearIcon, { transform: [{ rotate: spin }] }]}>
                <MaterialIcons name="settings" size={32} color={theme.colors.tertiary} />
              </Animated.View>
            </View>

            <View style={[styles.statusBadge, { borderColor: theme.colors.outline }]}>
              <View style={styles.blinkingDot} />
              <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>EN DESARROLLO</Text>
            </View>

            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
              Tu Billetera Digital
            </Text>
            <Text variant="bodyLarge" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              Estamos construyendo una experiencia financiera completa para que gestiones tus activos con total libertad.
            </Text>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Progreso de desarrollo</Text>
              <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
          </View>

          {/* Features Preview */}
          <View style={styles.featuresContainer}>
            <Text variant="titleMedium" style={[styles.featuresTitle, { color: theme.colors.onSurface }]}>
              Lo que vendrá
            </Text>
            <FeatureItem 
              icon="swap-horiz" 
              title="Transferencias Inmediatas" 
              description="Envía y recibe dinero al instante entre cuentas."
              theme={theme}
            />
            <FeatureItem 
              icon="qr-code-scanner" 
              title="Pago Móvil & QR" 
              description="Paga en comercios escaneando códigos QR."
              theme={theme}
            />
            <FeatureItem 
              icon="currency-bitcoin" 
              title="Custodia Cripto" 
              description="Almacena y gestiona tus criptoactivos seguros."
              theme={theme}
            />
          </View>

          {/* Action Button */}
          <View style={styles.actionContainer}>
            <Button 
              mode={notified ? "outlined" : "contained"}
              onPress={() => setNotified(!notified)}
              icon={notified ? "check" : "bell-ring"}
              style={styles.button}
              contentStyle={{ height: 48 }}
            >
              {notified ? "Te avisaremos" : "Notificarme del lanzamiento"}
            </Button>
            {!notified && (
               <Text variant="bodySmall" style={{ marginTop: 12, color: theme.colors.outline }}>
                 Recibirás una notificación cuando esté listo.
               </Text>
            )}
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  gearIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  blinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B', // amber-500
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  progressSection: {
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featuresTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    marginLeft: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    borderRadius: 12,
  },
});

export default DetailsScreen;