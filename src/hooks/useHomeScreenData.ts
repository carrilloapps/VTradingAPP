import { useState, useEffect, useCallback } from 'react';

import { CurrencyService, CurrencyRate } from '@/services/CurrencyService';
import { StocksService, StockData } from '@/services/StocksService';
import { useToastStore } from '@/stores/toastStore';
import { observabilityService } from '@/services/ObservabilityService';
import { analyticsService } from '@/services/firebase/AnalyticsService';
import { AppConfig } from '@/constants/AppConfig';
import { ExchangeCardProps } from '@/components/dashboard/ExchangeCard';

// Utility for path calculation - Moved outside for performance
const getPath = (percent: number | null | undefined) => {
  if (percent === null || percent === undefined || Math.abs(percent) < 0.001)
    return 'M0 20 L 100 20';
  const center = 20;
  const amplitude = 3 + 15 * Math.min(Math.abs(percent) * 200, 1.0);
  return percent > 0
    ? `M0 ${center + amplitude} C 40 ${center + amplitude}, 60 ${center - amplitude}, 100 ${center - amplitude}`
    : `M0 ${center - amplitude} C 40 ${center - amplitude}, 60 ${center + amplitude}, 100 ${center + amplitude}`;
};

export const useHomeScreenData = () => {
  const showToast = useToastStore(state => state.showToast);

  // Granular loading state
  const [loadingState, setLoadingState] = useState({
    isLoadingRates: true,
    isLoadingStocks: true,
    refreshing: false,
  });

  // Unified data state
  const [dataState, setDataState] = useState({
    rates: [] as CurrencyRate[],
    featuredRates: [] as ExchangeCardProps[],
    spread: null as number | null,
    stocks: [] as StockData[],
    isMarketOpen: false,
    lastRefreshTime: null as Date | null,
  });

  const calculateSpread = useCallback((data: CurrencyRate[]): number | null => {
    // Try to get spread from API first (USD from BCV should have it)
    const usdRate = data.find(r => r.code === 'USD' && r.type === 'fiat' && r.source === 'BCV');
    if (usdRate?.spreadPercentage !== undefined) {
      return usdRate.spreadPercentage;
    }

    // Fallback: Calculate manually if not provided by API
    const usdRates = data.filter(r => (r.code === 'USD' || r.code === 'USDT') && r.value > 0);

    if (usdRates.length >= 2) {
      const values = usdRates.map(r => r.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (min > 0) {
        return ((max - min) / min) * 100;
      }
    }
    return null;
  }, []);

  const processFeaturedRates = useCallback((data: CurrencyRate[]) => {
    const homeRates = data.filter(r => r.code === 'USD' || r.code === 'USDT');

    const getDescriptiveSubtitle = (r: CurrencyRate) => {
      if (r.type === 'fiat') return 'Banco Central de Venezuela';
      if (r.type === 'crypto') return 'Cripto • P2P';
      if (r.type === 'border') return 'Frontera • P2P';
      return r.name;
    };

    return homeRates.map(rate => {
      let displayValue = '0,00';
      if (rate.value && !isNaN(Number(rate.value))) {
        displayValue = Number(rate.value).toLocaleString(AppConfig.DEFAULT_LOCALE, {
          minimumFractionDigits: AppConfig.DECIMAL_PLACES,
          maximumFractionDigits: AppConfig.DECIMAL_PLACES,
        });
      }

      return {
        title: rate.name,
        code: rate.code,
        subtitle: getDescriptiveSubtitle(rate),
        value: displayValue,
        currency: 'Bs',
        changePercent: rate.changePercent !== null ? `${rate.changePercent.toFixed(2)}%` : '0.00%',
        isPositive: rate.changePercent !== null ? rate.changePercent >= 0 : true,
        chartPath: getPath(rate.changePercent),
        buyValue: rate.buyValue
          ? Number(rate.buyValue).toLocaleString(AppConfig.DEFAULT_LOCALE, {
              minimumFractionDigits: 2,
            })
          : undefined,
        sellValue: rate.sellValue
          ? Number(rate.sellValue).toLocaleString(AppConfig.DEFAULT_LOCALE, {
              minimumFractionDigits: 2,
            })
          : undefined,
      } as ExchangeCardProps;
    });
  }, []);

  const loadData = useCallback(
    async (isManualRefresh = false) => {
      setLoadingState({
        isLoadingRates: !isManualRefresh,
        isLoadingStocks: !isManualRefresh,
        refreshing: isManualRefresh,
      });

      try {
        const [ratesResult, stocksResult] = await Promise.allSettled([
          CurrencyService.getRates(isManualRefresh),
          StocksService.getStocks(isManualRefresh),
        ]);

        // Prepare updates
        const updates: Partial<typeof dataState> = {
          lastRefreshTime: new Date(),
        };

        let ratesSuccess = false;
        let stocksSuccess = false;

        // Handle Rates
        if (ratesResult.status === 'fulfilled') {
          updates.rates = ratesResult.value;
          updates.featuredRates = processFeaturedRates(ratesResult.value);
          updates.spread = calculateSpread(ratesResult.value);
          ratesSuccess = true;
        } else {
          observabilityService.captureError(ratesResult.reason, {
            context: 'useHomeScreenData.loadData.rates',
            isManualRefresh,
          });
        }

        // Handle Stocks
        if (stocksResult.status === 'fulfilled') {
          updates.stocks = stocksResult.value.slice(0, 3);
          updates.isMarketOpen = StocksService.isMarketOpen();
          stocksSuccess = true;
        } else {
          observabilityService.captureError(stocksResult.reason, {
            context: 'useHomeScreenData.loadData.stocks',
            isManualRefresh,
          });
        }

        // Batch update data
        setDataState(prev => ({ ...prev, ...updates }));

        if (isManualRefresh) {
          if (ratesSuccess && stocksSuccess) {
            showToast('Datos actualizados', 'success');
            await analyticsService.logDataRefresh('dashboard', true);
          } else if (!ratesSuccess && !stocksSuccess) {
            showToast('Error al actualizar datos', 'error');
          } else {
            showToast('Actualización parcial', 'warning');
          }
        }
      } catch (e) {
        observabilityService.captureError(e, {
          context: 'useHomeScreenData.loadData',
          isManualRefresh,
        });
        if (isManualRefresh) showToast('Error inesperado', 'error');
      } finally {
        setLoadingState({
          isLoadingRates: false,
          isLoadingStocks: false,
          refreshing: false,
        });
      }
    },
    [calculateSpread, showToast, processFeaturedRates],
  );

  useEffect(() => {
    const unsubscribeRates = CurrencyService.subscribe(data => {
      setDataState(prev => ({
        ...prev,
        rates: data,
        featuredRates: processFeaturedRates(data),
        spread: calculateSpread(data),
        lastRefreshTime: new Date(),
      }));
    });

    const unsubscribeStocks = StocksService.subscribe(data => {
      setDataState(prev => ({
        ...prev,
        stocks: data.slice(0, 3),
        isMarketOpen: StocksService.isMarketOpen(),
      }));
    });

    loadData();

    return () => {
      unsubscribeRates();
      unsubscribeStocks();
    };
  }, [calculateSpread, loadData, processFeaturedRates]);

  return {
    loading: loadingState.isLoadingRates || loadingState.isLoadingStocks, // Backward compatibility or global loading
    isLoadingRates: loadingState.isLoadingRates,
    isLoadingStocks: loadingState.isLoadingStocks,
    refreshing: loadingState.refreshing,
    rates: dataState.rates,
    featuredRates: dataState.featuredRates,
    spread: dataState.spread,
    stocks: dataState.stocks,
    isMarketOpen: dataState.isMarketOpen,
    lastUpdated: dataState.lastRefreshTime
      ? dataState.lastRefreshTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : dataState.rates.length > 0
        ? new Date(dataState.rates[0].lastUpdated).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '--:--',
    onRefresh: () => loadData(true),
  };
};
