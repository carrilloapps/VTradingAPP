import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, StatusBar, RefreshControl, FlatList, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import MarketStatus from '../components/ui/MarketStatus';
import IndexHero from '../components/stocks/IndexHero';
import StockItem from '../components/stocks/StockItem';
import SearchBar from '../components/ui/SearchBar';
import FilterSection from '../components/ui/FilterSection';
import { useFilters } from '../context/FilterContext';
import { StocksService, StockData } from '../services/StocksService';
import { useToast } from '../context/ToastContext';
import StocksSkeleton from '../components/stocks/StocksSkeleton';

const FILTERS = ['Todos', 'Banca', 'Industria', 'Servicios', 'Seguros'];

const StocksScreen = () => {
  const theme = useTheme();
  const { stockFilters, setStockFilters } = useFilters();
  const { query: searchQuery, category: activeFilter } = stockFilters;
  const { showToast } = useToast();

  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [indexData, setIndexData] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = StocksService.subscribe((data) => {
        setStocks(data);
        setIsMarketOpen(StocksService.isMarketOpen());
        setLoading(false);
    });

    const loadData = async () => {
        try {
            await StocksService.getStocks();
            const idx = await StocksService.getMarketIndex();
            setIndexData(idx);
            setIsMarketOpen(StocksService.isMarketOpen());
        } catch (error) {
            console.error(error);
            showToast('Error cargando datos del mercado', 'error');
            setLoading(false);
        }
    };

    loadData();

    return () => unsubscribe();
  }, [showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
        await StocksService.getStocks(true);
        const idx = await StocksService.getMarketIndex();
        setIndexData(idx);
        setIsMarketOpen(StocksService.isMarketOpen());
        showToast('Mercado actualizado', 'success');
    } catch (error) {
        showToast('Error actualizando mercado', 'error');
    } finally {
        setRefreshing(false);
    }
  }, [showToast]);

  const handleLoadMore = async () => {
      if (loadingMore) return;
      setLoadingMore(true);
      await StocksService.loadMore();
      setLoadingMore(false);
  };

  // Filter Logic
  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      const matchesSearch = stock.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            stock.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      // For now, filter category is mocked since data doesn't have category field
      // In real app, we would check stock.category === activeFilter
      const matchesCategory = activeFilter === 'Todos' || true; 
      
      return matchesSearch && matchesCategory;
    });
  }, [stocks, searchQuery, activeFilter]);

  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const lower = searchQuery.toLowerCase();
    return stocks
      .filter(s => s.name.toLowerCase().includes(lower) || s.symbol.toLowerCase().includes(lower))
      .slice(0, 3)
      .map(s => s.symbol);
  }, [stocks, searchQuery]);

  const handleSearch = (text: string) => setStockFilters({ query: text });
  const handleSuggestionPress = (suggestion: string) => setStockFilters({ query: suggestion });

  const renderHeader = () => (
      <View style={styles.headerContainer}>
        {/* Market Status */}
        <MarketStatus 
            isOpen={isMarketOpen} 
            updatedAt={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
            onRefresh={onRefresh}
            style={{ paddingTop: 8, paddingBottom: 8, paddingHorizontal: 5 }}
        />

        {/* Index Hero */}
        {indexData && (
            <IndexHero 
            value={indexData.value}
            changePercent={indexData.changePercent}
            isPositive={indexData.isPositive}
            volume={indexData.volume}
            opening={indexData.opening}
            />
        )}

        {/* Filters */}
        <FilterSection
          options={FILTERS.map(f => ({ label: f, value: f }))}
          selectedValue={activeFilter}
          onSelect={(value) => setStockFilters({ category: value })}
          mode="scroll"
        />

        {/* Stock List Header */}
        <View style={styles.listHeader}>
          <Text style={[styles.listHeaderTitle, { color: theme.colors.onSurfaceVariant }]}>EMPRESA / TICKER</Text>
          <Text style={[styles.listHeaderTitle, { color: theme.colors.onSurfaceVariant }]}>PRECIO & VARIACIÓN</Text>
        </View>
      </View>
  );

  const renderFooter = () => {
      if (!loadingMore) return <View style={{ height: 100 }} />;
      return (
          <View style={styles.loaderFooter}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
      );
  };

  if (loading && !refreshing && stocks.length === 0) {
      return (
          <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar 
                backgroundColor="transparent"
                translucent
                barStyle={theme.dark ? 'light-content' : 'dark-content'} 
            />
            <StocksSkeleton />
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
          title="Mercados"
          subtitle="Acciones y CEDEARs"
          onActionPress={onRefresh}
          rightActionIcon="refresh"
          onNotificationPress={() => {}}
          notificationCount={1}
          style={styles.headerStyle}
        />
        
        <View style={styles.searchContainer}>
          <SearchBar 
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Buscar empresa o ticker..."
            onFilterPress={undefined}
            suggestions={suggestions}
            onSuggestionPress={handleSuggestionPress}
          />
        </View>
      </View>

      <FlatList
        data={filteredStocks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StockItem {...item} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        windowSize={5}
        style={styles.content}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerContainer: {
    paddingBottom: 8,
  },
  headerStyle: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  scrollContent: {
    paddingBottom: 20, // Reduced as footer handles spacing
  },
  loaderFooter: {
      paddingVertical: 20,
      alignItems: 'center',
      marginBottom: 80
  }
});

export default StocksScreen;
