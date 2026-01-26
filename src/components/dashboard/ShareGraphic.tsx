import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Icon, Surface, useTheme } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { ExchangeCardProps } from './ExchangeCard';

interface ShareGraphicProps {
  viewShotRef: React.RefObject<any>;
  featuredRates: ExchangeCardProps[];
  spread: number | null;
  lastUpdated: string;
  isPremium?: boolean;
}

const ShareGraphic: React.FC<ShareGraphicProps> = ({ 
  viewShotRef, 
  featuredRates, 
  spread, 
  lastUpdated,
  isPremium = false
}) => {
  const theme = useTheme();

  return (
    <View style={styles.hiddenTemplate} pointerEvents="none">
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
        <LinearGradient 
          colors={theme.dark ? ['#051911', '#0A0A0A'] : ['#F0FDF4', '#FFFFFF']} 
          style={styles.shareTemplate}
        >
          {/* Decorative Elements */}
          <View style={[styles.templateGlow, { backgroundColor: theme.colors.primary, opacity: 0.05 }]} />

          {/* Platform Badges */}
          <View style={styles.platformBadgesContainer}>
            <Surface style={[styles.platformBadge, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
              <Icon source="google-play" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.platformText, { color: theme.colors.onSurfaceVariant }]}>Android</Text>
            </Surface>
            <View style={{ flex: 1 }} />
            <Surface style={[styles.platformBadge, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
              <Icon source="apple" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.platformText, { color: theme.colors.onSurfaceVariant }]}>iOS App</Text>
            </Surface>
          </View>

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
          
          <View style={styles.templateContent}>
            {featuredRates.map((rate, idx) => {
              const isNeutral = rate.changePercent.includes('0.00');
              const trendColor = isNeutral 
                ? theme.colors.onSurfaceVariant 
                : (rate.isPositive ? (theme.colors as any).success || '#6EE7B7' : (theme.colors as any).error || '#F87171');
              const trendIcon = isNeutral 
                ? 'minus' 
                : (rate.isPositive ? 'trending-up' : 'trending-down');

              return (
                <Surface key={idx} style={[styles.templateCard, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: theme.colors.outlineVariant }]} elevation={0}>
                  <View style={styles.templateCardHeader}>
                    <View style={[styles.templateIconSmall, { backgroundColor: theme.colors.primary + '20' }]}>
                      <Icon source={rate.code === 'USDT' || rate.title.includes('USDT') ? 'alpha-t-circle-outline' : 'currency-usd'} size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.templateCardTitle, { color: theme.colors.onSurfaceVariant }]}>{rate.title}</Text>
                  </View>
                  <View style={styles.templateValueRow}>
                    <Text style={[styles.templateValue, { color: theme.colors.onSurface }]}>{rate.value}</Text>
                    <View style={styles.templateValueLabelColumn}>
                        <Text style={[styles.templateCurrency, { color: theme.colors.onSurfaceVariant }]}>Bs.</Text>
                        <View style={[styles.templateTrendBox, { backgroundColor: trendColor + '15' }]}>
                            <Icon source={trendIcon} size={14} color={trendColor} />
                            <Text style={[styles.templateTrendText, { color: trendColor }]}>{rate.changePercent}</Text>
                        </View>
                    </View>
                  </View>
                </Surface>
              );
            })}

            {spread !== null && (
              <View style={[styles.templateSpreadBox, { backgroundColor: ((theme.colors as any).warning || '#F59E0B') + '15', borderColor: ((theme.colors as any).warning || '#F59E0B') + '30' }]}>
                <Icon source="swap-horizontal" size={18} color={(theme.colors as any).warning || '#F59E0B'} />
                <Text style={[styles.templateSpreadText, { color: (theme.colors as any).warning || '#F59E0B' }]}>
                  SPREAD (Diferencia USD vs USDT): <Text style={{ fontWeight: '900' }}>{spread.toFixed(2)}%</Text>
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.templateFooter}>
            <LinearGradient 
              colors={[theme.colors.primary + '00', theme.colors.primary + '10', theme.colors.primary + '00']} 
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              style={styles.templateDivider}
            />
            <View style={styles.templateFooterRow}>
              <Icon source={isPremium ? "shield-check-outline" : "shield-outline"} size={16} color={theme.colors.primary} />
              <Text style={[styles.templateFooterText, { color: theme.colors.primary }]}>
                MONITOREO DE MONITOREO FINANCIERO{isPremium ? ' PREMIUM' : ''}
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
    left: -2000, 
    width: 600,
    height: 600,
    zIndex: -1,
  },
  shareTemplate: {
    width: 600,
    height: 600,
    padding: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  templateGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'white', // Placeholder, opacity handled in view
  },
  templateHeader: {
    alignItems: 'center',
    width: '100%',
    marginTop: 0,
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
  templateDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(128,128,128,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  templateDate: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  templateContent: {
    width: '100%',
    gap: 10,
  },
  templateCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    width: '100%',
  },
  templateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    justifyContent: 'center',
  },
  templateIconSmall: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  templateValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  templateValue: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  templateValueLabelColumn: {
    marginLeft: 6,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 1,
    height: 54, 
  },
  templateCurrency: {
    fontSize: 18,
    fontWeight: '800',
    opacity: 0.8,
    marginBottom: -2,
  },
  templateTrendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  templateTrendText: {
    fontSize: 11,
    fontWeight: '800',
  },
  templateSpreadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  templateSpreadText: {
    fontSize: 12,
    fontWeight: '600',
  },
  templateFooter: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
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

export default ShareGraphic;
