import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
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

const HomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [featuredRates, setFeaturedRates] = useState<ExchangeCardProps[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  const processRates = useCallback((data: CurrencyRate[]) => {
      // Prioritize USD and USDT for the Home Screen
      const homeRates: CurrencyRate[] = [];
      const usdRate = data.find(r => r.code === 'USD');
      const usdtRate = data.find(r => r.code === 'USDT');

      if (usdRate) homeRates.push(usdRate);
      if (usdtRate) homeRates.push(usdtRate);
      
      const getPath = (percent: number | null | undefined) => {
        if (percent === null || percent === undefined || Math.abs(percent) < 0.01) return 'M0 20 L 100 20';
        
        // Dynamic curve intensity based on percentage
        // Cap at 3% for maximum visual steepness
        const intensity = Math.min(Math.abs(percent), 3.0) / 3.0;
        
        // Base amplitude (how far from center Y=20)
        // Min deviation 5 (for visibility), Max 15 (total range 5-35)
        const amplitude = 5 + (10 * intensity);
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
            console.warn('Error formatting value', e);
        }

        // Handle potential undefined/null for buy/sell
        let displayBuyValue = undefined;
        let displaySellValue = undefined;
        
        if (rate.buyValue !== undefined && !isNaN(Number(rate.buyValue))) {
             displayBuyValue = Number(rate.buyValue).toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: AppConfig.DECIMAL_PLACES, maximumFractionDigits: AppConfig.DECIMAL_PLACES });
        }
        
        if (rate.sellValue !== undefined && !isNaN(Number(rate.sellValue))) {
             displaySellValue = Number(rate.sellValue).toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: AppConfig.DECIMAL_PLACES, maximumFractionDigits: AppConfig.DECIMAL_PLACES });
        }

        return {
            title: rate.name,
            subtitle: '',
            value: displayValue,
            currency: 'Bs',
            changePercent: rate.changePercent !== null ? `${rate.changePercent.toFixed(2)}%` : '0.00%', 
            isPositive: rate.changePercent !== null ? rate.changePercent >= 0 : true,
            chartPath: getPath(rate.changePercent),
            iconSymbol: rate.iconName === 'euro' ? '€' : '$',
            iconColor: rate.type === 'crypto' ? '#F7931A' : undefined,
            buyValue: displayBuyValue,
            sellValue: displaySellValue,
            buyChangePercent: rate.buyChangePercent !== undefined ? `${rate.buyChangePercent > 0 ? '+' : ''}${rate.buyChangePercent.toFixed(2)}%` : undefined,
            sellChangePercent: rate.sellChangePercent !== undefined ? `${rate.sellChangePercent > 0 ? '+' : ''}${rate.sellChangePercent.toFixed(2)}%` : undefined,
            buyChartPath: getPath(rate.buyChangePercent),
            sellChartPath: getPath(rate.sellChangePercent),
        };
      });
      setFeaturedRates(featured);
  }, []);

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
    Promise.all([
        CurrencyService.getRates(),
        StocksService.getStocks()
    ]).then(() => {
        setIsMarketOpen(StocksService.isMarketOpen());
    }).catch(error => {
        console.error(error);
        showToast('Error al actualizar datos', 'error');
        setLoading(false);
    });

    return () => {
        unsubscribeRates();
        unsubscribeStocks();
    };
  }, [processRates, showToast]);

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
    } catch (error) {
        console.error(error);
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
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="headlineSmall" style={[styles.titleMedium, themeStyles.sectionTitle]}>
              Mercado Bursátil
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Stocks')}>
                <Text variant="labelLarge" style={[styles.linkText, themeStyles.linkText]}>VER TODO</Text>
            </TouchableOpacity>
          </View>
          
          {stocks.map((stock) => (
            <StockItem 
              key={stock.id}
              {...stock}
              value={`${stock.price.toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`}
              change={`${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Calculator />
        </View>
      </ScrollView>
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