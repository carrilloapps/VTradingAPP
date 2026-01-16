import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, useTheme, TouchableRipple, Chip } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RateCard from '../components/dashboard/RateCard';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import SearchBar from '../components/ui/SearchBar';
import PromoCard from '../components/dashboard/PromoCard';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import { useFilters } from '../context/FilterContext';

const ExchangeRatesScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { exchangeRateFilters, setExchangeRateFilters } = useFilters();
  const { query: searchQuery, type: filterType } = exchangeRateFilters;
  
  // Custom colors
  const accentGreen = (theme.colors as any).accentGreen || '#10B981';
  const accentRed = (theme.colors as any).accentRed || '#EF4444';

  // State
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [allRates, setAllRates] = useState<CurrencyRate[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const loadRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rates = await CurrencyService.getRates();
      setAllRates(rates);
    } catch (err) {
      setError('Error al cargar las tasas de cambio');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  // Combined Filter Logic
  const filteredRates = useMemo(() => {
    let result = allRates;

    // 1. Text Search
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.code.toLowerCase().includes(lower) || 
        r.name.toLowerCase().includes(lower)
      );
    }

    // 2. Type Filter
    if (filterType !== 'all') {
      result = result.filter(r => r.type === filterType);
    }

    return result;
  }, [searchQuery, filterType, allRates]);

  // Suggestions Logic
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const lower = searchQuery.toLowerCase();
    return allRates
      .filter(r => r.code.toLowerCase().includes(lower) || r.name.toLowerCase().includes(lower))
      .slice(0, 3)
      .map(r => r.name);
  }, [searchQuery, allRates]);

  // Handle Search Input
  const handleSearch = (query: string) => {
    setExchangeRateFilters({ query });
  };

  const handleSuggestionPress = (suggestion: string) => {
    setExchangeRateFilters({ query: suggestion });
  };

  // Group rates for display
  const officialRates = filteredRates.filter(r => r.type === 'fiat');
  const cryptoRates = filteredRates.filter(r => r.type === 'crypto');

  const renderRateCard = (rate: CurrencyRate) => (
    <RateCard 
      key={rate.id}
      title={`${rate.code} / VES`}
      subtitle={rate.name}
      value={rate.value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      changePercent={`${Math.abs(rate.changePercent)}%`}
      isPositive={rate.changePercent >= 0}
      iconName={rate.iconName || 'attach-money'}
      iconBgColor={rate.type === 'crypto' ? undefined : (theme.dark ? '#1a2a3a' : '#F1F5F9')}
      iconColor={rate.type === 'crypto' ? undefined : (theme.dark ? '#cbd5e1' : '#475569')}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        backgroundColor="transparent"
        translucent
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
      />

      {/* Header */}
      <View style={{ backgroundColor: theme.colors.background, paddingBottom: 16 }}>
        <UnifiedHeader
          variant="section"
          title="Tasas de Cambio"
          subtitle="Mercado en vivo • VES"
          onActionPress={() => loadRates()}
          onNotificationPress={() => {}}
          notificationCount={1}
          style={{ paddingBottom: 0, borderBottomWidth: 0 }}
        />
        
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <SearchBar 
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Buscar moneda o token..."
            onFilterPress={() => setShowFilters(!showFilters)}
          />
        </View>

        {/* Filter Chips */}
        {showFilters && (
          <View style={[styles.filterContainer, { paddingHorizontal: 20 }]}>
            <Chip 
              selected={filterType === 'all'} 
              onPress={() => setExchangeRateFilters({ type: 'all' })}
              style={styles.chip}
              showSelectedOverlay
              accessibilityLabel="Filtro: Todas"
              accessibilityState={{ selected: filterType === 'all' }}
            >
              Todas
            </Chip>
            <Chip 
              selected={filterType === 'fiat'} 
              onPress={() => setExchangeRateFilters({ type: 'fiat' })}
              style={styles.chip}
              showSelectedOverlay
              accessibilityLabel="Filtro: Fiat"
              accessibilityState={{ selected: filterType === 'fiat' }}
            >
              Fiat
            </Chip>
            <Chip 
              selected={filterType === 'crypto'} 
              onPress={() => setExchangeRateFilters({ type: 'crypto' })}
              style={styles.chip}
              showSelectedOverlay
              accessibilityLabel="Filtro: Cripto"
              accessibilityState={{ selected: filterType === 'crypto' }}
            >
              Cripto
            </Chip>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading && filteredRates.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 10, color: theme.colors.onSurfaceVariant }}>Cargando tasas...</Text>
          </View>
        ) : error ? (
           <View style={styles.centerContainer}>
            <MaterialIcons name="error-outline" size={40} color={accentRed} />
            <Text style={{ marginTop: 10, color: theme.colors.onSurface }}>{error}</Text>
            <TouchableOpacity onPress={loadRates} style={{ marginTop: 10 }}>
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filteredRates.length === 0 ? (
          <View style={styles.centerContainer}>
             <MaterialIcons name="search-off" size={40} color={theme.colors.onSurfaceVariant} />
             <Text style={{ marginTop: 10, color: theme.colors.onSurfaceVariant }}>
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
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>OFICIAL & FIAT</Text>
                  <View style={[styles.tag, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Text style={[styles.tagText, { color: accentGreen }]}>ACTUALIZADO</Text>
                  </View>
                </View>
                {officialRates.map(renderRateCard)}
              </View>
            )}

            {/* Section: Cripto & Paralelo */}
            {cryptoRates.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>CRIPTO & PARALELO</Text>
                </View>
                {cryptoRates.map(renderRateCard)}
              </View>
            )}

            {/* Promo Card */}
            <PromoCard />
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    overflow: 'hidden', // Required for Ripple
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
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
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  chip: {
    marginRight: 4,
  }
});

export default ExchangeRatesScreen;
