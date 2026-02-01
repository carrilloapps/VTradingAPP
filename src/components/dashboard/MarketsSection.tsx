import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';

import StockItem from '@/components/stocks/StockItem';
import { StockData } from '@/services/StocksService';
import { AppConfig } from '@/constants/AppConfig';
import { analyticsService } from '@/services/firebase/AnalyticsService';

interface MarketsSectionProps {
  stocks: StockData[];
  navigation: any;
}

const MarketsSection: React.FC<MarketsSectionProps> = ({
  stocks,
  navigation,
}) => {
  const theme = useTheme();

  const renderItem = ({ item: stock }: { item: StockData }) => (
    <StockItem
      key={stock.id}
      {...stock}
      value={`${stock.price.toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`}
      change={`${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`}
      onPress={() => {
        analyticsService.logSelectContent('stock', stock.symbol);
        navigation.navigate('StockDetail', { stock });
      }}
    />
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text
          variant="headlineSmall"
          style={[styles.titleMedium, { color: theme.colors.onSurface }]}
        >
          Mercado Bursátil
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Markets')}
          accessibilityLabel="Ver todo el mercado bursátil"
          accessibilityRole="button"
        >
          <Text
            variant="labelLarge"
            style={[styles.seeAllText, { color: theme.colors.primary }]}
          >
            VER TODO
          </Text>
        </TouchableOpacity>
      </View>

      {stocks.length > 0 ? (
        <View style={styles.listContainer}>
          <FlashList
            data={stocks}
            renderItem={renderItem}
            scrollEnabled={false} // Since it's inside Home ScrollView
          />
        </View>
      ) : (
        <Text style={styles.emptyText}>
          No hay datos del mercado disponibles
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  titleMedium: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    opacity: 0.6,
  },
  seeAllText: {
    fontWeight: 'bold',
  },
  listContainer: {
    minHeight: 100,
  },
});

export default MarketsSection;
