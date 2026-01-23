import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, StatusBar, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import BankRateCard from '../components/dashboard/BankRateCard';
import BankRatesSkeleton from '../components/dashboard/BankRatesSkeleton';
import SearchBar from '../components/ui/SearchBar';
import FilterSection from '../components/ui/FilterSection';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import { useToast } from '../context/ToastContext';
import { AppTheme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';

const isFabricEnabled = !!(globalThis as any).nativeFabricUIManager;

if (Platform.OS === 'android' && !isFabricEnabled) {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const BankRatesScreen = () => {
  const theme = useTheme<AppTheme>();
  const navigation = useNavigation();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bankRates, setBankRates] = useState<CurrencyRate[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('az'); // relevance, buy_desc, sell_desc, az
  const [officialRate, setOfficialRate] = useState<CurrencyRate | null>(null);

  const fetchRates = useCallback(async (isRefresh = false, nextInfo = { page: 1 }) => {
      try {
          if (!isRefresh && nextInfo.page === 1) setLoading(true);
          if (!isRefresh && nextInfo.page > 1) setLoadingMore(true);

          // Fetch Bank Rates - Limit 20 for better infinite scroll experience
          const { rates, pagination } = await CurrencyService.getBankRates(nextInfo.page, 20);
          
          // Fetch Official BCV Rate (only on first load or refresh)
          if (isRefresh || nextInfo.page === 1) {
              try {
                  const allRates = await CurrencyService.getRates(isRefresh);
                  const bcv = allRates.find(r => r.code === 'USD' && (r.source === 'BCV' || r.name.includes('BCV')));
                  if (bcv) setOfficialRate(bcv);
              } catch (e) {
                  console.warn('Failed to fetch BCV rate', e);
              }

              setBankRates(rates);
          } else {
              setBankRates(prev => [...prev, ...rates]);
          }

          setPage(Number(pagination.page));
          setHasMore(Number(pagination.page) < Number(pagination.totalPages));
      } catch (err) {
          console.error(err);
          // Only show error toast if it's the first page or refresh
          if (isRefresh || nextInfo.page === 1) {
             showToast('Error de conexión', 'error');
          } else {
             showToast('Error al cargar más tasas', 'error');
          }
      } finally {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
      }
  }, [showToast]);

  useEffect(() => {
      fetchRates(false, { page: 1 });
  }, [fetchRates]);

  const onRefresh = useCallback(() => {
      setRefreshing(true);
      fetchRates(true, { page: 1 });
  }, [fetchRates]);

  const loadMore = useCallback(() => {
      if (!loading && !loadingMore && hasMore && searchQuery === '') {
          fetchRates(false, { page: page + 1 });
      }
  }, [loading, loadingMore, hasMore, page, fetchRates, searchQuery]);

  // Filter and Sort rates
  const filteredRates = useMemo(() => {
      let result = [...bankRates];

      // Filter by query
      if (searchQuery) {
          const query = searchQuery.toLowerCase();
          result = result.filter(rate => 
              rate.name.toLowerCase().includes(query) || 
              rate.code.toLowerCase().includes(query) ||
              (rate.source && rate.source.toLowerCase().includes(query))
          );
      }

      // Sort
      switch (sortType) {
          case 'price_desc': // Mayor precio (High Buy Price - Best for Selling)
              result.sort((a, b) => {
                  const valA = a.buyValue || a.value || 0;
                  const valB = b.buyValue || b.value || 0;
                  return valB - valA;
              });
              break;
          case 'price_asc': // Menor precio (Low Sell Price - Best for Buying)
              result.sort((a, b) => {
                  const valA = a.sellValue || a.value || Infinity;
                  const valB = b.sellValue || b.value || Infinity;
                  return valA - valB;
              });
              break;
          case 'az':
              result.sort((a, b) => a.name.localeCompare(b.name));
              break;
          default:
              // relevance/default order from API
              break;
      }

      return result;
  }, [bankRates, searchQuery, sortType]);

  // Find BCV rate if available (assuming it might be in the list or we mock it for the UI)
  const bcvRate = useMemo(() => {
      return officialRate || bankRates.find(r => r.name.includes('BCV') || r.source?.includes('BCV'));
  }, [bankRates, officialRate]);

  const renderItem = useCallback(({ item }: { item: CurrencyRate }) => {
    // Format values
    const formatValue = (val?: number) => val ? `${val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` : 'N/A';
    
    // Calculate percentage against BCV
    const calculatePercentage = (rateValue?: number) => {
        if (!rateValue || !bcvRate || !bcvRate.value) return undefined;
        return ((rateValue - bcvRate.value) / bcvRate.value) * 100;
    };

    const buyPercentage = calculatePercentage(item.buyValue || item.value);
    const sellPercentage = calculatePercentage(item.sellValue || item.value);

    // Parse source label from name if not available in source field
    let displaySource = item.source;
    if (!displaySource && item.name.includes('•')) {
        displaySource = item.name.split('•')[1].trim();
    }
    
    return (
        <BankRateCard
            bankName={displaySource || item.name}
            currencyCode={item.code}
            buyValue={formatValue(item.buyValue || item.value)} 
            sellValue={formatValue(item.sellValue || item.value)}
            lastUpdated={item.lastUpdated}
            buyPercentage={buyPercentage}
            sellPercentage={sellPercentage}
        />
    );
  }, [bcvRate]);

  const renderFooter = () => {
      if (!loadingMore) return null;
      return (
          <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}>Cargando más bancos...</Text>
          </View>
      );
  };

  const renderHeader = () => (
      <View style={styles.contentHeader}>
          {/* BCV Section */}
          <View style={styles.bcvSection}>
              <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>VALORES SEGÚN BCV</Text>
                  <View style={[styles.liveBadge, { backgroundColor: theme.colors.tertiaryContainer }]}>
                      <Text style={[styles.liveText, { color: theme.colors.onTertiaryContainer }]}>TIEMPO REAL</Text>
                  </View>
              </View>

              <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bcvCard}
              >
                  <View style={styles.bcvCardContent}>
                      <View style={styles.bcvHeader}>
                          <View style={[styles.bcvIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                              <MaterialIcons name="account-balance" size={24} color={theme.colors.onPrimary} />
                          </View>
                          <View>
                              <Text style={[styles.bcvTitle, { color: theme.colors.onPrimary }]}>Tasa General (BCV)</Text>
                              <View style={styles.bcvSubtitleRow}>
                                  <View style={[styles.statusDot, { backgroundColor: theme.colors.onPrimary }]} />
                                  <Text style={[styles.bcvSubtitle, { color: theme.colors.onPrimary }]}>
                                    {bcvRate?.lastUpdated 
                                        ? `A ${new Date(bcvRate.lastUpdated).toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                                        : 'ACTUALIZADO'}
                                  </Text>
                              </View>
                          </View>
                      </View>
                  </View>

                  <View style={styles.bcvBottomRow}>
                      <View style={styles.bcvPriceContainer}>
                          <Text style={[styles.bcvPrice, { color: theme.colors.onPrimary }]}>
                            {bcvRate 
                                ? bcvRate.value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                                : '--,--'}
                          </Text>
                          <Text style={[styles.bcvCurrency, { color: theme.colors.onPrimary }]}>Bs/$</Text>
                      </View>
                  </View>
                  
                  {/* Decorative huge icon */}
                  <View style={styles.decorativeIcon}>
                      <MaterialIcons name="account-balance" size={160} color={theme.colors.onPrimary} style={{ opacity: 0.1 }} />
                  </View>
              </LinearGradient>
          </View>

          <View style={styles.listHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>COTIZACIONES BANCARIAS</Text>
            <View style={{ 
                backgroundColor: theme.colors.primaryContainer,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 8,
            }}>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.onPrimaryContainer, fontSize: 12 }]}>VES / USD</Text>
            </View>
        </View>
        
        <FilterSection 
            options={[
              { label: 'A-Z', value: 'az', icon: 'sort' },
              { label: 'Menor precio', value: 'price_asc', icon: 'trending-down', color: theme.colors.trendDown }, // Green (Good/Up)
              { label: 'Mayor precio', value: 'price_desc', icon: 'trending-up', color: theme.colors.trendUp }, // Red (Bad/Down)
            ]}
            selectedValue={sortType}
            onSelect={(value) => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setSortType(value);
            }}
            visible={true}
            mode="scroll"
            style={{ 
              marginBottom: 16,
              marginTop: -8,
            }}
        />
      </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        backgroundColor="transparent"
        translucent
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
      />

      <UnifiedHeader
        variant="section"
        title="Mesas de Cambio"
        onBackPress={() => navigation.goBack()}
        onActionPress={onRefresh}
        rightActionIcon="refresh"
        showNotification={true}
        style={styles.header}
      />

      {/* Fixed Search Bar Area */}
      <View style={[styles.searchArea, { backgroundColor: theme.colors.background }]}>
          <SearchBar 
              placeholder="Buscar banco..." 
              value={searchQuery}
              onChangeText={setSearchQuery}
          />
      </View>

      {loading && !refreshing ? (
          <BankRatesSkeleton />
      ) : (
          <FlatList
            style={styles.list}
            data={filteredRates}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <View style={styles.centerContainer}>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>No hay tasas disponibles</Text>
                </View>
            }
          />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  header: {
      paddingHorizontal: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
  },
  searchArea: {
      paddingHorizontal: 20,
      marginTop: 8,
      paddingBottom: 8,
      zIndex: 1,
  },
  listContent: {
      padding: 20,
      paddingTop: 10,
      paddingBottom: 100,
  },
  contentHeader: {
      marginBottom: 10,
  },
  searchContainer: {
      marginBottom: 24,
  },
  bcvSection: {
      marginBottom: 28,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
      paddingHorizontal: 4,
  },
  sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
  },
  sectionSubtitle: {
      fontSize: 11,
      fontWeight: 'bold',
  },
  liveBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
  },
  liveText: {
      fontSize: 10,
      fontWeight: '800',
  },
  bcvCard: {
      borderRadius: 28,
      padding: 24,
      overflow: 'hidden',
      position: 'relative',
  },
  bcvCardContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 32,
      zIndex: 10,
  },
  bcvHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
  },
  bcvIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 16,
      // Background and border handled dynamically in component style prop
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
  },
  bcvTitle: {
      fontSize: 18,
      fontWeight: '800',
      // Color handled dynamically
      letterSpacing: -0.5,
  },
  bcvSubtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
  },
  statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      // Color handled dynamically
  },
  bcvSubtitle: {
      // Color handled dynamically
      fontSize: 11,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
  },
  bcvAvgBadge: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
  },
  bcvAvgText: {
      color: '#FFF',
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.5,
  },
  bcvBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      zIndex: 10,
  },
  bcvPriceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
  },
  bcvPrice: {
      fontSize: 60,
      fontWeight: '800',
      // Color handled dynamically
      letterSpacing: -2,
      lineHeight: 64,
  },
  bcvCurrency: {
      fontSize: 20,
      fontWeight: 'bold',
      // Color handled dynamically
  },
  decorativeIcon: {
      position: 'absolute',
      bottom: -24,
      right: -24,
      // Opacity and Color handled dynamically
      zIndex: 0,
  },
  listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
      paddingHorizontal: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  footerLoader: {
      flexDirection: 'row',
      paddingVertical: 20,
      justifyContent: 'center',
      alignItems: 'center',
  }
});

export default BankRatesScreen;
