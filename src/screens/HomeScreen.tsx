import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import MarketStatus from '../components/dashboard/MarketStatus';
import ExchangeCard from '../components/dashboard/ExchangeCard';
import StockItem from '../components/dashboard/StockItem';
import Calculator from '../components/dashboard/Calculator';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const HomeScreen = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [featuredRates, setFeaturedRates] = useState<any[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const processRates = useCallback((data: CurrencyRate[]) => {
      // Prioritize USD and USDT for the Home Screen
      const usdRate = data.find(r => r.code === 'USD');
      const usdtRate = data.find(r => r.code === 'USDT');
      
      const homeRates = [];
      if (usdRate) homeRates.push(usdRate);
      if (usdtRate) homeRates.push(usdtRate);
      
      // Transform rates to ExchangeCard format
      const featured = homeRates.map(rate => ({
        title: rate.name,
        subtitle: `${rate.code}/VES`,
        value: rate.value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        currency: 'VES',
        changePercent: `${rate.changePercent > 0 ? '+' : ''}${rate.changePercent.toFixed(2)}%`,
        isPositive: rate.changePercent >= 0,
        chartPath: rate.changePercent >= 0 ? 'M0 20 Q 25 35 50 15 T 100 5' : 'M0 10 Q 25 5 50 25 T 100 35',
        iconSymbol: rate.iconName === 'euro' ? '€' : '$',
        iconColor: rate.type === 'crypto' ? '#F7931A' : undefined
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
        // State update happens via subscription
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
    notificationCount: 3 // Mock for now
  };

  const stocksData = [
    { symbol: 'GGAL', name: 'Grupo Financiero Galicia', value: '$2.450,00', change: '2.4%', isPositive: true, volume: '1.2M' },
    { symbol: 'YPF', name: 'YPF Sociedad Anónima', value: '$18.230,00', change: '0.5%', isPositive: false, volume: '850K' },
    { symbol: 'PAMP', name: 'Pampa Energía S.A.', value: '$1.890,50', change: '1.8%', isPositive: true, volume: '540K' }
  ];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
                setRefreshing(true);
                loadData();
            }}
        />

        <View style={styles.section}>
          {featuredRates.map((item, index) => (
            <ExchangeCard key={index} {...item} />
          ))}
          {featuredRates.length === 0 && (
             <Text style={{ textAlign: 'center', marginVertical: 20, color: theme.colors.onSurfaceVariant }}>
               No hay tasas disponibles
             </Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialIcons name="analytics" size={20} color={theme.colors.primary} />
            </View>
            <Text variant="titleMedium" style={[styles.titleMedium, { color: theme.colors.onSurface }]}>
              Acciones más negociadas
            </Text>
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
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    // Add icon inside if needed
  },
  titleMedium: {
    fontWeight: 'bold',
  }
});

export default HomeScreen;
