import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, useTheme, TouchableRipple, Chip } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RateCard from '../components/dashboard/RateCard';
import SearchBar from '../components/ui/SearchBar';
import PromoCard from '../components/dashboard/PromoCard';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';

const ExchangeRatesScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Custom colors
  const accentGreen = (theme.colors as any).accentGreen || '#10B981';
  const accentRed = (theme.colors as any).accentRed || '#EF4444';

  // State
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'fiat' | 'crypto'>('all');
  const [allRates, setAllRates] = useState<CurrencyRate[]>([]);
  const [filteredRates, setFilteredRates] = useState<CurrencyRate[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const loadRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rates = await CurrencyService.getRates();
      setAllRates(rates);
      // Initial filter application handled by effect
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
  useEffect(() => {
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

    setFilteredRates(result);
  }, [searchQuery, filterType, allRates]);

  // Handle Search Input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
      <View style={[styles.header, { 
        backgroundColor: theme.colors.background,
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
            <TouchableRipple 
              onPress={() => loadRates()} 
              style={[styles.iconButton, { backgroundColor: theme.dark ? '#1a2a3a' : '#F1F5F9' }]}
              borderless
              rippleColor="rgba(0, 0, 0, .1)"
            >
              <MaterialIcons name="refresh" size={22} color={theme.colors.onSurfaceVariant} />
            </TouchableRipple>
            <TouchableRipple 
              onPress={() => {}} 
              style={[styles.iconButton, { backgroundColor: theme.dark ? '#1a2a3a' : '#F1F5F9' }]}
              borderless
              rippleColor="rgba(0, 0, 0, .1)"
            >
              <View>
                <MaterialIcons name="notifications" size={22} color={theme.colors.onSurfaceVariant} />
                <View style={[styles.badge, { backgroundColor: accentRed, borderColor: theme.colors.background }]} />
              </View>
            </TouchableRipple>
          </View>
        </View>
        
        <View style={{ marginTop: 20 }}>
          <SearchBar 
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Buscar moneda o token..."
            onFilterPress={() => setShowFilters(!showFilters)}
          />
        </View>

        {/* Filter Chips */}
        {showFilters && (
          <View style={styles.filterContainer}>
            <Chip 
              selected={filterType === 'all'} 
              onPress={() => setFilterType('all')}
              style={styles.chip}
              showSelectedOverlay
            >
              Todas
            </Chip>
            <Chip 
              selected={filterType === 'fiat'} 
              onPress={() => setFilterType('fiat')}
              style={styles.chip}
              showSelectedOverlay
            >
              Fiat
            </Chip>
            <Chip 
              selected={filterType === 'crypto'} 
              onPress={() => setFilterType('crypto')}
              style={styles.chip}
              showSelectedOverlay
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
