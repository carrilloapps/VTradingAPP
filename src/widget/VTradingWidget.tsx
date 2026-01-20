import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { WidgetItem } from '../components/widgets/WidgetPreview';

interface VTradingWidgetProps {
  items: WidgetItem[];
  widgetTitle: string;
  isTransparent: boolean;
  isWidgetDarkMode: boolean;
  isWallpaperDark: boolean;
  showGraph: boolean;
  lastUpdated?: string;
}

const VTradingWidget: React.FC<VTradingWidgetProps> = ({
  items,
  widgetTitle,
  isTransparent,
  isWidgetDarkMode,
  isWallpaperDark,
  showGraph,
  lastUpdated
}) => {
  // Styles based on WidgetCard logic
  const getBackgroundColor = () => {
    if (isTransparent) {
        return isWallpaperDark 
          ? 'rgba(33, 33, 33, 0.8)' 
          : 'rgba(255, 255, 255, 0.85)';
    }
    return isWidgetDarkMode ? '#212121' : '#FFFFFF';
  };

  const backgroundColor = getBackgroundColor();
  const textColor = isWidgetDarkMode ? '#FFFFFF' : '#1A2C3E';
  const subTextColor = isWidgetDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#64748B';
  const dividerColor = isWidgetDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
           {/* Logo - using require directly */}
           {/* Note: TintColor might not be fully supported on all Image types in widgets, but usually works */}
           <Image 
             source={require('../assets/images/logo.png')} 
             style={{ width: 30, height: 15, tintColor: isWidgetDarkMode ? '#00A86B' : '#1A2C3E' }}
             resizeMode="contain"
           />
           <Text style={{ 
               fontSize: 14, 
               fontWeight: 'bold', 
               color: textColor, 
               marginLeft: 8 
           }}>
             {widgetTitle}
           </Text>
        </View>
        <Text style={{ fontSize: 18, color: subTextColor }}>↻</Text>
      </View>

      {/* Items */}
      {items.slice(0, 4).map((item, index) => (
        <View key={item.id} style={[
            styles.row,
            index < items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: dividerColor } : {}
        ]}>
          <View>
            <Text style={{ fontSize: 12, color: subTextColor, fontWeight: '600', marginBottom: 2 }}>
                {item.label}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: textColor }}>
                {item.value} <Text style={{ fontSize: 12, fontWeight: 'normal', color: subTextColor }}>{item.currency}</Text>
            </Text>
          </View>
          
          <View style={[
              styles.badge, 
              { backgroundColor: item.trendBg }
          ]}>
             <Text style={{ 
                 color: item.trendColor, 
                 fontSize: 12, 
                 fontWeight: 'bold' 
             }}>
                {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '−'}
                {showGraph ? ` ${item.trendValue}` : ''}
             </Text>
          </View>
        </View>
      ))}

      {/* Footer */}
      {!showGraph && (
          <View style={styles.footer}>
             <Text style={{ fontSize: 10, color: subTextColor }}>
                {lastUpdated || 'Actualizado hace poco'}
             </Text>
          </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // Simplification
    justifyContent: 'space-between'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});

export default VTradingWidget;
