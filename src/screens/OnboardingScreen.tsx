import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, Image, Platform, Linking, useWindowDimensions } from 'react-native';
import { Text, Button, useTheme, Icon } from 'react-native-paper';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { storageService } from '../services/StorageService';
import { fcmService } from '../services/firebase/FCMService';
import { useAppTheme, AppTheme } from '../theme/theme';

const STORY_DURATION = 6000; // 6 seconds per slide

interface OnboardingItem {
  key: string;
  title: string;
  description: string;
  icon: string;
  colorType: 'primary' | 'secondary' | 'tertiary' | 'error' | 'warning';
  hasAction?: boolean;
}

interface OnboardingScreenProps {
  onFinish?: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const pagerRef = useRef<PagerView>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<boolean | null>(null);

  const ONBOARDING_DATA: OnboardingItem[] = [
    {
      key: 'welcome',
      title: 'Bienvenido/a',
      description: 'Tu herramienta definitiva para el seguimiento financiero en Venezuela. Cotizaciones, tasas y análisis en tiempo real.',
      icon: 'chart-box',
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
      colorType: 'secondary',
    },
    {
      key: 'bcv',
      title: 'Banco Central de Venezuela',
      description: 'Información oficial y actualizada. Monitorea las tasas oficiales del BCV y su histórico de comportamiento.',
      icon: 'bank',
      colorType: 'error',
    },
    {
      key: 'p2p',
      title: 'Mercado P2P y Frontera',
      description: 'Conoce el mercado paralelo, tasas de cambio en Cúcuta y arbitraje P2P en plataformas como Binance.',
      icon: 'swap-horizontal-bold',
      colorType: 'warning',
    },
  ];

  const getPageColors = (type: string) => {
    switch (type) {
      case 'primary':
        return { 
          gradientStart: theme.colors.primaryContainer, 
          icon: theme.colors.primary,
          text: theme.colors.onSurface,
          buttonText: theme.colors.onPrimary,
        };
      case 'secondary':
        return { 
          gradientStart: theme.colors.secondaryContainer, 
          icon: theme.colors.secondary,
          text: theme.colors.onSurface,
          buttonText: theme.colors.onSecondary,
        };
      case 'tertiary':
        return { 
          gradientStart: theme.colors.tertiaryContainer, 
          icon: theme.colors.tertiary,
          text: theme.colors.onSurface,
          buttonText: theme.colors.onTertiary,
        };
      case 'error':
        return { 
          gradientStart: theme.colors.errorContainer, 
          icon: theme.colors.error,
          text: theme.colors.onSurface,
          buttonText: theme.colors.onError,
        };
      case 'warning':
        // Fallback manual para warningContainer que no existe en el tema por defecto
        const isDark = theme.dark;
        return { 
          gradientStart: isDark ? '#4A3B00' : '#FFDEA6', 
          icon: theme.colors.warning,
          text: theme.colors.onSurface,
          buttonText: isDark ? '#3E2D00' : '#FFFFFF', // Contrast text for warning
        };
      default:
        return { 
          gradientStart: theme.colors.surface, 
          icon: theme.colors.primary,
          text: theme.colors.onSurface,
          buttonText: theme.colors.onPrimary,
        };
    }
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
  }, [currentPage, isPaused]);

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
    setIsPaused(true); // Pause while system dialog is open
    try {
      const hasPermission = await fcmService.requestUserPermission();
      setNotificationPermissionStatus(hasPermission);
      if (hasPermission) {
        await fcmService.getFCMToken();
      }
    } catch (error) {
      console.error('Permission error', error);
    } finally {
      setIsPaused(false); // Resume after dialog
      // Auto advance after decision? Optional.
      // setTimeout(() => handleNext(), 1000); 
    }
  };

  const finishOnboarding = async () => {
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
          const pageColors = getPageColors(item.colorType);
          
          // Dynamic progress colors
          const activeColor = pageColors.icon;
          // Inactive track: same hue but transparent/lighter
          const inactiveColor = theme.dark 
            ? 'rgba(255, 255, 255, 0.2)' 
            : 'rgba(0, 0, 0, 0.1)'; 
          
          return (
            <View key={index} style={[styles.progressBarBackground, { backgroundColor: inactiveColor }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: isPassed ? '100%' : isActive ? '100%' : '0%',
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
                <View style={styles.contentContainer}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Icon source={item.icon} size={80} color={pageColors.icon} />
                  </View>
                  
                  <Text variant="displaySmall" style={[styles.title, { color: theme.colors.onSurface }]}>
                    {item.title}
                  </Text>
                  
                  <Text variant="bodyLarge" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                    {item.description}
                  </Text>

                  {item.key === 'notifications' && (
                    <Button 
                      mode="contained" 
                      onPress={requestNotificationPermission}
                      style={styles.actionButton}
                      buttonColor={pageColors.icon}
                      textColor={pageColors.buttonText}
                      icon={notificationPermissionStatus ? "check" : "bell-ring"}
                      disabled={notificationPermissionStatus === true}
                    >
                      {notificationPermissionStatus === true 
                        ? 'Notificaciones Activadas' 
                        : 'Activar Alertas'}
                    </Button>
                  )}
                </View>

                <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                  {index === ONBOARDING_DATA.length - 1 ? (
                    <Button 
                      mode="contained" 
                      onPress={finishOnboarding}
                      style={styles.startBtn}
                      contentStyle={{ paddingVertical: 8 }}
                      buttonColor={pageColors.icon}
                      textColor={pageColors.buttonText}
                    >
                      Comenzar
                    </Button>
                  ) : (
                    <Text style={[styles.tapHint, { color: theme.colors.onSurfaceVariant }]}>Toca para continuar</Text>
                  )}
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </PagerView>

      {/* Touch Overlays for Navigation */}
      <View style={styles.touchOverlay}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
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
    left: 10,
    right: 10,
    zIndex: 10,
    flexDirection: 'row',
    height: 4,
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
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
  iconContainer: {
    marginBottom: 40,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 32,
  },
  actionButton: {
    marginTop: 16,
    width: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  startBtn: {
    width: '80%',
    borderRadius: 30,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  tapHint: {
    fontSize: 12,
    marginBottom: 20,
    opacity: 0.7,
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5, // Below progress bar but above content (except buttons)
  },
  touchLeft: {
    flex: 0.3,
  },
  touchRight: {
    flex: 0.7,
  },
});

export default OnboardingScreen;
