import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import MarketStatus from '../components/dashboard/MarketStatus';
import ExchangeCard from '../components/dashboard/ExchangeCard';
import StockItem from '../components/dashboard/StockItem';
import Calculator from '../components/dashboard/Calculator';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';

const HomeScreen = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, process.env.NODE_ENV === 'test' ? 0 : 2000); // 2 seconds delay to show skeleton (0 in tests)
    return () => clearTimeout(timer);
  }, []);

  // Mock Data
  const userData = {
    name: 'Carlos',
    avatarUrl: 'https://i.pravatar.cc/150?u=carlos',
    notificationCount: 3
  };

  const exchangeData = [
    {
      title: 'Dólar MEP',
      subtitle: 'DÓLAR BOLSA',
      value: '1.245,50',
      currency: 'ARS',
      changePercent: '1.2%',
      isPositive: true,
      chartPath: 'M0 20 Q 25 35 50 15 T 100 5', // Simple curve
      iconSymbol: '$'
    },
    {
      title: 'Bitcoin',
      subtitle: 'BTC/USD',
      value: '42.150,00',
      currency: 'USD',
      changePercent: '0.8%',
      isPositive: false,
      chartPath: 'M0 10 Q 25 5 50 25 T 100 35', // Downward curve
      iconSymbol: '₿',
      iconColor: '#F7931A'
    }
  ];

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
      >
        <MarketStatus isOpen={true} updatedAt="14:35 HS" />

        <View style={styles.section}>
          {exchangeData.map((item, index) => (
            <ExchangeCard key={index} {...item} />
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
              {/* Using a simple view as placeholder for icon if needed */}
            </View>
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
  }
});

export default HomeScreen;
