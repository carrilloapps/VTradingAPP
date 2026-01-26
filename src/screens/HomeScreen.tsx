import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, RefreshControl, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, Alert, ActionSheetIOS } from 'react-native';
import Share from 'react-native-share';
import ViewShot, { captureRef } from 'react-native-view-shot';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme, Text, Icon, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import MarketStatus from '../components/ui/MarketStatus';
import ExchangeCard, { ExchangeCardProps } from '../components/dashboard/ExchangeCard';
import StockItem from '../components/stocks/StockItem';
import Calculator from '../components/dashboard/Calculator';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import { StocksService, StockData } from '../services/StocksService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AppConfig } from '../constants/AppConfig';
import { TetherIcon } from '../components/ui/TetherIcon';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { MaterialTopTabNavigationProp } from '@react-navigation/material-top-tabs';
import AdvancedCalculatorCTA from '../components/dashboard/AdvancedCalculatorCTA';
import { observabilityService } from '../services/ObservabilityService';
import ShareGraphic from '../components/dashboard/ShareGraphic';
import CustomDialog from '../components/ui/CustomDialog';
import CustomButton from '../components/ui/CustomButton';
import { List } from 'react-native-paper';

const HomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<
    CompositeNavigationProp<
      NativeStackNavigationProp<RootStackParamList>,
      MaterialTopTabNavigationProp<MainTabParamList>
    >
  >();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [spread, setSpread] = useState<number | null>(null);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [featuredRates, setFeaturedRates] = useState<ExchangeCardProps[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const viewShotRef = React.useRef<any>(null);
  const [sharing, setSharing] = useState(false);
  const [shareFormat, setShareFormat] = useState<'1:1' | '16:9'>('1:1');
  const [isShareDialogVisible, setShareDialogVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const processRates = useCallback((data: CurrencyRate[]) => {
      // Prioritize USD and USDT for the Home Screen
      const homeRates: CurrencyRate[] = [];
      const usdRate = data.find(r => r.code === 'USD');
      const usdtRate = data.find(r => r.code === 'USDT');

      if (usdRate) homeRates.push(usdRate);
      if (usdtRate) homeRates.push(usdtRate);

      // Calculate Spread (Brecha)
      const usdRates = data.filter(r => (r.code === 'USD' || r.code === 'USDT') && r.value > 0);
      let spreadVal: number | null = null;

      if (usdRates.length >= 2) {
           const values = usdRates.map(r => r.value);
           const min = Math.min(...values);
           const max = Math.max(...values);
           if (min > 0) {
               spreadVal = ((max - min) / min) * 100;
           }
      }
      setSpread(spreadVal);
      
      const getPath = (percent: number | null | undefined) => {
        if (percent === null || percent === undefined || Math.abs(percent) < 0.001) return 'M0 20 L 100 20';
        
        // Dynamic curve intensity based on percentage
        // We amplify small percentages to make them visible
        // 0.5% is treated as "high intensity" (1.0) for visual purposes
        const scaleFactor = 200; // Multiplier: 0.005 * 200 = 1.0
        const intensity = Math.min(Math.abs(percent) * scaleFactor, 1.0);
        
        // Base amplitude (how far from center Y=20)
        // Min deviation 3 (flat-ish), Max 18 (steep)
        const minAmp = 3;
        const maxAmp = 18;
        const amplitude = minAmp + ((maxAmp - minAmp) * intensity);
        const center = 20;
        
        if (percent > 0) {
            // Up Trend: Start Low (Y > 20), End High (Y < 20)
            const startY = center + amplitude;
            const endY = center - amplitude;
            // Bezier control points for smooth S-curve
            return `M0 ${startY} C 40 ${startY}, 60 ${endY}, 100 ${endY}`; 
        } else {
            // Down Trend: Start High (Y < 20), End Low (Y > 20)
            const startY = center - amplitude;
            const endY = center + amplitude;
            return `M0 ${startY} C 40 ${startY}, 60 ${endY}, 100 ${endY}`;
        }
      };

      // Transform rates to ExchangeCard format
      const featured = homeRates.map(rate => {
        // Handle potential NaN or invalid values for value
        let displayValue = '0,00';
        try {
            if (rate.value && !isNaN(Number(rate.value))) {
                displayValue = Number(rate.value).toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: AppConfig.DECIMAL_PLACES, maximumFractionDigits: AppConfig.DECIMAL_PLACES });
            }
        } catch (e) {
            observabilityService.captureError(e);
            // Error formatting value
        }

        // Handle potential undefined/null for buy/sell
        let displayBuyValue;
        let displaySellValue;
        
        if (rate.buyValue !== undefined && !isNaN(Number(rate.buyValue))) {
             displayBuyValue = Number(rate.buyValue).toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: AppConfig.DECIMAL_PLACES, maximumFractionDigits: AppConfig.DECIMAL_PLACES });
        }
        
        if (rate.sellValue !== undefined && !isNaN(Number(rate.sellValue))) {
             displaySellValue = Number(rate.sellValue).toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: AppConfig.DECIMAL_PLACES, maximumFractionDigits: AppConfig.DECIMAL_PLACES });
        }

        // Determine icon and color based on currency type/code
        let iconName = rate.iconName;
        let iconSymbol = '$';
        let iconColor;
        let iconTintColor;
        let customIcon;
        
        // Use consistent background color for both modes that supports dark content (#212121)
        // In Dark Mode: primary is #6DDBAC (Light Green)
        // In Light Mode: inversePrimary is #6DDBAC (Light Green)
        const iconBackground = theme.dark ? theme.colors.primary : theme.colors.inversePrimary;

        if (rate.code === 'USD') {
            iconName = 'currency-usd';
            iconColor = iconBackground;
            iconTintColor = '#212121';
        } else if (rate.code === 'USDT') {
            customIcon = <TetherIcon backgroundColor={iconBackground} contentColor="#212121" />;
        } else if (rate.type === 'crypto') {
            iconSymbol = '₿';
            iconColor = '#F7931A';
        }

        return {
            title: rate.name,
            subtitle: '',
            value: displayValue,
            currency: 'Bs',
            changePercent: rate.changePercent !== null ? `${rate.changePercent.toFixed(2)}%` : '0.00%', 
            isPositive: rate.changePercent !== null ? rate.changePercent >= 0 : true,
            chartPath: getPath(rate.changePercent),
            iconName: iconName,
            iconSymbol: iconSymbol,
            iconColor: iconColor,
            iconTintColor: iconTintColor,
            customIcon: customIcon,
            buyValue: displayBuyValue,
            sellValue: displaySellValue,
            buyChangePercent: rate.buyChangePercent !== undefined ? `${rate.buyChangePercent > 0 ? '+' : ''}${rate.buyChangePercent.toFixed(2)}%` : undefined,
            sellChangePercent: rate.sellChangePercent !== undefined ? `${rate.sellChangePercent > 0 ? '+' : ''}${rate.sellChangePercent.toFixed(2)}%` : undefined,
            buyChartPath: getPath(rate.buyChangePercent),
            sellChartPath: getPath(rate.sellChangePercent),
        };
      });
      setFeaturedRates(featured);
  }, [theme]);

  useEffect(() => {
    const unsubscribeRates = CurrencyService.subscribe((data) => {
        setRates(data);
        processRates(data);
        setLoading(false);
        setLastRefreshTime(new Date());
    });
    
    const unsubscribeStocks = StocksService.subscribe((data) => {
        setStocks(data.slice(0, 3)); // Only take top 3 for Home
        setIsMarketOpen(StocksService.isMarketOpen());
    });

    // Initial fetch
    const loadInitialData = async () => {
        try {
            await Promise.all([
                CurrencyService.getRates(),
                StocksService.getStocks()
            ]);
            setIsMarketOpen(StocksService.isMarketOpen());
        } catch (e) {
            observabilityService.captureError(e);
            showToast('Error al actualizar datos', 'error');
        } finally {
            setLoading(false);
        }
    };
    loadInitialData();

    return () => {
        unsubscribeRates();
        unsubscribeStocks();
    };
  }, [processRates, showToast]);

  const generateShareImage = async (format: '1:1' | '16:9') => {
    setShareDialogVisible(false);
    setShareFormat(format);
    setSharing(true);
    
    // Wait a brief moment for the hidden template to re-render with the new ratio
    await new Promise(resolve => setTimeout(() => resolve(null), 300));

    if (viewShotRef.current) {
      try {
        const uri = await captureRef(viewShotRef.current, {
          format: 'jpg',
          quality: 1.0,
          result: 'tmpfile', 
          // 1080p base resolution for high quality
          width: 1080,
          height: format === '1:1' ? 1080 : 1920,
        });
        
        if (!uri) {
           throw new Error("Failed to capture image: URI is empty");
        }

        const sharePath = uri.startsWith('file://') ? uri : `file://${uri}`;

        await Share.open({
          url: sharePath,
          type: 'image/jpeg',
          message: `Tasas actualizadas en VTradingAPP (${format})`,
        });
      } catch (e) {
        if (e && (e as any).message !== 'User did not share' && (e as any).message !== 'CANCELLED') {
            const errorMsg = e instanceof Error ? e.message : 'Unknown sharing error';
            observabilityService.captureError(e, { context: 'HomeScreen_handleShareImage' });
            showToast(`No se pudo compartir: ${errorMsg}`, 'error');
        }
      } finally {
        setSharing(false);
      }
    }
  };

  const handleShareText = async () => {
    setShareDialogVisible(false);
    try {
      const bcv = rates.find(r => r.code === 'USD');
      const p2p = rates.find(r => r.code === 'USDT');
      
      const message = `📊 *VTradingAPP - Reporte Diario*\n\n` +
        (bcv ? `💵 *USD BCV:* ${Number(bcv.value).toFixed(2)} Bs\n` : '') +
        (p2p ? `🔶 *USDT P2P:* ${Number(p2p.value).toFixed(2)} Bs\n` : '') +
        (spread ? `⚖️ *Spread:* ${spread.toFixed(2)}%\n` : '') +
        `⏱️ _Act: ${lastUpdated}_\n\n` +
        `🌐 vtrading.app`;

      await Share.open({
        message: message,
      });
    } catch (e) {
      if (e && (e as any).message !== 'User did not share' && (e as any).message !== 'CANCELLED') {
        showToast('Error al compartir texto', 'error');
      }
    }
  };

  const handleShareImage = () => {
    setShareDialogVisible(true);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
        await Promise.all([
            CurrencyService.getRates(true),
            StocksService.getStocks(true)
        ]);
        setIsMarketOpen(StocksService.isMarketOpen());
        showToast('Datos actualizados', 'success');
        setLastRefreshTime(new Date()); // Force update time immediately on success
    } catch (e) {
        observabilityService.captureError(e);
        showToast('Error al actualizar', 'error');
    } finally {
        setRefreshing(false);
    }
  }, [showToast]);

  const lastUpdated = lastRefreshTime 
    ? lastRefreshTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : (rates.length > 0 
        ? new Date(rates[0].lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : '--:--');

  // User Data from Auth
  const userData = {
    name: user?.displayName || user?.email?.split('@')[0] || 'Invitado',
    avatarUrl: user?.photoURL,
    email: user?.email,
    notificationCount: 3, // Mock for now
    isPremium: !!(user && !user.isAnonymous) // Only registered users are Premium
  };

  const themeStyles = useMemo(() => ({
    container: { backgroundColor: theme.colors.background },
    emptyText: { color: theme.colors.onSurfaceVariant },
    sectionTitle: { color: theme.colors.onSurface },
    linkText: { color: theme.colors.primary }
  }), [theme]);

  if (loading) {
    return (
      <View style={[styles.container, themeStyles.container]}>
        <StatusBar 
          backgroundColor="transparent" 
          translucent
          barStyle={theme.dark ? 'light-content' : 'dark-content'} 
        />
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar 
        backgroundColor="transparent"
        translucent 
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
      />
      
      <UnifiedHeader 
        variant="profile"
        userName={userData.name} 
        avatarUrl={userData.avatarUrl} 
        email={userData.email}
        notificationCount={userData.notificationCount}
        isPremium={userData.isPremium} 
        onProfilePress={() => navigation.navigate('Settings')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        showSecondaryAction
        onSecondaryActionPress={handleShareImage}
        secondaryActionIcon="share-variant"
      />

      <ShareGraphic 
        viewShotRef={viewShotRef}
        featuredRates={featuredRates}
        spread={spread}
        lastUpdated={lastUpdated}
        isPremium={userData.isPremium}
        aspectRatio={shareFormat}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
        >
          <MarketStatus
              style={{ paddingHorizontal: 22, paddingTop: 15, paddingBottom: 20 }} 
              isOpen={isMarketOpen} 
              updatedAt={lastUpdated} 
              onRefresh={() => {
                  onRefresh();
              }}
          />

          <View style={styles.section}>
            {featuredRates.map((item, index) => (
              <ExchangeCard key={index} {...item} />
            ))}
            {featuredRates.length === 0 && (
               <Text style={[styles.emptyText, themeStyles.emptyText]}>
                 No hay tasas disponibles
               </Text>
            )}
          </View>

          <AdvancedCalculatorCTA spread={spread} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="headlineSmall" style={[styles.titleMedium, themeStyles.sectionTitle]}>
                Mercado Bursátil
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Markets')}>
                  <Text variant="labelLarge" style={[styles.linkText, themeStyles.linkText]}>VER TODO</Text>
              </TouchableOpacity>
            </View>
            
            {stocks.map((stock) => (
              <StockItem 
                key={stock.id}
                {...stock}
                value={`${stock.price.toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`}
                change={`${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`}
                onPress={() => navigation.navigate('StockDetail', { stock })}
              />
            ))}
          </View>

          <View style={styles.section}>
            <Calculator />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomDialog
        visible={isShareDialogVisible}
        onDismiss={() => setShareDialogVisible(false)}
        title="Compartir reporte"
        showCancel={false}
        confirmLabel="Cerrar"
        onConfirm={() => setShareDialogVisible(false)}
      >
        <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 20, color: theme.colors.onSurfaceVariant }}>
          Selecciona el formato ideal para compartir en tus redes sociales
        </Text>
        
        <View style={{ gap: 12 }}>
          <CustomButton 
            variant="primary"
            label="Imagen cuadrada"
            icon="view-grid-outline"
            onPress={() => generateShareImage('1:1')}
            fullWidth
          />
          <CustomButton 
            variant="secondary"
            label="Imagen vertical"
            icon="cellphone"
            onPress={() => generateShareImage('16:9')}
            fullWidth
          />
          <CustomButton 
            variant="outlined"
            label="Solo texto"
            icon="text-short"
            onPress={handleShareText}
            fullWidth
          />
        </View>
      </CustomDialog>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40, 
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  titleMedium: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  emptyText: {
    textAlign: 'center', 
    marginVertical: 20,
  },
  linkText: {
    fontWeight: 'bold',
  }
});

export default HomeScreen;