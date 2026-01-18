import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, RefreshControl, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Text } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RateCard from '../components/dashboard/RateCard';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import SearchBar from '../components/ui/SearchBar';
import FilterSection from '../components/ui/FilterSection';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import { useFilters } from '../context/FilterContext';
import { useToast } from '../context/ToastContext';
import { useAppTheme } from '../theme/useAppTheme';

const ExchangeRatesScreen = () => {
  const theme = useAppTheme();
  const { exchangeRateFilters, setExchangeRateFilters } = useFilters();
  const { query: searchQuery, type: filterType } = exchangeRateFilters;
  const { showToast } = useToast();
  
  // Custom colors
  const colors = theme.colors;
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
      // Filter out VES (Base Currency) as showing VES/VES = 1 is redundant
      const displayRates = data.filter(r => r.code !== 'VES' && r.code !== 'Bs');
      setAllRates(displayRates);
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
  const otherRates = filteredRates.filter(r => r.type !== 'fiat' && r.type !== 'crypto');

  const renderRateCard = (rate: CurrencyRate) => (
    <RateCard 
      key={rate.id}
      title={`${rate.code} / VES`}
      subtitle={rate.name}
      value={`${rate.value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`}
      changePercent={rate.changePercent !== null ? `${Math.abs(rate.changePercent).toFixed(2)}%` : ''}
      isPositive={rate.changePercent !== null ? rate.changePercent >= 0 : true}
      iconName={rate.iconName || 'attach-money'}
      iconBgColor={rate.type === 'crypto' ? undefined : colors.infoContainer}
      iconColor={rate.type === 'crypto' ? undefined : colors.info}
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
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.background }]}>
        <UnifiedHeader
          variant="section"
          title="Tasas de Cambio"
          subtitle="Mercado en vivo • VES"
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {/* Filter Chips */}
        <FilterSection 
          options={[
            { label: 'Todas', value: 'all' },
            { label: 'Fiat', value: 'fiat' },
            { label: 'Cripto', value: 'crypto' },
          ]}
          selectedValue={filterType}
          onSelect={(value) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExchangeRateFilters({ type: value as any });
          }}
          visible={showFilters}
          mode="wrap"
          style={{ marginTop: theme.spacing.xs }}
        />

        {loading && !refreshing && filteredRates.length === 0 ? (
          <View style={styles.centerContainer}>
            <LottieView
              source={require('../assets/animations/splash.json')}
              autoPlay
              loop
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
            />
            <Text style={[styles.messageText, { color: theme.colors.onSurfaceVariant, marginTop: 0 }]}>Cargando tasas...</Text>
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
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>FIAT & CRYPTO</Text>
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
            
            {/* Section: Others */}
            {otherRates.length > 0 && (
                 <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>OTRAS</Text>
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
    paddingBottom: 16,
  },
  headerStyle: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
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
});

export default ExchangeRatesScreen;
