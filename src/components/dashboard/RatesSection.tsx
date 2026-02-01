import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';

import ExchangeCard, { ExchangeCardProps } from '@/components/dashboard/ExchangeCard';
import { CurrencyRate } from '@/services/CurrencyService';
import { AppConfig } from '@/constants/AppConfig';
import { TetherIcon } from '@/components/ui/TetherIcon';
import { observabilityService } from '@/services/ObservabilityService';
import { analyticsService } from '@/services/firebase/AnalyticsService';

interface RatesSectionProps {
  rates: CurrencyRate[];
  navigation: any;
}

const RatesSection: React.FC<RatesSectionProps> = ({ rates, navigation }) => {
  const theme = useTheme();

  const getPath = (percent: number | null | undefined) => {
    if (percent === null || percent === undefined || Math.abs(percent) < 0.001)
      return 'M0 20 L 100 20';
    const scaleFactor = 200;
    const intensity = Math.min(Math.abs(percent) * scaleFactor, 1.0);
    const minAmp = 3;
    const maxAmp = 18;
    const amplitude = minAmp + (maxAmp - minAmp) * intensity;
    const center = 20;

    if (percent > 0) {
      const startY = center + amplitude;
      const endY = center - amplitude;
      return `M0 ${startY} C 40 ${startY}, 60 ${endY}, 100 ${endY}`;
    } else {
      const startY = center - amplitude;
      const endY = center + amplitude;
      return `M0 ${startY} C 40 ${startY}, 60 ${endY}, 100 ${endY}`;
    }
  };

  const featuredRates = useMemo(() => {
    const homeRates = rates.filter(r => r.code === 'USD' || r.code === 'USDT');

    return homeRates.map(rate => {
      let displayValue = '0,00';
      try {
        if (rate.value && !isNaN(Number(rate.value))) {
          displayValue = Number(rate.value).toLocaleString(AppConfig.DEFAULT_LOCALE, {
            minimumFractionDigits: AppConfig.DECIMAL_PLACES,
            maximumFractionDigits: AppConfig.DECIMAL_PLACES,
          });
        }
      } catch (e) {
        observabilityService.captureError(e, {
          context: 'RatesSection.formatValue',
          rateCode: rate.code,
        });
      }

      let displayBuyValue;
      let displaySellValue;

      if (rate.buyValue !== undefined && !isNaN(Number(rate.buyValue))) {
        displayBuyValue = Number(rate.buyValue).toLocaleString(AppConfig.DEFAULT_LOCALE, {
          minimumFractionDigits: AppConfig.DECIMAL_PLACES,
          maximumFractionDigits: AppConfig.DECIMAL_PLACES,
        });
      }

      if (rate.sellValue !== undefined && !isNaN(Number(rate.sellValue))) {
        displaySellValue = Number(rate.sellValue).toLocaleString(AppConfig.DEFAULT_LOCALE, {
          minimumFractionDigits: AppConfig.DECIMAL_PLACES,
          maximumFractionDigits: AppConfig.DECIMAL_PLACES,
        });
      }

      const iconBackground = theme.dark ? theme.colors.primary : theme.colors.inversePrimary;
      let customIcon;
      let iconName = rate.iconName;
      let iconColor;
      let iconTintColor;

      if (rate.code === 'USD') {
        iconName = 'currency-usd';
        iconColor = iconBackground;
        iconTintColor = '#212121';
      } else if (rate.code === 'USDT') {
        customIcon = <TetherIcon backgroundColor={iconBackground} contentColor="#212121" />;
      }

      const getDescriptiveSubtitle = (r: CurrencyRate) => {
        if (r.type === 'fiat') return 'Banco Central de Venezuela';
        if (r.type === 'crypto') return 'Cripto • P2P';
        if (r.type === 'border') return 'Frontera • P2P';
        return r.name;
      };

      return {
        title: rate.name,
        subtitle: getDescriptiveSubtitle(rate),
        value: displayValue,
        currency: 'Bs',
        changePercent: rate.changePercent !== null ? `${rate.changePercent.toFixed(2)}%` : '0.00%',
        isPositive: rate.changePercent !== null ? rate.changePercent >= 0 : true,
        chartPath: getPath(rate.changePercent),
        iconName: iconName,
        iconColor: iconColor,
        iconTintColor: iconTintColor,
        customIcon: customIcon,
        buyValue: displayBuyValue,
        sellValue: displaySellValue,
        buyChangePercent:
          rate.buyChangePercent !== undefined
            ? `${rate.buyChangePercent > 0 ? '+' : ''}${rate.buyChangePercent.toFixed(2)}%`
            : undefined,
        sellChangePercent:
          rate.sellChangePercent !== undefined
            ? `${rate.sellChangePercent > 0 ? '+' : ''}${rate.sellChangePercent.toFixed(2)}%`
            : undefined,
        buyChartPath: getPath(rate.buyChangePercent),
        sellChartPath: getPath(rate.sellChangePercent),
        onPress: () => {
          analyticsService.logSelectContent('currency', rate.code);
          navigation.navigate('CurrencyDetail', { rate });
        },
      } as ExchangeCardProps;
    });
  }, [rates, theme, navigation]);

  if (featuredRates.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.emptyText}>No hay tasas disponibles</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.listContainer}>
        <FlashList
          data={featuredRates}
          renderItem={({ item }) => <ExchangeCard {...item} />}
          scrollEnabled={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    opacity: 0.6,
  },
  listContainer: {
    minHeight: 180,
  },
});

export default RatesSection;
