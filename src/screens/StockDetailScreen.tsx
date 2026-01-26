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
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section - Immersive Design */}
        <View style={styles.immersiveHeader}>
            <View style={styles.iconWrapper}>
                {/* Halo Glow effect behind the stock icon */}
                <View style={[
                  styles.haloEffect, 
                  { backgroundColor: trendColor, opacity: theme.dark ? 0.15 : 0.1 }
                ]} />
                
                <View style={[
                  styles.iconContainer, 
                  { 
                    backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderWidth: 1,
                  }
                ]}>
                     {stock.iconUrl ? (
                         <MaterialCommunityIcons name="chart-box-outline" size={32} color={trendColor} />
                     ) : (
                        <Text style={[styles.initials, { color: trendColor }]}>{stock.initials || stock.symbol.substring(0, 2)}</Text>
                     )}
                </View>
            </View>

            <View style={styles.headerInfo}>
                <Text variant="headlineSmall" style={[styles.stockName, { color: theme.colors.onSurface }]}>{stock.name}</Text>
                <Chip 
                  style={[styles.chip, { backgroundColor: theme.colors.elevation.level2 }]} 
                  textStyle={{ fontSize: 11, color: theme.colors.onSurfaceVariant, fontWeight: '700' }}
                >
                  {stock.category || 'General'}
                </Chip>
            </View>

            <View style={styles.priceContainer}>
                <View style={styles.currencyRow}>
                    <Text variant="headlineLarge" style={{ color: theme.colors.onSurface, fontWeight: '900', letterSpacing: -1 }}>
                        {stock.price.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.bolivarIcon}>
                        <BolivarIcon size={24} color={theme.colors.onSurface}  />
                    </View>
                </View>
                
                <View style={[styles.trendBadge, { backgroundColor: trendColor + (theme.dark ? '30' : '15') }]}>
                    <MaterialCommunityIcons name={trendIcon} size={18} color={trendColor} />
                    <Text style={[styles.trendText, { color: trendColor }]}>
                        {isPositive ? '+' : ''}{stock.changePercent.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                    </Text>
                    {stock.changeAmount !== undefined && stock.changeAmount !== 0 && (
                        <Text style={[styles.trendAmount, { color: trendColor, opacity: 0.8 }]}>
                            ({isPositive ? '+' : ''}{stock.changeAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs)
                        </Text>
                    )}
                </View>
            </View>
        </View>

        {/* Stats Section */}
        <View style={styles.sectionHeader}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant, letterSpacing: 1 }]}>ESTADÍSTICAS</Text>
        </View>
        
        <View style={styles.statsGrid}>
            <Surface style={[styles.statCard, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]} elevation={0}>
                <View style={styles.statHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <MaterialCommunityIcons name={primaryStatIcon} size={18} color={theme.colors.primary} />
                    </View>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>{primaryStatLabel.toUpperCase()}</Text>
                </View>
                <View style={styles.statValueRow}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
                        {primaryStatValue ? primaryStatValue.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                    </Text>
                    <BolivarIcon size={14} color={theme.colors.onSurface} />
                </View>
            </Surface>

            <Surface style={[styles.statCard, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]} elevation={0}>
                <View style={styles.statHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <MaterialCommunityIcons name="history" size={18} color={theme.colors.primary} />
                    </View>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>CIERRE ANT.</Text>
                </View>
                <View style={styles.statValueRow}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
                        {previousClose.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </Text>
                    <BolivarIcon size={14} color={theme.colors.onSurface} />
                </View>
            </Surface>
        </View>

        <View style={styles.statsGrid}>
             <Surface style={[styles.statCard, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]} elevation={0}>
                <View style={styles.statHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <MaterialCommunityIcons name="chart-bar" size={18} color={theme.colors.primary} />
                    </View>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>VOL. TÍTULOS</Text>
                </View>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
                    {stock.volumeShares ? formatCompactNumber(stock.volumeShares) : (stock.volume || '-')}
                </Text>
            </Surface>

             <Surface style={[styles.statCard, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]} elevation={0}>
                <View style={styles.statHeader}>
                    <View style={[styles.statIconBox, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <MaterialCommunityIcons name="cash-multiple" size={18} color={theme.colors.primary} />
                    </View>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>VOL. BS</Text>
                </View>
                 <View style={styles.statValueRow}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
                         {stock.volumeAmount ? formatCompactNumber(stock.volumeAmount, true) : '-'}
                    </Text>
                    <BolivarIcon size={14} color={theme.colors.onSurface}  />
                </View>
            </Surface>
        </View>

         {/* Additional Info / Placeholder for Chart */}
         <View style={styles.sectionHeader}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant, letterSpacing: 1 }]}>ANÁLISIS TÉCNICO</Text>
        </View>
         <Surface style={[styles.chartPlaceholder, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]} elevation={0}>
            <View style={[styles.chartIconGlow, { backgroundColor: theme.colors.primary, opacity: 0.05 }]} />
            <MaterialCommunityIcons name="chart-timeline-variant" size={48} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, fontWeight: '600' }}>Gráfico histórico próximamente</Text>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  immersiveHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  haloEffect: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    filter: 'blur(30px)',
    zIndex: -1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  initials: {
    fontSize: 28,
    fontWeight: '900',
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stockName: {
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  chip: {
    borderRadius: 12,
    height: 28,
  },
  priceContainer: {
    alignItems: 'center',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolivarIcon: {
    marginLeft: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 12,
    gap: 4,
  },
  trendText: {
    fontWeight: '900',
    fontSize: 16,
  },
  trendAmount: {
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 4,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '900',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24, // Matches standard card radius (roundness * 6)
    borderWidth: 1,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartPlaceholder: {
    height: 220,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  chartIconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    filter: 'blur(40px)',
    top: '30%',
  }
});

export default StockDetailScreen;
