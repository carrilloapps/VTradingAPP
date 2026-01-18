import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import MarketStatus from '../components/dashboard/MarketStatus';
import ExchangeCard, { ExchangeCardProps } from '../components/dashboard/ExchangeCard';
import StockItem, { StockItemProps } from '../components/dashboard/StockItem';
import Calculator from '../components/dashboard/Calculator';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AppConfig } from '../constants/AppConfig';

const HomeScreen = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [featuredRates, setFeaturedRates] = useState<ExchangeCardProps[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const processRates = useCallback((data: CurrencyRate[]) => {
      // Prioritize USD and USDT for the Home Screen
      const homeRates: CurrencyRate[] = [];
      const usdRate = data.find(r => r.code === 'USD');
      const usdtRate = data.find(r => r.code === 'USDT');

      if (usdRate) homeRates.push(usdRate);
      if (usdtRate) homeRates.push(usdtRate);
      
      // Transform rates to ExchangeCard format
      const featured = homeRates.map(rate => ({
        title: rate.name,
        subtitle: '',
        value: rate.value.toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: AppConfig.DECIMAL_PLACES, maximumFractionDigits: AppConfig.DECIMAL_PLACES }),
        currency: 'Bs',
        changePercent: rate.changePercent !== null ? `${rate.changePercent.toFixed(2)}%` : '0.00%', 
        isPositive: rate.changePercent !== null ? rate.changePercent >= 0 : true,
        chartPath: rate.changePercent !== null 
             ? (rate.changePercent >= 0 ? 'M0 20 Q 25 35 50 15 T 100 5' : 'M0 10 Q 25 5 50 25 T 100 35')
             : 'M0 20 L 100 20',
        iconSymbol: rate.iconName === 'euro' ? '€' : '$',
        iconColor: rate.type === 'crypto' ? '#F7931A' : undefined,
        buyValue: rate.buyValue?.toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: AppConfig.DECIMAL_PLACES, maximumFractionDigits: AppConfig.DECIMAL_PLACES }),
        sellValue: rate.sellValue?.toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: AppConfig.DECIMAL_PLACES, maximumFractionDigits: AppConfig.DECIMAL_PLACES }),
        buyChangePercent: rate.buyChangePercent !== undefined ? `${rate.buyChangePercent > 0 ? '+' : ''}${rate.buyChangePercent.toFixed(2)}%` : undefined,
        sellChangePercent: rate.sellChangePercent !== undefined ? `${rate.sellChangePercent > 0 ? '+' : ''}${rate.sellChangePercent.toFixed(2)}%` : undefined,
      }));
      setFeaturedRates(featured);
  }, []);

  useEffect(() => {
    const unsubscribe = CurrencyService.subscribe((data) => {
        setRates(data);
        processRates(data);
        setLoading(false);
        setLastRefreshTime(new Date());
    });

    // Initial fetch
    CurrencyService.getRates().catch(error => {
        console.error(error);
        showToast('Error al actualizar tasas', 'error');
        setLoading(false);
    });

    return () => unsubscribe();
  }, [processRates, showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
        await CurrencyService.getRates(true);
        showToast('Tasas actualizadas', 'success');
        setLastRefreshTime(new Date()); // Force update time immediately on success
    } catch (error) {
        console.error(error);
        showToast('Error al actualizar tasas', 'error');
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
    name: user?.displayName || user?.email?.split('@')[0] || 'Usuario',
    avatarUrl: user?.photoURL || 'https://i.pravatar.cc/150?u=user',
    notificationCount: 3, // Mock for now
    isPremium: !!(user && !user.isAnonymous) // Only registered users are Premium
  };

  const stocksData: StockItemProps[] = [
    { symbol: 'BOLSA DE CARACAS', name: 'Banco Provincial', value: '14.50 Bs', change: '2.4%', isPositive: true, iconName: 'account-balance' },
    { symbol: 'TELECOMUNICACIONES', name: 'CANTV Clase D', value: '3.85 Bs', change: '-0.8%', isPositive: false, iconName: 'wifi-tethering' },
    { symbol: 'FONDO DE VALORES', name: 'Fondo de Valores', value: '0.92 Bs', change: '1.2%', isPositive: true, iconName: 'pie-chart' }
  ];

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
        notificationCount={userData.notificationCount}
        isPremium={userData.isPremium} 
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <MarketStatus 
            isOpen={true} 
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
            <TouchableOpacity onPress={() => showToast('Ver todo', 'info')}>
                <Text variant="labelLarge" style={[styles.linkText, themeStyles.linkText]}>VER TODO</Text>
            </TouchableOpacity>
          </View>
          
          {stocksData.map((stock, index) => (
            <StockItem key={index} {...stock} />
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