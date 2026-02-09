import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/theme';
import type { HistoryDataPoint } from '@/services/RateHistoryService';

interface CurrencyHistoryChartProps {
  data: HistoryDataPoint[];
  loading?: boolean;
  error?: string | null;
  currencyCode: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
};

const CurrencyHistoryChart = ({
  data,
  loading = false,
  error = null,
  currencyCode,
}: CurrencyHistoryChartProps) => {
  const theme = useAppTheme();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((point, index) => ({
      value: point.price,
      label: index % Math.ceil(data.length / 5) === 0 ? formatDate(point.date) : '',
      dataPointText: point.price.toFixed(2),
    }));
  }, [data]);

  const getMinMaxValues = () => {
    if (!data || data.length === 0) {
      return { min: 0, max: 0 };
    }

    const values = data.map(point => point.price);
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Add 5% padding for better visualization
    const padding = (max - min) * 0.05;

    return {
      min: Math.max(0, min - padding),
      max: max + padding,
    };
  };

  const { min: minValue, max: maxValue } = getMinMaxValues();

  const isPositiveTrend = data && data.length >= 2 && data[data.length - 1].price > data[0].price;
  const trendColor = isPositiveTrend ? theme.colors.trendUp : theme.colors.trendDown;

  if (loading) {
    return (
      <Surface
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        elevation={0}
      >
        <MaterialCommunityIcons name="loading" size={48} color={theme.colors.outline} />
        <Text
          variant="bodyMedium"
          style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}
        >
          Cargando historial...
        </Text>
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        elevation={0}
      >
        <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error} />
        <Text variant="bodyMedium" style={[styles.placeholderText, { color: theme.colors.error }]}>
          {error}
        </Text>
      </Surface>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Surface
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        elevation={0}
      >
        <MaterialCommunityIcons name="chart-line-variant" size={48} color={theme.colors.outline} />
        <Text
          variant="bodyMedium"
          style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}
        >
          No hay datos históricos disponibles
        </Text>
      </Surface>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64; // Accounting for padding

  return (
    <Surface
      style={[
        styles.chartContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
      elevation={0}
    >
      <View style={styles.chartWrapper}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={200}
          color={trendColor}
          thickness={2}
          startFillColor={trendColor}
          endFillColor={theme.colors.surface}
          startOpacity={0.4}
          endOpacity={0.1}
          initialSpacing={10}
          endSpacing={10}
          spacing={chartWidth / Math.max(data.length - 1, 1)}
          noOfSections={4}
          yAxisColor={theme.colors.outlineVariant}
          xAxisColor={theme.colors.outlineVariant}
          yAxisTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
          hideDataPoints={data.length > 20}
          dataPointsColor={trendColor}
          dataPointsRadius={4}
          textColor={theme.colors.onSurfaceVariant}
          textFontSize={10}
          hideRules
          areaChart
          curved
          animateOnDataChange
          animationDuration={800}
          maxValue={maxValue}
          mostNegativeValue={minValue}
          showVerticalLines={false}
        />
      </View>
      <View style={styles.footer}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Últimos {data.length} días • {currencyCode}
        </Text>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 280,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 12,
    textAlign: 'center',
  },
  chartContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  chartWrapper: {
    marginLeft: -10,
    marginBottom: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
});

export default CurrencyHistoryChart;
