import React from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RateCard from '../components/dashboard/RateCard';
import SearchBar from '../components/ui/SearchBar';
import PromoCard from '../components/dashboard/PromoCard';

const ExchangeRatesScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Custom colors
  const accentGreen = (theme.colors as any).accentGreen || '#10B981';
  const accentRed = (theme.colors as any).accentRed || '#EF4444';

  const officialRates = [
    {
      title: 'USD / VES',
      subtitle: 'Banco Central de Venezuela',
      value: '36,58',
      changePercent: '0.14%',
      isPositive: true,
      iconName: 'account-balance',
      iconBgColor: theme.dark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
      iconColor: theme.colors.primary,
    },
    {
      title: 'EUR / VES',
      subtitle: 'Tasa Oficial Euro',
      value: '39,42',
      changePercent: '0.05%',
      isPositive: false,
      iconName: 'euro',
      iconBgColor: theme.dark ? '#1a2a3a' : '#F1F5F9',
      iconColor: theme.dark ? '#cbd5e1' : '#475569',
    }
  ];

  const cryptoRates = [
    {
      title: 'USDT / VES',
      subtitle: 'Tether (P2P Average)',
      value: '38,12',
      changePercent: '1.12%',
      isPositive: true,
      iconName: 'monetization-on',
      iconBgColor: 'rgba(38, 161, 123, 0.1)',
      iconColor: '#26A17B',
    },
    {
      title: 'BTC / VES',
      subtitle: 'Bitcoin',
      value: '2.345.901',
      changePercent: '2.45%',
      isPositive: true,
      iconName: 'currency-bitcoin',
      iconBgColor: 'rgba(247, 147, 26, 0.1)',
      iconColor: '#F7931A',
    },
    {
      title: 'ETH / VES',
      subtitle: 'Ethereum',
      value: '120.452',
      changePercent: '0.82%',
      isPositive: false,
      iconName: 'diamond',
      iconBgColor: 'rgba(98, 126, 234, 0.1)',
      iconColor: '#627EEA',
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        backgroundColor="transparent"
        translucent
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
      />

      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: theme.colors.background, // or transparent with blur if possible
        paddingTop: insets.top + 10,
        borderBottomColor: theme.colors.outline,
      }]}>
        <View style={styles.headerTop}>
          <View>
            <Text variant="headlineSmall" style={{ fontWeight: '800', letterSpacing: -0.5, color: theme.colors.onSurface }}>
              Tasas de Cambio
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: theme.colors.onSurfaceVariant }}>
              Mercado en vivo • VES
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.dark ? '#1a2a3a' : '#F1F5F9' }]}>
              <MaterialIcons name="history" size={22} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.dark ? '#1a2a3a' : '#F1F5F9' }]}>
              <MaterialIcons name="notifications" size={22} color={theme.colors.onSurfaceVariant} />
              <View style={[styles.badge, { backgroundColor: accentRed, borderColor: theme.colors.background }]} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={{ marginTop: 20 }}>
          <SearchBar />
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Oficial BCV */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>OFICIAL BCV</Text>
            <View style={[styles.tag, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Text style={[styles.tagText, { color: accentGreen }]}>ACTUALIZADO</Text>
            </View>
          </View>
          
          {officialRates.map((rate, index) => (
            <RateCard key={index} {...rate} />
          ))}
        </View>

        {/* Section: Cripto & Paralelo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>CRIPTO & PARALELO</Text>
          </View>
          
          {cryptoRates.map((rate, index) => (
            <RateCard key={index} {...rate} />
          ))}
        </View>

        {/* Promo Card */}
        <PromoCard />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    // borderBottomWidth: 1, // Optional: if we want separation line
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default ExchangeRatesScreen;
