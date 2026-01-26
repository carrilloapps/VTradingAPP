import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, useWindowDimensions } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { storageService } from '../services/StorageService';
import { fcmService } from '../services/firebase/FCMService';
import { useAppTheme } from '../theme/theme';
import { useToast } from '../context/ToastContext';
import { observabilityService } from '../services/ObservabilityService';
import CustomButton from '../components/ui/CustomButton';

const STORY_DURATION = 6000; // 6 seconds per slide

interface OnboardingItem {
  key: string;
  title: string;
  description: string;
  icon: any;
  colorType: 'primary' | 'secondary' | 'tertiary' | 'error' | 'warning' | 'info';
  hasAction?: boolean;
}

interface OnboardingScreenProps {
  onFinish?: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const pagerRef = useRef<PagerView>(null);
  
  // Dynamic layout values
  const iconSize = Math.min(width * 0.25, 120);
  const contentWidth = Math.min(400, width * 0.9);
  const verticalSpacing = height * 0.05;

  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<boolean | null>(null);

  const ONBOARDING_DATA = React.useMemo<OnboardingItem[]>(() => [
    {
      key: 'welcome',
      title: 'Bienvenido/a',
      description: 'Tu herramienta definitiva para el seguimiento financiero en Venezuela. Cotizaciones, tasas y análisis en tiempo real.',
      icon: require('../assets/images/logo.png'),
      colorType: 'primary', 
    },
    {
      key: 'notifications',
      title: 'Mantente Informado',
      description: 'Recibe alertas instantáneas sobre cambios de tasas, noticias del mercado y actualizaciones importantes.',
      icon: 'bell-ring',
      colorType: 'tertiary',
      hasAction: true,
    },
    {
      key: 'bvc',
      title: 'Bolsa de Valores de Caracas',
      description: 'Sigue el pulso del mercado bursátil venezolano. Acciones, variaciones y tendencias de la BVC directamente en tu bolsillo.',
      icon: 'domain',
      colorType: 'primary',
    },
    {
      key: 'bcv',
      title: 'Banco Central de Venezuela',
      description: 'Información oficial y actualizada. Monitorea las tasas oficiales del BCV y su histórico de comportamiento.',
      icon: 'bank',
      colorType: 'primary',
    },
    {
      key: 'p2p',
      title: 'Mercado P2P y Frontera',
      description: 'Conoce el mercado, tasas de cambio en monedas fronterizas y arbitraje P2P en plataformas.',
      icon: 'swap-horizontal-bold',
      colorType: 'primary',
    },
  ], []);

  const getPageColors = (type: string) => {
    // Unify all under the primary financial green theme
    return { 
      gradientStart: theme.colors.primaryContainer, 
      icon: theme.colors.primary,
      text: theme.colors.onSurface,
      buttonText: theme.colors.onPrimary,
      surfaceVariant: theme.colors.surfaceVariant,
    };
  };

