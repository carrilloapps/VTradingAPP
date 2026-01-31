import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, RefreshControl, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RateCard from '../components/dashboard/RateCard';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import SearchBar from '../components/ui/SearchBar';
import FilterSection from '../components/ui/FilterSection';
import ExchangeRatesSkeleton from '../components/dashboard/ExchangeRatesSkeleton';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import { StocksService } from '../services/StocksService';
import { observabilityService } from '../services/ObservabilityService';
import { useFilters } from '../context/FilterContext';
import { useToastStore } from '../stores/toastStore';
import { useAppTheme } from '../theme/theme';

const isFabricEnabled = !!(globalThis as any).nativeFabricUIManager;

if (Platform.OS === 'android' && !isFabricEnabled) {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const ExchangeRatesScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const { exchangeRateFilters, setExchangeRateFilters } = useFilters();
  const { query: searchQuery, type: filterType } = exchangeRateFilters;
  const showToast = useToastStore((state) => state.showToast);
  
  // Custom colors
  const colors = theme.colors;
  const accentRed = colors.error;

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [allRates, setAllRates] = useState<CurrencyRate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState(StocksService.isMarketOpen());

  const handleSearch = (text: string) => {
    setExchangeRateFilters({ query: text });
  };

  const filteredRates = useMemo(() => {
    let result = allRates;

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(r => r.type === filterType);
    }

    // Filter by query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.code.toLowerCase().includes(lowerQuery) || 
        r.name.toLowerCase().includes(lowerQuery)
      );
    }

    return result;
  }, [allRates, filterType, searchQuery]);

  // Subscription and Data Loading
  useEffect(() => {
    const unsubscribe = CurrencyService.subscribe((data) => {
      // Filter out VES (Base Currency) as showing VES/VES = 1 is redundant
      const displayRates = data.filter(r => r.code !== 'VES' && r.code !== 'Bs');
      setAllRates(displayRates);
      setLoading(false);
      setError(null);
    });

    // Subscribe to Stocks for Market Status
    const unsubscribeStocks = StocksService.subscribe(() => {
        setIsMarketOpen(StocksService.isMarketOpen());
    });

    // Initial Fetch
    Promise.all([
        CurrencyService.getRates(),
        StocksService.getStocks()
    ]).then(() => {
        setIsMarketOpen(StocksService.isMarketOpen());
    }).catch((e) => {
      observabilityService.captureError(e, {
        context: 'ExchangeRatesScreen.loadData',
        action: 'fetch_initial_data'
      });
      setError('Error al cargar las tasas de cambio');
      showToast('Error de conexión', 'error');
      setLoading(false);
    });

    return () => {
        unsubscribe();
        unsubscribeStocks();
    };
  }, [showToast]);

  const onRefresh = useCallback(async () => {
      setRefreshing(true);
      try {
          await Promise.all([
             CurrencyService.getRates(true),
             StocksService.getStocks(true)
          ]);
          setIsMarketOpen(StocksService.isMarketOpen());
      } catch (e) {
          observabilityService.captureError(e, {
              context: 'ExchangeRatesScreen.onRefresh',
              action: 'refresh_rates_and_stocks'
          });
          showToast('Error al actualizar', 'error');
      } finally {
          setRefreshing(false);
      }
  }, [showToast]);

  const loadRates = useCallback(() => {
      setLoading(true);
      CurrencyService.getRates(true).catch((e) => {
          observabilityService.captureError(e, {
              context: 'ExchangeRatesScreen.loadRates',
              action: 'reload_rates'
          });
          showToast('Error al recargar', 'error');
          setLoading(false);
      });
  }, [showToast]);

  // Group rates for display
  const officialRates = useMemo(() => {
    const rates = filteredRates.filter(r => r.type === 'fiat');
    return rates.sort((a, b) => {
      // Priority: USD first, then EUR
      if (a.code === 'USD') return -1;
      if (b.code === 'USD') return 1;
      if (a.code === 'EUR') return -1;
      if (b.code === 'EUR') return 1;
      return 0; // Keep original order for others
    });
  }, [filteredRates]);

  const borderRates = useMemo(() => {
    const rates = filteredRates.filter(r => r.type === 'border');
    return rates.sort((a, b) => {
      // Priority: USD first, then EUR
      if (a.code === 'USD') return -1;
      if (b.code === 'USD') return 1;
      if (a.code === 'EUR') return -1;
      if (b.code === 'EUR') return 1;
      return 0;
    });
  }, [filteredRates]);
  const cryptoRates = useMemo(() => filteredRates.filter(r => r.type === 'crypto'), [filteredRates]);
  const otherRates = useMemo(() => filteredRates.filter(r => r.type !== 'fiat' && r.type !== 'crypto' && r.type !== 'border'), [filteredRates]);

  const renderRateCard = (rate: CurrencyRate) => (
    <RateCard 
      key={rate.id}
      title={`${rate.code} / VES`}
      subtitle={rate.name}
      value={`${rate.value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`}
      changePercent={rate.changePercent !== null ? `${Math.abs(rate.changePercent).toFixed(2)}%` : ''}
      isPositive={rate.changePercent !== null ? rate.changePercent >= 0 : true}
      iconName={rate.iconName || 'currency-usd'}
      iconBgColor={rate.type === 'crypto' ? undefined : colors.infoContainer}
      iconColor={rate.type === 'crypto' ? undefined : colors.info}
      onPress={() => navigation.navigate('CurrencyDetail', { rate })}
    />
  );

  // Pre-calculate dynamic styles
  const containerBgColor = theme.colors.background;
  const statusBarStyle = theme.dark ? 'light-content' : 'dark-content';
  const headerContainerBg = theme.colors.background;
  const messageTextColor = theme.colors.onSurface;
  const retryTextColor = theme.colors.primary;
  const emptyIconColor = theme.colors.onSurfaceVariant;
  const emptyMessageColor = theme.colors.onSurfaceVariant;
  const sectionTitleColor = theme.colors.onSurfaceVariant;
  const bcvBadgeBg = theme.colors.primaryContainer;
  const bcvBadgeTextColor = theme.colors.onPrimaryContainer;

  if (loading && !refreshing && allRates.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: containerBgColor }]}>
        <StatusBar 
          backgroundColor="transparent"
          translucent
          barStyle={statusBarStyle} 
        />
        <ExchangeRatesSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: containerBgColor }]}>
      <StatusBar 
        backgroundColor="transparent"
        translucent
        barStyle={statusBarStyle} 
      />

      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: headerContainerBg }]}>
        <UnifiedHeader
          variant="section"
          title="Tasas de Cambio"
          subtitle={isMarketOpen ? "Mercado abierto (Tiempo real)" : "Mercado BCV cerrado • P2P activo (Tiempo real)"}
          onActionPress={() => loadRates()}
          rightActionIcon="refresh"
          onNotificationPress={() => {}}
          notificationCount={1}
          style={styles.headerStyle}
        />
        
        <View style={styles.searchContainer}>
          <SearchBar 
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Buscar moneda o token..."
            onFilterPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowFilters(!showFilters);
            }}
          />
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.elevation.level3}
            />
        }
      >
        {/* Filter Chips */}
        <FilterSection 
          options={[
            { label: 'Todas', value: 'all' },
            { label: 'Fiat', value: 'fiat' },
            { label: 'Cripto', value: 'crypto' },
            { label: 'Fronterizo', value: 'border' },
          ]}
          selectedValue={filterType}
          onSelect={(value) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExchangeRateFilters({ type: value as any });
          }}
          visible={showFilters}
          mode="wrap"
          style={styles.filterStyle}
        />

        {error && filteredRates.length === 0 ? (
           <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color={accentRed} />
            <Text style={[styles.messageText, { color: messageTextColor }]}>{error}</Text>
            <TouchableOpacity onPress={() => loadRates()} style={styles.retryButton}>
              <Text style={[styles.retryText, { color: retryTextColor }]}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filteredRates.length === 0 ? (
          <View style={styles.centerContainer}>
             <MaterialCommunityIcons name="magnify-remove-outline" size={40} color={emptyIconColor} />
             <Text style={[styles.messageText, { color: emptyMessageColor }]}>
               {filterType !== 'all' 
                 ? `No hay resultados para "${filterType}"` 
                 : "No se encontraron resultados"}
             </Text>
          </View>
        ) : (
          <>
            {/* Section: Oficial BCV */}
            {officialRates.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Tasa oficial del BCV</Text>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('BankRates')}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Ver mesas de cambio"
                    style={[styles.tag, styles.tagContainer, { backgroundColor: bcvBadgeBg }]}>
                    <Text style={[styles.tagText, { 
                        color: bcvBadgeTextColor 
                    }]}>
                        VER MESAS DE CAMBIO
                    </Text>
                    <MaterialCommunityIcons name="arrow-right" size={12} color={bcvBadgeTextColor} />
                  </TouchableOpacity>
                </View>
                {officialRates.map(renderRateCard)}
              </View>
            )}

            {/* Section: Border */}
            {borderRates.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Mercado Fronterizo (P2P)</Text>
                </View>
                {borderRates.map(renderRateCard)}
              </View>
            )}

            {/* Section: Cripto */}
            {cryptoRates.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Mercado Cripto (P2P)</Text>
                </View>
                {cryptoRates.map(renderRateCard)}
              </View>
            )}
            
            {/* Section: Others */}
            {otherRates.length > 0 && (
                 <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Otras Tasas</Text>
                    </View>
                    {otherRates.map(renderRateCard)}
                 </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 8,
  },
  headerStyle: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  filterStyle: {
    marginTop: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for FAB or Bottom Tab
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  messageText: {
    marginTop: 16,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    padding: 10,
  },
  retryText: {
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ExchangeRatesScreen;
