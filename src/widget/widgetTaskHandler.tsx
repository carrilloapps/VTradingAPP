import React from 'react';
import {
  WidgetInfo,
  WidgetTaskHandlerProps,
} from 'react-native-android-widget';

import VTradingWidget from './VTradingWidget';
import { WidgetItem } from './types';
import { observabilityService } from '@/services/ObservabilityService';
import { getTrend } from '@/utils/trendUtils';
import {
  analyticsService,
  ANALYTICS_EVENTS,
} from '@/services/firebase/AnalyticsService';
import SafeLogger from '@/utils/safeLogger';
import { storageService } from '@/services/StorageService';
import { CurrencyService, CurrencyRate } from '@/services/CurrencyService';

export async function buildWidgetElement(
  info?: WidgetInfo,
  forceRefresh = false,
) {
  SafeLogger.log('[Widget] buildWidgetElement called', {
    hasInfo: !!info,
    forceRefresh,
    widgetId: info?.widgetId,
  });

  // MOCK DATA Fallback to prevent white screen if Services fail in Headless mode
  let finalConfig: any = {
    title: 'VTrading',
    selectedCurrencyIds: [],
    isWallpaperDark: true,
    isTransparent: false,
    showGraph: true,
    isWidgetDarkMode: true,
  };

  let rates: CurrencyRate[] = [];
  let didFetchFresh = false;
  let lastUpdatedLabel: string | undefined;
  let lastRefreshAt = 0;

  try {
    // 1. Get Widget Configuration
    const config = await storageService.getWidgetConfig();
    if (config) finalConfig = config;
    const refreshInterval = parseInt(finalConfig.refreshInterval || '4', 10);
    const refreshMeta = await storageService.getWidgetRefreshMeta();
    lastRefreshAt = refreshMeta?.lastRefreshAt ?? 0;
    const shouldRefresh =
      forceRefresh ||
      !lastRefreshAt ||
      Date.now() - lastRefreshAt >= refreshInterval * 60 * 60 * 1000;

    // 2. Fetch Latest Rates
    try {
      if (shouldRefresh) {
        rates = await CurrencyService.getRates(true);
        didFetchFresh = true;
      } else {
        rates = await CurrencyService.getRates(false);
      }
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'widgetTaskHandler.fetchRates',
        action: 'widget_fetch_rates',
        isForceRefresh: didFetchFresh,
      });
      rates = await CurrencyService.getRates(false);
    }

    if (lastRefreshAt) {
      lastUpdatedLabel = new Date(lastRefreshAt).toLocaleTimeString('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (rates.length > 0 && rates[0].lastUpdated) {
      lastUpdatedLabel = new Date(rates[0].lastUpdated).toLocaleTimeString(
        'es-VE',
        { hour: '2-digit', minute: '2-digit' },
      );
    }
  } catch (e) {
    observabilityService.captureError(e, {
      context: 'widgetTaskHandler.processLastUpdated',
      action: 'widget_process_metadata',
      hasLastRefreshAt: !!lastRefreshAt,
      ratesCount: rates.length,
    });
    // Service Error
  }
  if (didFetchFresh && rates.length > 0) {
    await storageService.saveWidgetRefreshMeta({ lastRefreshAt: Date.now() });
  }

  // 3. Filter and Map Data
  // If services failed completely, use dummy data to prove render
  const widgetItems: WidgetItem[] = [];

  const formatCurrency = (val: number): string => {
    try {
      return val.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch (e) {
      // Fallback to manual formatting if locale not supported
      SafeLogger.warn('[Widget] toLocaleString failed, using fallback');
      observabilityService.captureError(e, {
        context: 'widgetTaskHandler.formatCurrency',
        value: val,
      });
      return val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  };

  const formatTrendValue = (val: number | null) => {
    if (val === null || val === undefined) return '0%';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  if (rates.length > 0) {
    const selectedIds =
      finalConfig.selectedCurrencyIds?.length > 0
        ? finalConfig.selectedCurrencyIds
        : ['usd_bcv', 'usd_monitor', 'usdt', 'eur_bcv'];

    for (const id of selectedIds) {
      const rate = rates.find(r => r.id === id || r.code === id);
      // Only add rates that are not the base currency (value !== 1)
      if (rate && rate.value !== 1) {
        const change = Number((rate.changePercent || 0).toFixed(2));
        const trend = getTrend(change);

        widgetItems.push({
          id: rate.id,
          label: rate.name,
          value: formatCurrency(rate.value),
          currency: 'Bs',
          trend: trend,
          trendValue: formatTrendValue(rate.changePercent || 0),
          trendBg:
            trend === 'up'
              ? 'rgba(110, 231, 183, 0.15)'
              : trend === 'down'
                ? 'rgba(248, 113, 113, 0.15)'
                : 'rgba(255, 255, 255, 0.1)',
          trendColor:
            trend === 'up'
              ? '#6EE7B7'
              : trend === 'down'
                ? '#F87171'
                : '#D1D5DB',
        });
      }
    }

    // Fill if empty
    if (widgetItems.length === 0) {
      const defaultFilter = rates.filter(r => r.value !== 1).slice(0, 4);
      defaultFilter.forEach(rate => {
        const change = Number((rate.changePercent || 0).toFixed(2));
        const trend = getTrend(change);

        widgetItems.push({
          id: rate.id,
          label: rate.name,
          value: formatCurrency(rate.value),
          currency: 'Bs',
          trend: trend,
          trendValue: formatTrendValue(rate.changePercent || 0),
          trendBg:
            trend === 'up'
              ? 'rgba(110, 231, 183, 0.15)'
              : trend === 'down'
                ? 'rgba(248, 113, 113, 0.15)'
                : 'rgba(255, 255, 255, 0.1)',
          trendColor:
            trend === 'up'
              ? '#6EE7B7'
              : trend === 'down'
                ? '#F87171'
                : '#D1D5DB',
        });
      });
    }
  } else {
    // Emergency Mock Data if Rate Fetch Fails
    widgetItems.push(
      {
        id: '1',
        label: 'USD/VES',
        value: '0.00',
        currency: 'Bs',
        trend: 'up',
        trendValue: '0.00%',
        trendBg: 'rgba(110, 231, 183, 0.15)',
        trendColor: '#6EE7B7',
      },
      {
        id: '2',
        label: 'USDT/VES',
        value: '0.00',
        currency: 'Bs',
        trend: 'down',
        trendValue: '0.00%',
        trendBg: 'rgba(248, 113, 113, 0.15)',
        trendColor: '#F87171',
      },
    );
  }

  console.log('[Widget] Final widget data:', {
    itemsCount: widgetItems.length,
    title: finalConfig.title,
    hasRates: rates.length > 0,
    didFetchFresh,
    showGraph: finalConfig.showGraph,
  });

  // Directly invoke the component function to return the View tree
  // This avoids "jsxTree.type is not a function" errors in some Headless JS environments
  // where custom component resolution might fail in the widget renderer.
  return (
    <VTradingWidget
      items={widgetItems}
      widgetTitle={finalConfig.title}
      isTransparent={finalConfig.isTransparent}
      isWidgetDarkMode={finalConfig.isWidgetDarkMode}
      isWallpaperDark={finalConfig.isWallpaperDark}
      showGraph={finalConfig.showGraph}
      lastUpdated={lastUpdatedLabel}
    />
  );
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, clickAction } = props;

  try {
    SafeLogger.log('[Widget] widgetTaskHandler called', {
      widgetAction,
      clickAction,
    });

    if (widgetAction === 'WIDGET_ADDED') {
      SafeLogger.log('[Widget] Widget added, initializing refresh metadata');
      await storageService.saveWidgetRefreshMeta({ lastRefreshAt: Date.now() });
      await analyticsService.logEvent(ANALYTICS_EVENTS.WIDGET_ADDED, {
        widgetId: widgetInfo?.widgetId,
      });
      await analyticsService.setUserProperty('has_widget', 'true');
    }

    if (widgetAction === 'WIDGET_DELETED') {
      SafeLogger.log('[Widget] Widget deleted, clearing metadata');
      await storageService.saveWidgetRefreshMeta({ lastRefreshAt: 0 });
      await analyticsService.logEvent(ANALYTICS_EVENTS.WIDGET_DELETED, {
        widgetId: widgetInfo?.widgetId,
      });
      await analyticsService.setUserProperty('has_widget', 'false');
      return;
    }

    if (widgetAction === 'WIDGET_CLICK' && clickAction === 'REFRESH_WIDGET') {
      SafeLogger.log('[Widget] Manual refresh triggered');
      await analyticsService.logEvent(ANALYTICS_EVENTS.WIDGET_REFRESH, {
        widgetId: widgetInfo?.widgetId,
      });
      // Updating widget
      const element = await buildWidgetElement(widgetInfo, true);
      await props.renderWidget(element);
      return;
    }

    const element = await buildWidgetElement(widgetInfo, false);
    await props.renderWidget(element);
  } catch (e) {
    observabilityService.captureError(e, {
      context: 'widgetTaskHandler.main',
      widgetAction: widgetAction,
      widgetFamily: widgetInfo.widgetName,
    });
    await analyticsService.logError('widget', { action: widgetAction });
    // WidgetTaskHandler Error
  }
}
