import React, { useState, useMemo, useEffect, useCallback, useDeferredValue } from 'react';
import { View, StyleSheet, StatusBar, RefreshControl, ActivityIndicator, AccessibilityInfo } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text, useTheme } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import UnifiedHeader from '../components/ui/UnifiedHeader';
import MarketStatus from '../components/ui/MarketStatus';
import IndexHero from '../components/stocks/IndexHero';
import StockItem from '../components/stocks/StockItem';
import SearchBar from '../components/ui/SearchBar';
import FilterSection from '../components/ui/FilterSection';
import { useFilterStore } from '../stores/filterStore';
import { StocksService, StockData } from '../services/StocksService';
import { useToastStore } from '../stores/toastStore';
import StocksSkeleton from '../components/stocks/StocksSkeleton';
import ErrorState from '../components/ui/ErrorState';
import { observabilityService } from '../services/ObservabilityService';
import { analyticsService, ANALYTICS_EVENTS } from '../services/firebase/AnalyticsService';
import { useAuthStore } from '../stores/authStore';
import CustomDialog from '../components/ui/CustomDialog';
import CustomButton from '../components/ui/CustomButton';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import MarketShareGraphic from '../components/stocks/MarketShareGraphic';

interface MarketIndexData {
  value: string;
  changePercent: string;
  isPositive: boolean;
  volume: string;
  stats?: {
    titlesUp: number;
    titlesDown: number;
    titlesUnchanged: number;
    totalVolume: number;
    totalAmount: number;
  };
  statusState?: string;
  updateDate?: string;
}

const FlashListTyped = FlashList as React.ComponentType<any>;

type StocksScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const StocksScreen = ({ navigation }: StocksScreenProps) => {
  const theme = useTheme();
  const { stockFilters, setStockFilters } = useFilterStore();
  const { query: searchQuery, category: activeFilter } = stockFilters;
  const deferredQuery = useDeferredValue(searchQuery);
  const showToast = useToastStore((state) => state.showToast);
  const isFocused = useIsFocused();

  // Zustand store selector
  const user = useAuthStore((state) => state.user);

  const [stocks, setStocks] = useState<StockData[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [indexData, setIndexData] = useState<MarketIndexData | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  const [isShareDialogVisible, setShareDialogVisible] = useState(false);
  const [shareFormat, setShareFormat] = useState<'1:1' | '16:9'>('1:1');
  const [, setSharing] = useState(false);
  const viewShotRef = React.useRef<any>(null);

  const isPremium = !!(user && !user.isAnonymous);

  useEffect(() => {
    if (isFocused) {
      analyticsService.logScreenView('Stocks');
    }
  }, [isFocused]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      await StocksService.getStocks();
      const idx = await StocksService.getMarketIndex();
      setIndexData(idx);
      setIsMarketOpen(StocksService.isMarketOpen());
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'StocksScreen.loadData',
        action: 'load_market_data'
      });
      await analyticsService.logError('stocks_load_data');
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = StocksService.subscribe((data) => {
      setStocks(data);
      if (data.length > 0) setError(false);

      // Extract unique categories from data
      const uniqueCats = Array.from(new Set(data.map(s => s.category))).filter(Boolean).sort();
      setCategories(['Todos', ...uniqueCats]);

      setIsMarketOpen(StocksService.isMarketOpen());
      setLoading(false);
    });

    loadInitialData();

    return () => unsubscribe();
  }, [loadInitialData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(false);
    try {
      await StocksService.getStocks(true);
      const idx = await StocksService.getMarketIndex();
      setIndexData(idx);
      setIsMarketOpen(StocksService.isMarketOpen());
      showToast('Mercado actualizado', 'success');
      // Accessibility announcement for refresh completion
      AccessibilityInfo.announceForAccessibility('Mercado actualizado correctamente');
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'StocksScreen.onRefresh',
        action: 'refresh_market_data'
      });
      await analyticsService.logError('stocks_refresh');
      showToast('Error actualizando mercado', 'error');
      AccessibilityInfo.announceForAccessibility('Error al actualizar el mercado');
    } finally {
      setRefreshing(false);
    }
  }, [showToast]);

  const handleLoadMore = async () => {
    if (loadingMore || !StocksService.hasMorePages()) return;
    setLoadingMore(true);
    await StocksService.loadMore();
    setLoadingMore(false);
  };

  // Filter Logic - deferred
  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      const matchesSearch = stock.name.toLowerCase().includes(deferredQuery.toLowerCase()) ||
        stock.symbol.toLowerCase().includes(deferredQuery.toLowerCase());

      const matchesCategory = activeFilter === 'Todos' || stock.category === activeFilter;

      return matchesSearch && matchesCategory;
    });
  }, [stocks, deferredQuery, activeFilter]);

  // Accessibility Announcement on Filter/Search - Placed AFTER filteredStocks definition
  useEffect(() => {
    if (isFocused && filteredStocks.length > 0) {
      const message = activeFilter === 'Todos' && !deferredQuery
        ? `Mostrando ${filteredStocks.length} acciones`
        : `Mostrando ${filteredStocks.length} resultados filtrados`;
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [filteredStocks.length, activeFilter, deferredQuery, isFocused]);

  const suggestions = useMemo(() => {
    if (!deferredQuery || deferredQuery.length < 2) return [];
    const lower = deferredQuery.toLowerCase();
    return stocks
      .filter(s => s.name.toLowerCase().includes(lower) || s.symbol.toLowerCase().includes(lower))
      .slice(0, 3)
      .map(s => s.symbol);
  }, [stocks, deferredQuery]);

  const handleSearch = (text: string) => setStockFilters({ query: text });
  const handleSuggestionPress = (suggestion: string) => setStockFilters({ query: suggestion });

  const handleStockPress = useCallback((stock: StockData) => {
    navigation.navigate('StockDetail', { stock });
  }, [navigation]);

  const renderStockItem = useCallback(({ item }: { item: StockData }) => (
    // Casting handleStockPress to any to avoid strict variance check between Service/Component interfaces
    <StockItem {...item} onPress={handleStockPress as any} />
  ), [handleStockPress]);

  const handleShare = () => {
    setShareDialogVisible(true);
  };

  // Debounced Search Analytics
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery.length > 2) {
        analyticsService.logEvent(ANALYTICS_EVENTS.SEARCH_STOCK, { query: searchQuery });
      }
    }, 1500); // 1.5s debounce to capture "finished" typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const generateShareImage = async (format: '1:1' | '16:9') => {
    setShareDialogVisible(false);
    setShareFormat(format);
    setSharing(true);

    // Wait for layout update
    showToast('Generando imagen para compartir...', 'info');
    await new Promise(resolve => setTimeout(() => resolve(null), 300));

    if (viewShotRef.current) {
      try {
        const uri = await captureRef(viewShotRef.current, {
          format: 'jpg',
          quality: 1.0,
          result: 'tmpfile',
          width: 1080,
          height: format === '1:1' ? 1080 : 1920,
        });

        if (!uri) throw new Error("Capture failed");

        const sharePath = uri.startsWith('file://') ? uri : `file://${uri}`;

        await Share.open({
          url: sharePath,
          type: 'image/jpeg',
          message: `Resumen del Mercado Bursátil - VTradingAPP`,
        });

        await analyticsService.logShare('market_summary', 'all', format === '1:1' ? 'image_square' : 'image_story');
      } catch (e) {
        if (e && (e as any).message !== 'User did not share' && (e as any).message !== 'CANCELLED') {
          observabilityService.captureError(e, {
            context: 'StocksScreen.generateShareImage',
            action: 'share_market_image',
            format: format
          });
          await analyticsService.logError('stocks_share_image', { format });
          showToast('No se pudo compartir la imagen', 'error');
        }
      } finally {
        setSharing(false);
      }
    }
  };

  const handleShareText = async () => {
    setShareDialogVisible(false);
    try {
      const message = `📊 *VTrading - Mercado de Valores*\n\n` +
        (indexData ? `📉 *Índice IBC:* ${indexData.value} (${indexData.changePercent})\n` : '') +
        (stocks.length > 0 ? `🚀 *Top Stock:* ${stocks[0].symbol} @ ${stocks[0].price.toFixed(2)} Bs\n` : '') +
        `🌐 vtrading.app`;

      await Share.open({ message });
      await analyticsService.logShare('market_summary', 'all', 'text');
    } catch (e) {
      if (e && (e as any).message !== 'User did not share' && (e as any).message !== 'CANCELLED') {
        observabilityService.captureError(e, {
          context: 'StocksScreen.handleShareText',
          action: 'share_market_text'
        });
        showToast('Error al compartir texto', 'error');
      }
    }
  };

  // MEMOIZED HEADER
  const HeaderComponent = useMemo(() => (
    <View style={styles.headerContainer}>
      {/* Market Status */}
      <MarketStatus
        isOpen={isMarketOpen}
        updatedAt={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        onRefresh={onRefresh}
        style={styles.marketStatus}
      />

      {/* Index Hero */}
      {indexData && (() => {
        const stats = indexData.stats;
        const hasValidStats = stats &&
          stats.titlesUp !== 0 &&
          stats.titlesDown !== 0 &&
          stats.titlesUnchanged !== 0;

        let labelOverride;
        let fallbackValue;
        let statsToPass;

        if (hasValidStats) {
          statsToPass = stats;
        } else {
          if (indexData.statusState && indexData.statusState !== 'ABIERTO') {
            labelOverride = 'ESTADO DEL MERCADO';
            fallbackValue = indexData.statusState;
          } else {
            labelOverride = 'FECHA';
            fallbackValue = indexData.updateDate;
          }
        }

        return (
          <IndexHero
            value={indexData.value}
            changePercent={indexData.changePercent}
            isPositive={indexData.isPositive}
            volume={indexData.volume}
            stats={statsToPass}
            labelOverride={labelOverride}
            fallbackValue={fallbackValue}
          />
        );
      })()}

      {/* Filters */}
      <FilterSection
        options={categories.map((f: string) => ({ label: f, value: f }))}
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
  ), [isMarketOpen, indexData, categories, activeFilter, theme.colors.onSurfaceVariant, onRefresh, setStockFilters]);

  // MEMOIZED FOOTER
  const FooterComponent = useMemo(() => {
    if (!loadingMore) return <View style={styles.footerSpacer} />;
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }, [loadingMore, theme.colors.primary]);

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

  if (error && stocks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <UnifiedHeader
          variant="section"
          title="Mercados"
          subtitle="Error de conexión"
        />
        <ErrorState
          message="No se pudieron cargar los datos del mercado. Por favor verifica tu conexión."
          onRetry={loadInitialData}
        />
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

      <View style={[styles.headerContainer, { backgroundColor: theme.colors.background }]}>
        <UnifiedHeader
          variant="section"
          title="Mercados"
          subtitle="Acciones • ETFs"
          onActionPress={onRefresh}
          rightActionIcon="refresh"
          showSecondaryAction
          onSecondaryActionPress={handleShare}
          secondaryActionIcon="share-variant"
          onNotificationPress={() => { }}
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

      <FlashListTyped
        data={filteredStocks}
        keyExtractor={(item: StockData) => item.id}
        renderItem={renderStockItem}
        estimatedItemSize={80}
        ListHeaderComponent={HeaderComponent}
        ListFooterComponent={FooterComponent}
        contentContainerStyle={styles.flashListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.elevation.level3}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="emoticon-sad-outline" size={48} color={theme.colors.onSurfaceVariant} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No se encontraron acciones para "{activeFilter}"
            </Text>
          </View>
        }
      />

      {/* Sharing Assets */}
      <MarketShareGraphic
        viewShotRef={viewShotRef}
        indexData={indexData || { value: '0.00', changePercent: '0.00%', isPositive: true, volume: '0.00' }}
        topStocks={stocks.slice(0, 6)}
        lastUpdated={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        isPremium={isPremium}
        aspectRatio={shareFormat}
      />

      <CustomDialog
        visible={isShareDialogVisible}
        onDismiss={() => setShareDialogVisible(false)}
        title="Compartir reporte"
        showCancel={false}
        confirmLabel="Cerrar"
        onConfirm={() => setShareDialogVisible(false)}
      >
        <Text variant="bodyMedium" style={styles.dialogDescription}>
          Selecciona el formato ideal para compartir el resumen del mercado
        </Text>

        <View style={styles.dialogButtonsContainer}>
          <CustomButton
            variant="primary"
            label="Imagen cuadrada"
            icon="view-grid-outline"
            onPress={() => generateShareImage('1:1')}
            fullWidth
          />
          <CustomButton
            variant="secondary"
            label="Imagen vertical"
            icon="cellphone"
            onPress={() => generateShareImage('16:9')}
            fullWidth
          />
          <CustomButton
            variant="outlined"
            label="Solo texto"
            icon="text-short"
            onPress={handleShareText}
            fullWidth
          />
        </View>
      </CustomDialog>
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
  footerSpacer: {
    height: 100,
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
  },
  marketStatus: {
    paddingTop: 8,
    paddingHorizontal: 0,
  },
  flashListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  emptyIcon: {
    opacity: 0.5,
    marginBottom: 16,
  },
  dialogDescription: {
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogButtonsContainer: {
    gap: 12,
  }
});

export default StocksScreen;