  // Auto-advance logic
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (currentPage < ONBOARDING_DATA.length - 1) {
        pagerRef.current?.setPage(currentPage + 1);
      } else {
        // End of onboarding? Maybe don't auto-finish to let user read
        clearInterval(interval);
      }
    }, STORY_DURATION);

    return () => clearInterval(interval);
  }, [currentPage, isPaused, ONBOARDING_DATA.length]);

  // Check initial notification permission
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const hasPermission = await fcmService.checkPermission();
        setNotificationPermissionStatus(hasPermission);
      } catch (error) {
        // Error checking permission
      }
    };
    checkStatus();
  }, []);

  const handlePageSelected = (e: any) => {
    setCurrentPage(e.nativeEvent.position);
  };

  const handleNext = () => {
    if (currentPage < ONBOARDING_DATA.length - 1) {
      pagerRef.current?.setPage(currentPage + 1);
    } else {
      finishOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      pagerRef.current?.setPage(currentPage - 1);
    }
  };

  const handlePausePressIn = () => setIsPaused(true);
  const handlePausePressOut = () => setIsPaused(false);

  const requestNotificationPermission = async () => {
    console.log('[Onboarding] Requesting notification permission...');
    setIsPaused(true); // Pause while system dialog is open
    try {
      const hasPermission = await fcmService.requestUserPermission();
      setNotificationPermissionStatus(hasPermission);
      if (hasPermission) {
        await fcmService.getFCMToken();
        await fcmService.subscribeToDemographics(['all_users']);
      }
    } catch (e) {
      observabilityService.captureError(e);
      showToast('Error al solicitar permiso', 'error');
    } finally {
      setIsPaused(false); // Resume after dialog
      // Auto advance after decision? Optional.
      // setTimeout(() => handleNext(), 1000); 
    }
  };

  const finishOnboarding = async () => {
    console.log('[Onboarding] Finishing onboarding...');
    await storageService.setHasSeenOnboarding(true);
    if (onFinish) {
      onFinish();
    } else {
      // Fallback if no callback provided (should not happen in current flow)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' as never }],
      });
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={[styles.progressContainer, { top: insets.top + 10 }]}>
        {ONBOARDING_DATA.map((item, index) => {
          const isActive = index === currentPage;
          const isPassed = index < currentPage;
          
          // Uniform progress colors based on MD3 primary
          const activeColor = theme.colors.primary;
          const inactiveColor = theme.dark 
            ? 'rgba(255, 255, 255, 0.12)' 
            : 'rgba(0, 0, 0, 0.08)'; 
          
          return (
            <View key={index} style={[styles.progressBarBackground, { backgroundColor: inactiveColor }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: isPassed ? '100%' : isActive ? '100%' : '0%', // Full for passed and active (story style)
                    backgroundColor: activeColor,
                  }
                ]} 
              />
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle={theme.dark ? "light-content" : "dark-content"} 
      />
      
      {renderProgressBar()}

      <PagerView
        style={styles.pagerView}
        initialPage={0}
        ref={pagerRef}
        onPageSelected={handlePageSelected}
      >
        {ONBOARDING_DATA.map((item, index) => {
          const pageColors = getPageColors(item.colorType);
          
          return (
            <View key={item.key} style={styles.page}>
              <LinearGradient
                colors={[pageColors.gradientStart, theme.colors.background]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                {/* Touch Overlays for Navigation - Internal to page to allow button interaction */}
                <View style={styles.touchOverlay} pointerEvents="box-none">
                  <TouchableOpacity 
                    style={styles.touchLeft} 
                    onPress={handlePrev} 
                    onLongPress={handlePausePressIn}
                    onPressOut={handlePausePressOut}
                    activeOpacity={1}
                  />
                  <TouchableOpacity 
                    style={styles.touchRight} 
                    onPress={handleNext} 
                    onLongPress={handlePausePressIn}
                    onPressOut={handlePausePressOut}
                    activeOpacity={1}
                  />
                </View>

                <View style={[styles.contentContainer, { width: contentWidth }]}>
                  <View style={styles.iconWrapper}>
                    {/* Halo Glow effect behind the icon */}
                    <View style={[
                      styles.haloEffect, 
                      { backgroundColor: theme.colors.primary, opacity: theme.dark ? 0.15 : 0.1 }
                    ]} />
                    
                    <View style={[
                      styles.iconContainer, 
                      { 
                        // All pages now have the 'Floating' look (no rigid box)
                        backgroundColor: 'transparent',
                        borderColor: 'transparent',
                        borderWidth: 0,
                        marginBottom: verticalSpacing,
                        padding: 0, 
                        elevation: 0, // No shadow for container itself, Halo handles the 'glow'
                        shadowOpacity: 0
                      }
                    ]}>
                      <Icon 
                        source={item.icon} 
                        size={item.key === 'welcome' ? iconSize * 1.5 : iconSize * 1.2} 
                        color={pageColors.icon} 
                      />
                    </View>
                  </View>
                  
                  <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
                    {item.title}
                  </Text>
                  
                  <Text variant="bodyLarge" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                    {item.description}
                  </Text>

                  {item.key === 'notifications' && (
                    <CustomButton 
                      label={notificationPermissionStatus === true 
                        ? 'Notificaciones activas' 
                        : 'Activar notificaciones'}
                      onPress={requestNotificationPermission}
                      variant="primary"
                      icon={notificationPermissionStatus ? "check" : "bell-ring"}
                      disabled={notificationPermissionStatus === true}
                      style={[styles.actionButton, { backgroundColor: pageColors.icon }]}
                      labelStyle={{ color: pageColors.buttonText }}
                    />
                  )}
                </View>

                <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                  {index === ONBOARDING_DATA.length - 1 ? (
                    <CustomButton 
                      label="Comenzar"
                      onPress={finishOnboarding}
                      variant="primary"
                      style={[styles.startBtn, { backgroundColor: pageColors.icon }]}
                      labelStyle={{ color: pageColors.buttonText }}
                      fullWidth
                    />
                  ) : (
                    <Text style={[styles.tapHint, { color: theme.colors.onSurfaceVariant }]}>Toca para continuar</Text>
                  )}
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </PagerView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  progressContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 20, // High depth
    flexDirection: 'row',
    height: 3, // Thinner, modern MD3 look
    gap: 6,
  },
  progressBarBackground: {
    flex: 1,
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 40,
  },
  haloEffect: {
    position: 'absolute',
    width: 140, // Slightly larger than container
    height: 140,
    borderRadius: 70,
    filter: 'blur(30px)', // Creates the ethereal glow
    zIndex: -1,
  },
  iconContainer: {
    borderRadius: 32, // More rounded/premium
    justifyContent: 'center',
    alignItems: 'center',
    // Soft shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  description: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 32,
  },
  actionButton: {
    marginTop: 16,
    width: '100%',
    zIndex: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  startBtn: {
    width: '90%',
    borderRadius: 12,
    marginBottom: 20,
    zIndex: 10,
  },
  tapHint: {
    fontSize: 13,
    marginBottom: 20,
    opacity: 0.7,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 1, // Lower than buttons (10)
  },
  touchLeft: {
    flex: 0.3,
  },
  touchRight: {
    flex: 0.7,
  },
});

export default OnboardingScreen;
