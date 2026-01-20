import React from 'react';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { storageService } from '../services/StorageService';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import VTradingWidget from './VTradingWidget';
import { WidgetItem } from './types';

export async function buildWidgetElement() {
  // 1. Get Widget Configuration
  const config = await storageService.getWidgetConfig();
  
  // Default Config if none exists
  const defaultConfig = {
    title: 'V-Trading',
    selectedCurrencyIds: ['usd_bcv', 'usd_paralelo', 'usdt_binance', 'eur_bcv'], // IDs might differ, need to match API
    isWallpaperDark: true,
    isTransparent: false,
    showGraph: true,
    isWidgetDarkMode: true,
  };

  const finalConfig = config || defaultConfig;

  // 2. Fetch Latest Rates
  let rates: CurrencyRate[] = [];
  try {
    rates = await CurrencyService.getRates(true);
  } catch (error) {
    console.error('Widget: Failed to fetch rates', error);
    // Try to get cached/current rates if fetch fails
    rates = await CurrencyService.getRates(false);
  }

  // 3. Filter and Map Data
  // We need to match selectedCurrencyIds with rate IDs
  // If no IDs selected, pick top 4 relevant ones
  const selectedIds = finalConfig.selectedCurrencyIds?.length > 0 
    ? finalConfig.selectedCurrencyIds 
    : ['usd_bcv', 'usd_monitor', 'usdt', 'eur_bcv']; // Example IDs, adjust based on actual data

  const widgetItems: WidgetItem[] = [];

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatTrendValue = (val: number | null) => {
      if (val === null || val === undefined) return '0%';
      return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  // Find rates matching selected IDs
  // Maintain order of selectedIds
  for (const id of selectedIds) {
      const rate = rates.find(r => r.id === id || r.code === id); // Robust matching
      if (rate) {
          const isUp = (rate.changePercent || 0) > 0;
          const isDown = (rate.changePercent || 0) < 0;
          
          widgetItems.push({
              id: rate.id,
              label: rate.name, // e.g. "Dólar BCV"
              value: formatCurrency(rate.value),
              currency: 'Bs', // Assuming target is VES/Bs for now
              trend: isUp ? 'up' : isDown ? 'down' : 'neutral',
              trendValue: formatTrendValue(rate.changePercent || 0),
              trendBg: isUp ? 'rgba(0, 168, 107, 0.15)' : isDown ? 'rgba(255, 59, 48, 0.15)' : 'rgba(100, 116, 139, 0.15)',
              trendColor: isUp ? '#00A86B' : isDown ? '#FF3B30' : '#64748B'
          });
      }
  }

  // If we still don't have enough items (e.g. fresh install, no config), fill with top rates
  if (widgetItems.length === 0 && rates.length > 0) {
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

  return (
    <VTradingWidget
      items={widgetItems}
      widgetTitle={finalConfig.title}
      isTransparent={finalConfig.isTransparent}
      isWidgetDarkMode={finalConfig.isWidgetDarkMode}
      isWallpaperDark={finalConfig.isWallpaperDark}
      showGraph={finalConfig.showGraph}
      lastUpdated={new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
    />
  );
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const element = await buildWidgetElement();
  props.renderWidget(element);
}
