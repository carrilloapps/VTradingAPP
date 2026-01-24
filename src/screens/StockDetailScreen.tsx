import React from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import { Surface, Text, Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import { useAppTheme } from '../theme/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { BolivarIcon } from '../components/ui/BolivarIcon';

type StockDetailRouteProp = RouteProp<RootStackParamList, 'StockDetail'>;

const StockDetailScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute<StockDetailRouteProp>();
  const { stock } = route.params;

  const isPositive = stock.changePercent > 0;
  const isNegative = stock.changePercent < 0;
  
  const trendColor = isPositive 
    ? theme.colors.trendUp 
    : isNegative 
      ? theme.colors.trendDown 
      : theme.colors.neutral;

  const trendIcon = isPositive 
    ? 'trending-up' 
    : isNegative 
      ? 'trending-down' 
      : 'minus';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Revisa ${stock.name} (${stock.symbol}) en VTradingAPP! Precio: ${stock.price} Bs (${stock.changePercent}%)`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const averagePrice = (stock.volumeAmount && stock.volumeShares) 
    ? (stock.volumeAmount / stock.volumeShares) 
    : 0;
  
  const previousClose = stock.price - (stock.changeAmount || 0);
  
  const showOpening = stock.opening && stock.opening > 0;
  const primaryStatLabel = showOpening ? "Apertura" : "Precio promedio";
  const primaryStatValue = showOpening ? stock.opening : averagePrice;
  const primaryStatIcon = showOpening ? "clock-outline" : "scale-balance";

  const formatCompactNumber = (num: number, isCurrency: boolean = false) => {
    if (num >= 1000000) {
       // Supera los 6 dígitos (>= 1,000,000) -> usar acortador
       if (num >= 1000000000) {
          return (num / 1000000000).toLocaleString('es-VE', { maximumFractionDigits: 2 }) + 'b';
       }
       return (num / 1000000).toLocaleString('es-VE', { maximumFractionDigits: 2 }) + 'm';
    }
    // Menos de 1 millón -> mostrar completo
    // Si es moneda, usar 2 decimales fijos. Si es volumen (acciones), usar 0 decimales (enteros) o 2 si es necesario.
    return num.toLocaleString('es-VE', { 
        minimumFractionDigits: isCurrency ? 2 : 0, 
        maximumFractionDigits: 2 
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <UnifiedHeader
        title={stock.symbol}
        onBackPress={() => navigation.goBack()}
        rightActionIcon="share-variant"
        onActionPress={handleShare}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <Surface style={[styles.headerCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <View style={styles.headerTop}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.elevation.level2 }]}>
                     {stock.iconUrl ? (
                        // If we had an Image component here for iconUrl
                        <MaterialCommunityIcons name="chart-box-outline" size={32} color={theme.colors.primary} />
                     ) : (
                        <Text style={[styles.initials, { color: theme.colors.primary }]}>{stock.initials || stock.symbol.substring(0, 2)}</Text>
                     )}
                </View>
                <View style={styles.headerInfo}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>{stock.name}</Text>
                    <Chip style={styles.chip} textStyle={{ fontSize: 12 }}>{stock.category || 'General'}</Chip>
                </View>
            </View>

            <View style={styles.priceContainer}>
                <View style={styles.currencyRow}>
                    <Text variant="displaySmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                        {stock.price.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.bolivarIcon}>
                        <BolivarIcon size={24} color={theme.colors.onSurface} />
                    </View>
                </View>
                
                <View style={[styles.trendBadge, { backgroundColor: trendColor + '20' }]}>
                    <MaterialCommunityIcons name={trendIcon} size={16} color={trendColor} />
                    <Text style={[styles.trendText, { color: trendColor }]}>
                        {isPositive ? '+' : ''}{stock.changePercent.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                    </Text>
                    {stock.changeAmount !== undefined && stock.changeAmount !== 0 && (
                        <Text style={[styles.trendText, { color: trendColor, marginLeft: 8, opacity: 0.8 }]}>
                            ({isPositive ? '+' : ''}{stock.changeAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs)
                        </Text>
                    )}
                </View>
            </View>
        </Surface>

        {/* Stats Grid */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Estadísticas</Text>
        
        <View style={styles.statsGrid}>
            <Surface style={[styles.statCard, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]} elevation={0}>
                <View style={styles.statHeader}>
                    <MaterialCommunityIcons name={primaryStatIcon} size={20} color={theme.colors.onSurfaceVariant} />
                    <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{primaryStatLabel}</Text>
                </View>
                <View style={styles.statValueRow}>
                    <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                        {primaryStatValue ? primaryStatValue.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                    </Text>
                    <BolivarIcon size={14} color={theme.colors.onSurface} />
                </View>
            </Surface>

            <Surface style={[styles.statCard, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]} elevation={0}>
                <View style={styles.statHeader}>
                    <MaterialCommunityIcons name="history" size={20} color={theme.colors.onSurfaceVariant} />
                    <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Cierre Ant.</Text>
                </View>
                <View style={styles.statValueRow}>
                    <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                        {previousClose.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </Text>
                    <BolivarIcon size={14} color={theme.colors.onSurface} />
                </View>
            </Surface>
        </View>

        <View style={styles.statsGrid}>
             <Surface style={[styles.statCard, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]} elevation={0}>
                <View style={styles.statHeader}>
                    <MaterialCommunityIcons name="chart-bar" size={20} color={theme.colors.onSurfaceVariant} />
                    <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Volumen (Títulos)</Text>
                </View>
                <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                    {stock.volumeShares ? formatCompactNumber(stock.volumeShares) : (stock.volume || '-')}
                </Text>
            </Surface>

             <Surface style={[styles.statCard, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]} elevation={0}>
                <View style={styles.statHeader}>
                    <MaterialCommunityIcons name="cash" size={20} color={theme.colors.onSurfaceVariant} />
                    <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Volumen (Bs)</Text>
                </View>
                 <View style={styles.statValueRow}>
                    <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                         {stock.volumeAmount ? formatCompactNumber(stock.volumeAmount, true) : '-'}
                    </Text>
                    <BolivarIcon size={14} color={theme.colors.onSurface} />
                </View>
            </Surface>
        </View>

         {/* Additional Info / Placeholder for Chart */}
         <Surface style={[styles.chartPlaceholder, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]} elevation={0}>
            <MaterialCommunityIcons name="chart-timeline-variant" size={48} color={theme.colors.outline} />
            <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>Gráfico histórico próximamente</Text>
         </Surface>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  initials: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  chip: {
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'center',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center', // Center icon vertically with text
    justifyContent: 'center',
  },
  bolivarIcon: {
    marginLeft: 8, // More spacing
    // No transform needed for center alignment
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginTop: 8,
  },
  trendText: {
    fontWeight: 'bold',
    marginLeft: 4,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartPlaceholder: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderStyle: 'dashed',
  }
});

export default StockDetailScreen;
