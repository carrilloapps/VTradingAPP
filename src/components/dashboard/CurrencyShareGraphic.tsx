import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Icon, Surface, useTheme } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { CurrencyRate } from '../../services/CurrencyService';
import { BolivarIcon } from '../ui/BolivarIcon';

interface CurrencyShareGraphicProps {
  viewShotRef: React.RefObject<any>;
  rate: CurrencyRate;
  lastUpdated: string;
  isPremium?: boolean;
  aspectRatio?: '1:1' | '16:9';
}

const CurrencyShareGraphic: React.FC<CurrencyShareGraphicProps> = ({ 
  viewShotRef, 
  rate, 
  lastUpdated,
  isPremium = false,
  aspectRatio = '1:1'
}) => {
  const theme = useTheme();

  const isPositive = (rate.changePercent || 0) > 0;
  const isNegative = (rate.changePercent || 0) < 0;
  const isNeutral = !rate.changePercent || rate.changePercent === 0;

  const trendColor = isPositive 
    ? (theme.colors as any).success || '#6EE7B7' 
    : isNegative 
      ? (theme.colors as any).error || '#F87171' 
      : theme.colors.onSurfaceVariant;

  const trendIcon = isPositive 
    ? 'trending-up' 
    : isNegative 
      ? 'trending-down' 
      : 'minus';

  const isVertical = aspectRatio === '16:9';
  
  const spread = (rate.buyValue && rate.sellValue) 
    ? Math.abs(((rate.sellValue - rate.buyValue) / rate.buyValue) * 100)
    : null;

  return (
    <View style={styles.hiddenTemplate} pointerEvents="none">
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }}>
        <LinearGradient 
          colors={theme.dark ? ['#051911', '#0A0A0A'] : ['#F0FDF4', '#FFFFFF']} 
          style={[
            styles.shareTemplate, 
            isVertical ? styles.shareTemplateVertical : styles.shareTemplateSquare
          ]}
        >
          {/* Decorative Elements */}
          <View style={[styles.templateGlow, { backgroundColor: theme.colors.primary, opacity: 0.05 }]} />

          {/* Platform Badges */}
          <View style={styles.platformBadgesContainer}>
            <Surface style={[styles.platformBadge, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
              <Icon source="google-play" size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.platformText, { color: theme.colors.onSurfaceVariant }]}>Android</Text>
            </Surface>
            <View style={{ flex: 1 }} />
            <Surface style={[styles.platformBadge, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
              <Icon source="apple" size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.platformText, { color: theme.colors.onSurfaceVariant }]}>iOS</Text>
            </Surface>
          </View>

          {/* Header */}
          <View style={styles.templateHeader}>
            <View style={styles.logoAndBadgeRow}>
              <Image 
                source={require('../../assets/images/logotipo.png')} 
                style={styles.templateMainLogo}
                resizeMode="contain"
              />
              {!isPremium && (
                <Surface style={[styles.freeBadge, { backgroundColor: (theme.colors as any).error || '#FF5252' }]} elevation={2}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </Surface>
              )}
            </View>
            <View style={[styles.templateUrlBadge, { backgroundColor: theme.colors.primary + '15', marginBottom: 8 }]}>
              <Text style={[styles.templateUrlText, { color: theme.colors.primary }]}>vtrading.app</Text>
            </View>
            <View style={styles.templateDateBox}>
              <Icon source="calendar-clock" size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.templateDate, { color: theme.colors.onSurfaceVariant }]}>
                {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {lastUpdated}
              </Text>
            </View>
          </View>
          
          {/* Content */}
          <View style={[styles.templateContent, isVertical && { flex: 1, justifyContent: 'center', gap: 32 }]}>
            <Surface style={[styles.mainCard, isVertical && styles.mainCardVertical, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: theme.colors.outlineVariant }]} elevation={0}>
                {/* Currency Identification */}
                <View style={styles.stockIdentityRow}>
                    <View style={[styles.stockIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                        {rate.iconName === 'Bs' ? (
                            <BolivarIcon size={32} color={theme.colors.primary} />
                        ) : (
                            <Icon source={rate.iconName || 'currency-usd'} size={32} color={theme.colors.primary} />
                        )}
                    </View>
                    <View>
                        <Text style={[styles.stockSymbolLabel, { color: theme.colors.onSurface }]}>{rate.code} / VES</Text>
                        <Text style={[styles.stockNameLabel, { color: theme.colors.onSurfaceVariant }]}>{rate.name}</Text>
                    </View>
                </View>

                <View style={styles.priceSection}>
                    <View style={styles.valueRow}>
                        <Text style={[styles.mainValueText, isVertical && { fontSize: 84 }, { color: theme.colors.onSurface }]}>
                            {rate.value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <View style={[styles.labelColumn, isVertical && { height: 84 }]}>
                            <Text style={[styles.currencyText, { color: theme.colors.onSurfaceVariant }]}>Bs.</Text>
                            <View style={[styles.trendBadge, { backgroundColor: trendColor + '15' }]}>
                                <Icon source={trendIcon} size={14} color={trendColor} />
                                <Text style={[styles.trendPercentText, { color: trendColor }]}>
                                    {isNeutral ? '' : (isPositive ? '+' : '')}{(rate.changePercent || 0).toFixed(2)}%
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Extra Stats for vertical format */}
                {isVertical && (
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>PRECIO COMPRA</Text>
                            <Text style={styles.statValue}>{rate.buyValue ? rate.buyValue.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '--'} <Text style={styles.statCurrency}>Bs.</Text></Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>PRECIO VENTA</Text>
                            <Text style={styles.statValue}>{rate.sellValue ? rate.sellValue.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '--'} <Text style={styles.statCurrency}>Bs.</Text></Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>SPREAD / BRECHA</Text>
                            <Text style={styles.statValue}>{spread ? `${spread.toFixed(2)}%` : '--'}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>ESTADO MERCADO</Text>
                            <Text style={styles.statValue}>ACTIVO</Text>
                        </View>
                    </View>
                )}
            </Surface>
          </View>
          
          {/* Footer */}
          <View style={styles.templateFooter}>
            <LinearGradient 
              colors={[theme.colors.primary + '00', theme.colors.primary + '10', theme.colors.primary + '00']} 
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              style={styles.templateDivider}
            />
            <View style={styles.templateFooterRow}>
              <Icon source={isPremium ? "shield-check-outline" : "shield-outline"} size={16} color={theme.colors.primary} />
              <Text style={[styles.templateFooterText, { color: theme.colors.primary }]}>
                MONITOREO FINANCIERO{isPremium ? ' PREMIUM' : ''}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenTemplate: {
    position: 'absolute',
    left: -4000, 
    width: 600,
    zIndex: -1,
  },
  shareTemplate: {
    padding: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  shareTemplateSquare: {
    width: 600,
    height: 600,
  },
  shareTemplateVertical: {
    width: 600,
    height: 1066, 
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  templateGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  templateHeader: {
    alignItems: 'center',
    width: '100%',
  },
  platformBadgesContainer: {
    position: 'absolute',
    top: 15,
    left: 20,
    right: 20,
    flexDirection: 'row',
    zIndex: 10,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  platformText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 4,
  },
  templateMainLogo: {
    width: 160,
    height: 42,
  },
  freeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: -8, 
    marginTop: -2,
  },
  freeBadgeText: {
    color: 'white',
    fontSize: 7,
    fontWeight: '900',
  },
  templateUrlBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  templateUrlText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  templateDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(128,128,128,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    marginTop: 8,
  },
  templateDate: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  templateContent: {
    width: '100%',
  },
  mainCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    width: '100%',
  },
  mainCardVertical: {
    padding: 32,
    borderRadius: 32,
  },
  stockIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  stockIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stockSymbolLabel: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stockNameLabel: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.7,
  },
  priceSection: {
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mainValueText: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
  },
  labelColumn: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 2,
    height: 64,
  },
  currencyText: {
    fontSize: 22,
    fontWeight: '800',
    opacity: 0.8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendPercentText: {
    fontSize: 12,
    fontWeight: '900',
  },
  statsGrid: {
    marginTop: 32,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'space-between',
  },
  statItem: {
    width: '45%',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '900',
    opacity: 0.5,
    marginBottom: 4,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statCurrency: {
    fontSize: 10,
    opacity: 0.5,
  },
  templateFooter: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
  },
  templateDivider: {
    width: '100%',
    height: 1,
    marginBottom: 8,
  },
  templateFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  templateFooterText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  }
});

export default CurrencyShareGraphic;
