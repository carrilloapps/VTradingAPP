import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';

import WidgetCard from './WidgetCard';
import { useAppTheme } from '@/theme';
import { WidgetItem } from '@/widget/types';

export type { WidgetItem };

interface WidgetPreviewProps {
  items: WidgetItem[];
  widgetTitle: string;
  isWallpaperDark: boolean;
  isTransparent: boolean;
  isWidgetDarkMode: boolean;
  showGraph: boolean;
}

const WidgetPreview: React.FC<WidgetPreviewProps> = ({
  items,
  widgetTitle,
  isWallpaperDark,
  isTransparent,
  isWidgetDarkMode,
  showGraph,
}) => {
  const theme = useAppTheme();
  const isDark = theme.dark;

  // Pre-calculate dynamic styles
  const statusBarColor = isWallpaperDark ? '#FFF' : '#1A1A1A';
  const vtradingAppBg = theme.colors.primary;
  const vtradingLogoTint = theme.colors.onPrimary;
  const activeIndicatorBg = isWallpaperDark ? '#FFF' : '#1A1A1A';

  // Colors for wallpaper are now defined inline with more complex gradients

  return (
    <View style={[styles.mockupContainer, { borderColor: theme.colors.outline }]}>
      {/* Phone Bezel/Wallpaper */}
      <View style={styles.wallpaper}>
        <View style={StyleSheet.absoluteFill}>
          {isWallpaperDark ? (
            <>
              <LinearGradient
                colors={['#002F24', '#004730', '#001E15']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.decorativeCircleDark1} />
              <View style={styles.decorativeCircleDark2} />
            </>
          ) : (
            <>
              <LinearGradient
                colors={['#F0F4F8', '#D9E2EC', '#BCCCDC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.decorativeCircleLight1} />
              <View style={styles.decorativeCircleLight2} />
            </>
          )}
        </View>

        {/* Status Bar Mockup */}
        <View style={styles.statusBarMockup}>
          <Text variant="labelSmall" style={[styles.statusBarTime, { color: statusBarColor }]}>
            10:42
          </Text>
          <View style={styles.statusIcons}>
            <MaterialCommunityIcons name="signal-cellular-3" size={14} color={statusBarColor} />
            <MaterialCommunityIcons name="wifi" size={14} color={statusBarColor} />
            <MaterialCommunityIcons name="battery-50" size={14} color={statusBarColor} />
          </View>
        </View>

        {/* The Widget Component */}
        <WidgetCard
          items={items}
          widgetTitle={widgetTitle}
          isTransparent={isTransparent}
          isWidgetDarkMode={isWidgetDarkMode}
          isWallpaperDark={isWallpaperDark}
          showGraph={showGraph}
        />

        {/* App Icons Simulation */}
        <View style={styles.dock}>
          {/* Phone App */}
          <View style={styles.appIconWrapper}>
            <View style={[styles.appIcon, styles.phoneAppIcon]}>
              <MaterialCommunityIcons name="phone" size={24} color="#FFF" />
            </View>
          </View>

          {/* VTrading App (Active) - Position 2 */}
          <View style={styles.appIconWrapper}>
            <View
              style={[styles.appIcon, styles.vtradingAppIcon, { backgroundColor: vtradingAppBg }]}
            >
              <FastImage
                source={
                  isDark
                    ? require('../../assets/images/logo.png')
                    : require('../../assets/images/logo-white.png')
                }
                tintColor={isDark ? '#FFFFFF' : '#212121'}
                resizeMode={FastImage.resizeMode.contain}
                style={[styles.vtradingLogo, { tintColor: vtradingLogoTint } as any]}
              />
            </View>
            {/* Active Indicator dot */}
            <View style={[styles.activeIndicator, { backgroundColor: activeIndicatorBg }]} />
          </View>

          {/* Messages App */}
          <View style={styles.appIconWrapper}>
            <View style={[styles.appIcon, styles.messagesAppIcon]}>
              <MaterialCommunityIcons name="message-text" size={24} color="#FFF" />
            </View>
          </View>

          {/* Maps App */}
          <View style={styles.appIconWrapper}>
            <View style={[styles.appIcon, styles.mapsAppIcon]}>
              <MaterialCommunityIcons name="google-maps" size={24} color="#FFF" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mockupContainer: {
    borderRadius: 32,
    borderWidth: 8,
    overflow: 'hidden',
    marginBottom: 32,
    aspectRatio: 9 / 16,
    maxHeight: 600,
    alignSelf: 'center',
    width: '80%',
    elevation: 4,
  },
  wallpaper: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  decorativeCircleDark1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(109, 219, 172, 0.05)',
    transform: [{ scaleX: 1.2 }],
  },
  decorativeCircleDark2: {
    position: 'absolute',
    bottom: -50,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  decorativeCircleLight1: {
    position: 'absolute',
    top: -120,
    left: -60,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  decorativeCircleLight2: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  statusBarMockup: {
    position: 'absolute',
    top: 12,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBarTime: {
    fontWeight: 'bold',
  },
  statusIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  dock: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 24,
  },
  appIconWrapper: {
    alignItems: 'center',
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  phoneAppIcon: {
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vtradingAppIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  vtradingLogo: {
    width: 32,
    height: 32,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  messagesAppIcon: {
    backgroundColor: '#60A5FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapsAppIcon: {
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WidgetPreview;
