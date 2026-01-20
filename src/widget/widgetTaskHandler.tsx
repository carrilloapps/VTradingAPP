import React from 'react';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { storageService } from '../services/StorageService';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import VTradingWidget from './VTradingWidget';
import { WidgetItem } from './types';

export async function buildWidgetElement() {
  // MOCK DATA Fallback to prevent white screen if Services fail in Headless mode
  let finalConfig: any = {
    title: 'V-Trading',
    selectedCurrencyIds: [],
    isWallpaperDark: true,
    isTransparent: false,
    showGraph: true,
    isWidgetDarkMode: true,
  };

  let rates: CurrencyRate[] = [];

  try {
      // 1. Get Widget Configuration
      const config = await storageService.getWidgetConfig();
      if (config) finalConfig = config;

      // 2. Fetch Latest Rates
      try {
        rates = await CurrencyService.getRates(true);
      } catch (error) {
        console.error('Widget: Failed to fetch rates', error);
        rates = await CurrencyService.getRates(false);
      }
  } catch (e) {
      console.error('Widget: Service Error', e);
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
  return VTradingWidget({
    items: widgetItems,
    widgetTitle: finalConfig.title,
    isTransparent: finalConfig.isTransparent,
    isWidgetDarkMode: finalConfig.isWidgetDarkMode,
    isWallpaperDark: finalConfig.isWallpaperDark,
    showGraph: finalConfig.showGraph,
    lastUpdated: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
  }) as React.ReactElement;
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  try {
    const widgetInfo = props.widgetInfo;
    const element = await buildWidgetElement();
    await props.renderWidget(element);
  } catch (error) {
    console.error('WidgetTaskHandler Error:', error);
  }
}
