import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/theme';
import WidgetCard from './WidgetCard';

export interface WidgetItem {
  id: string;
  label: string;
  value: string;
  currency: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  trendColor: string;
  trendBg: string;
}

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
              <View style={{ position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(109, 219, 172, 0.05)', transform: [{ scaleX: 1.2 }] }} />
              <View style={{ position: 'absolute', bottom: -50, left: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(0, 0, 0, 0.3)' }} />
            </>
          ) : (
            <>
              <LinearGradient
                colors={['#F0F4F8', '#D9E2EC', '#BCCCDC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ position: 'absolute', top: -120, left: -60, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(255, 255, 255, 0.8)' }} />
              <View style={{ position: 'absolute', bottom: -80, right: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(16, 185, 129, 0.05)' }} />
            </>
          )}
        </View>

        {/* Status Bar Mockup */}
        <View style={styles.statusBarMockup}>
          <Text
            variant="labelSmall"
            style={{
              color: isWallpaperDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
              fontWeight: 'bold',
            }}
          >
            10:42
          </Text>
          <View style={styles.statusIcons}>
            <MaterialCommunityIcons
              name="signal-cellular-3"
              size={14}
              color={isWallpaperDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'}
            />
            <MaterialCommunityIcons
              name="wifi"
              size={14}
              color={isWallpaperDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'}
            />
            <MaterialCommunityIcons
              name="battery-50"
              size={14}
              color={isWallpaperDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'}
            />
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
            <View style={[styles.appIcon, { backgroundColor: '#4ADE80', alignItems: 'center', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name="phone" size={24} color="#FFF" />
            </View>
          </View>

          {/* VTrading App (Active) - Position 2 */}
          <View style={styles.appIconWrapper}>
            <View style={[
              styles.appIcon, 
              { 
                backgroundColor: isWallpaperDark ? '#212121' : '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }
            ]}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={{
                  width: 32,
                  height: 32,
                  tintColor: isWallpaperDark ? theme.colors.primary : '#212121'
                }}
                resizeMode="contain"
              />
            </View>
            {/* Active Indicator dot */}
            <View style={{
              width: 4, 
              height: 4, 
              borderRadius: 2, 
              backgroundColor: isWallpaperDark ? 'white' : '#1A2C3E',
              marginTop: 4
            }} />
          </View>

          {/* Messages App */}
          <View style={styles.appIconWrapper}>
            <View style={[styles.appIcon, { backgroundColor: '#60A5FA', alignItems: 'center', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name="message-text" size={24} color="#FFF" />
            </View>
          </View>

          {/* Maps App */}
          <View style={styles.appIconWrapper}>
            <View style={[styles.appIcon, { backgroundColor: '#FBBF24', alignItems: 'center', justifyContent: 'center' }]}>
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
  statusBarMockup: {
    position: 'absolute',
    top: 12,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});

export default WidgetPreview;
