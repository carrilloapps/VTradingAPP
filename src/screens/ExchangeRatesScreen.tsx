import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView } from 'react-native';
import { Text, useTheme, Chip } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RateCard from '../components/dashboard/RateCard';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import SearchBar from '../components/ui/SearchBar';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import { useFilters } from '../context/FilterContext';
import { useToast } from '../context/ToastContext';

const ExchangeRatesScreen = () => {
  const theme = useTheme();
  const { exchangeRateFilters, setExchangeRateFilters } = useFilters();
  const { query: searchQuery, type: filterType } = exchangeRateFilters;
  const { showToast } = useToast();
  
  // Custom colors
  const colors = theme.colors as any;
  const accentRed = colors.error;

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [allRates, setAllRates] = useState<CurrencyRate[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      setAllRates(data);
      setLoading(false);
      setError(null);
    });

    // Initial Fetch
    CurrencyService.getRates().catch(err => {
      console.error(err);
      setError('Error al cargar las tasas de cambio');
      showToast('Error de conexión', 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [showToast]);

  const onRefresh = useCallback(async () => {
      setRefreshing(true);
      try {
          await CurrencyService.getRates(true);
      } catch {
          showToast('Error al actualizar', 'error');
      } finally {
          setRefreshing(false);
      }
  }, [showToast]);

  const loadRates = useCallback(() => {
      setLoading(true);
      CurrencyService.getRates(true).catch(() => {
          showToast('Error al recargar', 'error');
          setLoading(false);
      });
  }, [showToast]);

  // Group rates for display
  const officialRates = filteredRates.filter(r => r.type === 'fiat');
  const cryptoRates = filteredRates.filter(r => r.type === 'crypto');

  const renderRateCard = (rate: CurrencyRate) => (
    <RateCard 
      key={rate.id}
      title={`${rate.code} / VES`}
      subtitle={rate.name}
      value={rate.value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      changePercent={rate.changePercent !== null ? `${Math.abs(rate.changePercent).toFixed(2)}%` : ''}
      isPositive={rate.changePercent !== null ? rate.changePercent >= 0 : true}
      iconName={rate.iconName || 'attach-money'}
      iconBgColor={rate.type === 'crypto' ? undefined : colors.infoContainer}
      iconColor={rate.type === 'crypto' ? undefined : colors.info}
    />
  );

  const renderChip = (label: string, value: 'all' | 'fiat' | 'crypto') => {
    const isSelected = filterType === value;
    return (
      <Chip 
        selected={isSelected} 
        onPress={() => setExchangeRateFilters({ type: value })}
        style={[
          styles.chip, 
          isSelected 
            ? [styles.chipSelected, { backgroundColor: theme.colors.primary }] 
            : [styles.chipUnselected, { borderColor: theme.colors.outline }]
        ]}
        textStyle={
          isSelected 
            ? styles.chipTextSelected 
            : [styles.chipTextUnselected, { color: theme.colors.onSurfaceVariant }]
        }
        showSelectedOverlay={false}
        rippleColor={isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
      >
        {label}
      </Chip>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
          subtitle="Mercado en vivo • VES"
          onActionPress={() => loadRates()}
          onNotificationPress={() => {}}
          notificationCount={1}
          style={styles.headerStyle}
        />
        
        <View style={styles.searchContainer}>
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
            {renderChip('Todas', 'all')}
            {renderChip('Fiat', 'fiat')}
            {renderChip('Cripto', 'crypto')}
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {loading && !refreshing && filteredRates.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.messageText, { color: theme.colors.onSurfaceVariant }]}>Cargando tasas...</Text>
          </View>
        ) : error && filteredRates.length === 0 ? (
           <View style={styles.centerContainer}>
            <MaterialIcons name="error-outline" size={40} color={accentRed} />
            <Text style={[styles.messageText, { color: theme.colors.onSurface }]}>{error}</Text>
            <TouchableOpacity onPress={() => loadRates()} style={styles.retryButton}>
              <Text style={[styles.retryText, { color: theme.colors.primary }]}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filteredRates.length === 0 ? (
          <View style={styles.centerContainer}>
             <MaterialIcons name="search-off" size={40} color={theme.colors.onSurfaceVariant} />
             <Text style={[styles.messageText, { color: theme.colors.onSurfaceVariant }]}>
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
                  <View style={[styles.tag, { backgroundColor: colors.successContainer }]}>
                    <Text style={[styles.tagText, { color: colors.success }]}>ACTUALIZADO</Text>
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
            
            {/* Fallback if we have rates but they don't match categories (shouldn't happen with current logic but good safety) */}
            {officialRates.length === 0 && cryptoRates.length === 0 && filteredRates.length > 0 && (
                 <View style={styles.section}>
                    {filteredRates.map(renderRateCard)}
                 </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 10,
    zIndex: 1,
  },
  headerStyle: {
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  searchContainer: {
    paddingHorizontal: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
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
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  chip: {
    marginRight: 0,
  },
  chipSelected: {
    borderWidth: 0,
  },
  chipUnselected: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  chipTextUnselected: {
    // color handled in prop
  },
});

export default ExchangeRatesScreen;
