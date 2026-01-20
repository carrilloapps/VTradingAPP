import React from 'react';
import { WidgetInfo, WidgetTaskHandlerProps } from 'react-native-android-widget';
import { storageService } from '../services/StorageService';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import VTradingWidget from './VTradingWidget';
import { WidgetItem } from './types';

export async function buildWidgetElement(info?: WidgetInfo, forceRefresh = false) {
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

  try {
      // 1. Get Widget Configuration
      const config = await storageService.getWidgetConfig();
      if (config) finalConfig = config;
      const refreshInterval = parseInt(finalConfig.refreshInterval || '4', 10);
      const refreshMeta = await storageService.getWidgetRefreshMeta();
      const lastRefreshAt = refreshMeta?.lastRefreshAt ?? 0;
      const shouldRefresh = forceRefresh || !lastRefreshAt || (Date.now() - lastRefreshAt) >= refreshInterval * 60 * 60 * 1000;

      // 2. Fetch Latest Rates
      try {
        if (shouldRefresh) {
          rates = await CurrencyService.getRates(true);
          didFetchFresh = true;
        } else {
          rates = await CurrencyService.getRates(false);
        }
      } catch (error) {
        console.error('Widget: Failed to fetch rates', error);
        rates = await CurrencyService.getRates(false);
      }

      if (lastRefreshAt) {
        lastUpdatedLabel = new Date(lastRefreshAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
      } else if (rates.length > 0 && rates[0].lastUpdated) {
        lastUpdatedLabel = new Date(rates[0].lastUpdated).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
      }
  } catch (e) {
      console.error('Widget: Service Error', e);
  }
  if (didFetchFresh && rates.length > 0) {
    await storageService.saveWidgetRefreshMeta({ lastRefreshAt: Date.now() });
  }

  // 3. Filter and Map Data
  // If services failed completely, use dummy data to prove render
  const widgetItems: WidgetItem[] = [];

  const formatCurrency = (val: number) => {
    return val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatTrendValue = (val: number | null) => {
      if (val === null || val === undefined) return '0%';
      return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  if (rates.length > 0) {
      const selectedIds = finalConfig.selectedCurrencyIds?.length > 0 
        ? finalConfig.selectedCurrencyIds 
        : ['usd_bcv', 'usd_monitor', 'usdt', 'eur_bcv'];

      for (const id of selectedIds) {
          const rate = rates.find(r => r.id === id || r.code === id);
          if (rate) {
              const isUp = (rate.changePercent || 0) > 0;
              const isDown = (rate.changePercent || 0) < 0;
              
              widgetItems.push({
                  id: rate.id,
                  label: rate.name,
                  value: formatCurrency(rate.value),
                  currency: 'Bs',
                  trend: isUp ? 'up' : isDown ? 'down' : 'neutral',
                  trendValue: formatTrendValue(rate.changePercent || 0),
                  trendBg: isUp ? 'rgba(0, 168, 107, 0.15)' : isDown ? 'rgba(255, 59, 48, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                  trendColor: isUp ? '#00A86B' : isDown ? '#FF3B30' : '#64748B'
              });
          }
      }

      // Fill if empty
      if (widgetItems.length === 0) {
          const defaultRates = rates.slice(0, 4);
          defaultRates.forEach(rate => {
              const isUp = (rate.changePercent || 0) > 0;
              const isDown = (rate.changePercent || 0) < 0;
              widgetItems.push({
                  id: rate.id,
                  label: rate.name,
                  value: formatCurrency(rate.value),
                  currency: 'Bs',
                  trend: isUp ? 'up' : isDown ? 'down' : 'neutral',
                  trendValue: formatTrendValue(rate.changePercent || 0),
                  trendBg: isUp ? 'rgba(0, 168, 107, 0.15)' : isDown ? 'rgba(255, 59, 48, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                  trendColor: isUp ? '#00A86B' : isDown ? '#FF3B30' : '#64748B'
              });
          });
      }
  } else {
      // Emergency Mock Data if Rate Fetch Fails
       widgetItems.push(
        { id: '1', label: 'Dolar BCV', value: '36.50', currency: 'Bs', trend: 'up', trendValue: '+0.10%', trendBg: 'rgba(0, 168, 107, 0.15)', trendColor: '#00A86B' },
        { id: '2', label: 'Paralelo', value: '38.20', currency: 'Bs', trend: 'down', trendValue: '-0.50%', trendBg: 'rgba(255, 59, 48, 0.15)', trendColor: '#FF3B30' }
       );
  }

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
      width={info?.width}
      height={info?.height}
    />
  );
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, clickAction } = props;
  
  try {
    console.log(`[WidgetTask] Updating widget ${widgetInfo.widgetId} (${widgetInfo.width}x${widgetInfo.height})`);

    if (widgetAction === 'WIDGET_DELETED') {
      await storageService.saveWidgetRefreshMeta({ lastRefreshAt: 0 });
      return;
    }

    if (widgetAction === 'WIDGET_CLICK' && clickAction === 'REFRESH_WIDGET') {
      const element = await buildWidgetElement(widgetInfo, true);
      await props.renderWidget(element);
      return;
    }

    const element = await buildWidgetElement(widgetInfo, false);
    await props.renderWidget(element);
  } catch (error) {
    console.error('WidgetTaskHandler Error:', error);
  }
}
