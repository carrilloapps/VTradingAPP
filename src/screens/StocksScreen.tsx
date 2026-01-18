import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import MarketStatus from '../components/stocks/MarketStatus';
import IndexHero from '../components/stocks/IndexHero';
import StockItem, { StockData } from '../components/stocks/StockItem';
import SearchBar from '../components/ui/SearchBar';
import FilterSection from '../components/ui/FilterSection';
import { useFilters } from '../context/FilterContext';

// Mock Data based on the HTML template
const MOCK_STOCKS: StockData[] = [
  { id: '1', symbol: 'BNC', name: 'Banco Nal. de Crédito', price: 0.0035, changePercent: 2.10, initials: 'BNC', color: 'emerald' },
  { id: '2', symbol: 'MVZ.A', name: 'Mercantil Serv. Fin.', price: 145.50, changePercent: -0.50, initials: 'MVZ', color: 'blue' },
  { id: '3', symbol: 'TDV.D', name: 'CANTV Clase D', price: 3.20, changePercent: 0.00, initials: 'CTV', color: 'orange' },
  { id: '4', symbol: 'RST', name: 'Ron Santa Teresa', price: 4.85, changePercent: 0.80, initials: 'RST', color: 'amber' },
  { id: '5', symbol: 'FVI.B', name: 'Fdo. Valores Inm.', price: 12.00, changePercent: 5.40, initials: 'FVI', color: 'indigo' },
];

const FILTERS = ['Todos', 'Banca', 'Industria', 'Servicios', 'Seguros'];

const StocksScreen = () => {
  const theme = useTheme();
  const { stockFilters, setStockFilters } = useFilters();
  const { query: searchQuery, category: activeFilter } = stockFilters;

  // Filter Logic
  const filteredStocks = useMemo(() => {
    return MOCK_STOCKS.filter(stock => {
      const matchesSearch = stock.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            stock.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      // For now, filter category is mocked since data doesn't have category field
      // In real app, we would check stock.category === activeFilter
      const matchesCategory = activeFilter === 'Todos' || true; 
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeFilter]);

  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const lower = searchQuery.toLowerCase();
    return MOCK_STOCKS
      .filter(s => s.name.toLowerCase().includes(lower) || s.symbol.toLowerCase().includes(lower))
      .slice(0, 3)
      .map(s => s.symbol);
  }, [searchQuery]);

  const handleSearch = (text: string) => setStockFilters({ query: text });
  const handleSuggestionPress = (suggestion: string) => setStockFilters({ query: suggestion });

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
          onActionPress={() => {}} // Optional action
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

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Market Status */}
        <MarketStatus isOpen={true} time="10:30 AM" />

        {/* Index Hero */}
        <IndexHero 
          value="55.230,12"
          changePercent="1,2%"
          isPositive={true}
          volume="12.5M"
          opening="54.575,20"
        />

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

        {/* Stock List */}
        <View style={styles.listContainer}>
          {filteredStocks.map((stock) => (
            <StockItem key={stock.id} {...stock} />
          ))}
        </View>

      </ScrollView>
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
  listContainer: {
    paddingHorizontal: 20,
  },
  headerContainer: {
    paddingBottom: 16,
  },
  headerStyle: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});

export default StocksScreen;
