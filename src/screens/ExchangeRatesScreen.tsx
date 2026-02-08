import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FlashList } from '@shopify/flash-list';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import RateCard from '@/components/dashboard/RateCard';
import UnifiedHeader from '@/components/ui/UnifiedHeader';
import SearchBar from '@/components/ui/SearchBar';
import FilterSection from '@/components/ui/FilterSection';
import ExchangeRatesSkeleton from '@/components/dashboard/ExchangeRatesSkeleton';
import { CurrencyService, CurrencyRate } from '@/services/CurrencyService';
import { StocksService } from '@/services/StocksService';
import { observabilityService } from '@/services/ObservabilityService';
import { useFilterStore } from '@/stores/filterStore';
import { useToastStore } from '@/stores/toastStore';
import { useAppTheme } from '@/theme';

const isFabricEnabled = !!(globalThis as any).nativeFabricUIManager;

if (Platform.OS === 'android' && !isFabricEnabled) {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface ListItem {
  type: 'header' | 'rate' | 'empty';
  id: string; // Unique key
  data?: CurrencyRate;
  title?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const ExchangeRatesScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const { exchangeRateFilters, setExchangeRateFilters } = useFilterStore();
  const { query: searchQuery, type: filterType } = exchangeRateFilters;
  const showToast = useToastStore(state => state.showToast);

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
      result = result.filter(
        r => r.code.toLowerCase().includes(lowerQuery) || r.name.toLowerCase().includes(lowerQuery),
      );
    }

    return result;
  }, [allRates, filterType, searchQuery]);

  // Subscription and Data Loading
  useEffect(() => {
    const unsubscribe = CurrencyService.subscribe(data => {
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
    Promise.all([CurrencyService.getRates(), StocksService.getStocks()])
      .then(() => {
        setIsMarketOpen(StocksService.isMarketOpen());
      })
      .catch(e => {
        observabilityService.captureError(e, {
          context: 'ExchangeRatesScreen.loadData',
          action: 'fetch_initial_data',
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
      await Promise.all([CurrencyService.getRates(true), StocksService.getStocks(true)]);
      setIsMarketOpen(StocksService.isMarketOpen());
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'ExchangeRatesScreen.onRefresh',
        action: 'refresh_rates_and_stocks',
      });
      showToast('Error al actualizar', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [showToast]);

  const loadRates = useCallback(() => {
    setLoading(true);
    CurrencyService.getRates(true).catch(e => {
      observabilityService.captureError(e, {
        context: 'ExchangeRatesScreen.loadRates',
        action: 'reload_rates',
      });
      showToast('Error al recargar', 'error');
      setLoading(false);
    });
  }, [showToast]);

  // Flatten Data for FlashList
  const listData = useMemo<ListItem[]>(() => {
    if (loading && !refreshing && allRates.length === 0) return [];
    if (error && filteredRates.length === 0) return [{ type: 'empty', id: 'error-state' }];
    if (filteredRates.length === 0) return [{ type: 'empty', id: 'empty-state' }];

    const items: ListItem[] = [];

    // Helper to add section
    const addSection = (
      title: string,
      rates: CurrencyRate[],
      action?: { label: string; onPress: () => void },
    ) => {
      if (rates.length > 0) {
        items.push({ type: 'header', id: `header-${title}`, title, action });
        rates.forEach(r => items.push({ type: 'rate', id: r.id, data: r }));
      }
    };

    // Group rates
    const officialRates = filteredRates
      .filter(r => r.type === 'fiat')
      .sort((a, b) => {
        if (a.code === 'USD') return -1;
        if (b.code === 'USD') return 1;
        if (a.code === 'EUR') return -1;
        if (b.code === 'EUR') return 1;
        return 0;
      });

    const borderRates = filteredRates
      .filter(r => r.type === 'border')
      .sort((a, b) => {
        if (a.code === 'USD') return -1;
        if (b.code === 'USD') return 1;
        if (a.code === 'EUR') return -1;
        if (b.code === 'EUR') return 1;
        return 0;
      });

    const cryptoRates = filteredRates.filter(r => r.type === 'crypto');
    const otherRates = filteredRates.filter(
      r => r.type !== 'fiat' && r.type !== 'crypto' && r.type !== 'border',
    );

    addSection('Tasa oficial • BCV', officialRates, {
      label: 'VER MESAS DE CAMBIO',
      onPress: () => navigation.navigate('BankRates'),
    });
    addSection('Mercado Fronterizo (P2P)', borderRates);
    addSection('Mercado Cripto (P2P)', cryptoRates);
    addSection('Otras Tasas', otherRates);

    return items;
  }, [filteredRates, loading, refreshing, allRates, error, navigation]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              {item.title}
            </Text>
            {item.action && (
              <TouchableOpacity
                onPress={item.action.onPress}
                activeOpacity={0.7}
                style={[
                  styles.tag,
                  styles.tagContainer,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <Text style={[styles.tagText, { color: theme.colors.onPrimaryContainer }]}>
                  {item.action.label}
                </Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={12}
                  color={theme.colors.onPrimaryContainer}
                />
              </TouchableOpacity>
            )}
          </View>
        );
      }

      if (item.type === 'rate' && item.data) {
        const rate = item.data;
        const getDescriptiveSubtitle = (r: CurrencyRate) => {
          if (r.type === 'fiat') return 'Banco Central de Venezuela';
          if (r.type === 'crypto') return 'Cripto • P2P';
          if (r.type === 'border') return 'Frontera • P2P';
          return r.name;
        };

        // Border rates now come correctly calculated as Foreign/VES
        // For very small values (< 1), we can invert for better readability
        const shouldInvertDisplay = rate.type === 'border' && rate.value < 1;
        const displayValue = shouldInvertDisplay
          ? (1 / rate.value).toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : rate.value.toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

        const displayTitle = shouldInvertDisplay ? `${rate.code} / VES` : `VES / ${rate.code}`;

        const displayCurrency = shouldInvertDisplay ? 'Bs' : rate.code;

        return (
          <RateCard
            title={displayTitle}
            subtitle={getDescriptiveSubtitle(rate)}
            value={`${displayValue} ${displayCurrency}`}
            changePercent={
              rate.changePercent !== null ? `${Math.abs(rate.changePercent).toFixed(2)}%` : ''
            }
            isPositive={rate.changePercent !== null ? rate.changePercent >= 0 : true}
            iconName={rate.iconName || 'currency-usd'}
            iconBgColor={rate.type === 'crypto' ? undefined : theme.colors.infoContainer}
            iconColor={rate.type === 'crypto' ? undefined : theme.colors.info}
            onPress={() => navigation.navigate('CurrencyDetail', { rate })}
          />
        );
      }

      if (item.type === 'empty') {
        if (error) {
          return (
            <View style={styles.centerContainer}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={40}
                color={theme.colors.error}
              />
              <Text style={[styles.messageText, { color: theme.colors.onSurface }]}>{error}</Text>
              <TouchableOpacity onPress={() => loadRates()} style={styles.retryButton}>
                <Text style={[styles.retryText, { color: theme.colors.primary }]}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons
              name="magnify-remove-outline"
              size={40}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.messageText, { color: theme.colors.onSurfaceVariant }]}>
              {filterType !== 'all'
                ? `No hay resultados para "${filterType}"`
                : 'No se encontraron resultados'}
            </Text>
          </View>
        );
      }

      return null;
    },
    [theme.colors, navigation, error, loadRates, filterType],
  );

  const renderHeader = () => (
    <View>
      <FilterSection
        options={[
          { label: 'Todas', value: 'all' },
          { label: 'Fiat', value: 'fiat' },
          { label: 'Cripto', value: 'crypto' },
          { label: 'Fronterizo', value: 'border' },
        ]}
        selectedValue={filterType}
        onSelect={value => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExchangeRateFilters({ type: value as any });
        }}
        visible={showFilters}
        mode="wrap"
        style={styles.filterStyle}
      />
    </View>
  );

  if (loading && !refreshing && allRates.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          backgroundColor="transparent"
          translucent
          barStyle={theme.dark ? 'light-content' : 'dark-content'}
        />
        <ExchangeRatesSkeleton />
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

      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.background }]}>
        <UnifiedHeader
          variant="section"
          title="Tasas de Cambio"
          subtitle={
            isMarketOpen ? 'Mercado abierto (Tiempo real)' : 'Mercado BCV cerrado • P2P activo'
          }
          subtitleIcon={isMarketOpen ? 'clock-check-outline' : 'clock-alert-outline'}
          subtitleIconColor={isMarketOpen ? theme.colors.success : theme.colors.warning}
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

      <View style={styles.content}>
        <FlashList
          data={listData}
          renderItem={renderItem}
          {...({ estimatedItemSize: 100 } as any)}
          getItemType={(item: ListItem) => item.type}
          ListHeaderComponent={renderHeader}
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
        />
      </View>
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
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 24,
    paddingHorizontal: 20,
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
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ExchangeRatesScreen;
