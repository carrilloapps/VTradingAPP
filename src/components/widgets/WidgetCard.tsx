import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';

import { WidgetItem } from './WidgetPreview';
import { useAppTheme } from '@/theme';

interface WidgetCardProps {
  items: WidgetItem[];
  widgetTitle: string;
  isTransparent: boolean;
  isWidgetDarkMode: boolean;
  isWallpaperDark: boolean;
  showGraph: boolean;
}

const WidgetCard: React.FC<WidgetCardProps> = ({
  items,
  widgetTitle,
  isTransparent,
  isWidgetDarkMode,
  isWallpaperDark,
  showGraph,
}) => {
  const theme = useAppTheme();
  const isDark = theme.dark;

  // Determine gradient colors
  const getGradientColors = () => {
    if (isTransparent) {
      // Transparency logic: adapt to wallpaper brightness
      return isWallpaperDark
        ? [
            'rgba(33, 33, 33, 0.8)',
            'rgba(45, 45, 45, 0.8)',
            'rgba(33, 33, 33, 0.8)',
          ]
        : [
            'rgba(255, 255, 255, 0.85)',
            'rgba(242, 244, 246, 0.85)',
            'rgba(255, 255, 255, 0.85)',
          ];
    }

    // Opaque logic - Grayscale for Dark (#212121 base), Modern Gradient for Light (#FFFFFF base)
    return isWidgetDarkMode
      ? ['#212121', '#2C2C2C', '#212121']
      : ['#FFFFFF', '#F2F4F6', '#FFFFFF'];
  };

  const gradientColors = getGradientColors();

  // Pre-calculate dynamic colors
  const refreshIconColor = isWidgetDarkMode
    ? 'rgba(255,255,255,0.6)'
    : 'rgba(0,0,0,0.4)';
  const widgetIconTint = isWidgetDarkMode ? theme.colors.primary : '#1A2C3E';
  const widgetTitleColor = isWidgetDarkMode ? '#FFF' : '#1A2C3E';
  const currencyLabelColor = isWidgetDarkMode
    ? 'rgba(255, 255, 255, 0.7)'
    : '#64748B';
  const rateValueColor = isWidgetDarkMode ? '#FFF' : '#0F172A';
  const rateCurrencyColor = isWidgetDarkMode
    ? 'rgba(255,255,255,0.6)'
    : 'rgba(0,0,0,0.5)';
  const borderBottomColorValue = isWidgetDarkMode
    ? 'rgba(255,255,255,0.1)'
    : 'rgba(0,0,0,0.05)';
  const footerTextColor = isWidgetDarkMode
    ? 'rgba(255,255,255,0.4)'
    : 'rgba(0,0,0,0.4)';

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.widgetCard,
        {
          borderColor: theme.colors.exchangeCardBorder,
        },
      ]}
    >
      {/* Background Blur Effect Circle */}
      <View style={styles.blurCircle} />

      {/* Widget Header */}
      <View style={styles.widgetHeader}>
        <View style={styles.widgetTitleRow}>
          <FastImage
            source={
              isDark
                ? require('../../assets/images/logo.png')
                : require('../../assets/images/logo-white.png')
            }
            tintColor={isDark ? '#FFFFFF' : '#212121'}
            resizeMode={FastImage.resizeMode.contain}
            style={[styles.widgetIcon, { tintColor: widgetIconTint } as any]}
          />
          <Text style={[styles.widgetTitleText, { color: widgetTitleColor }]}>
            {widgetTitle}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="refresh"
          size={18}
          color={refreshIconColor}
        />
      </View>

      {/* Dynamic Rows */}
      {items.slice(0, 4).map((item, index) => {
        const isLast = index === items.length - 1;
        const rowBorderStyle = !isLast
          ? { borderBottomColor: borderBottomColorValue }
          : undefined;
        return (
          <View
            key={item.id}
            style={[
              isLast ? styles.rateRowNoBorder : styles.rateRow,
              rowBorderStyle,
            ]}
          >
            <View>
              <Text
                style={[styles.currencyLabel, { color: currencyLabelColor }]}
              >
                {item.label}
              </Text>
              <Text style={[styles.rateValue, { color: rateValueColor }]}>
                {item.value}{' '}
                <Text
                  style={[styles.rateCurrency, { color: rateCurrencyColor }]}
                >
                  {item.currency}
                </Text>
              </Text>
            </View>
            <View
              style={[styles.trendBadge, { backgroundColor: item.trendBg }]}
            >
              <MaterialCommunityIcons
                name={
                  item.trend === 'up'
                    ? 'trending-up'
                    : item.trend === 'down'
                      ? 'trending-down'
                      : 'trending-neutral'
                }
                size={14}
                color={item.trendColor}
              />
              {showGraph && (
                <Text style={[styles.trendText, { color: item.trendColor }]}>
                  {item.trendValue}
                </Text>
              )}
            </View>
          </View>
        );
      })}

      {/* Widget Footer (if graph is hidden, maybe show updated time or provider) */}
      {!showGraph && (
        <View style={styles.widgetFooter}>
          <Text style={[styles.footerText, { color: footerTextColor }]}>
            Actualizado hace 5 min
          </Text>
          <Text style={[styles.footerTextBold, { color: footerTextColor }]}>
            BCV • Binance
          </Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  widgetCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    minHeight: 160,
    overflow: 'hidden', // Ensure gradient/blur respects border radius
    position: 'relative',
  },
  blurCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    zIndex: 0,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    position: 'relative',
    zIndex: 1,
  },
  widgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  widgetIcon: {
    width: 30,
    height: 15,
  },
  widgetTitleText: {
    fontWeight: '600',
    fontSize: 14,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  rateRowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  currencyLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  rateValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  rateCurrency: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  widgetFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
  },
  footerTextBold: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default WidgetCard;
