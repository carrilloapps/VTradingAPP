import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export interface MarketStatusProps {
  isOpen: boolean;
  updatedAt: string;
  onRefresh?: () => void;
  showBadge?: boolean;
  style?: any;
}

const MarketStatus: React.FC<MarketStatusProps> = ({ isOpen, updatedAt, onRefresh, showBadge = true, style }) => {
  const theme = useTheme();
  const colors = theme.colors as any;
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
        fadeAnim.setValue(0.4); // Reset if closed
    }
  }, [isOpen, fadeAnim]);

  const themeStyles = React.useMemo(() => ({
    statusBadge: {
      backgroundColor: isOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', // emerald-500 / red-500 with opacity
      borderColor: isOpen ? '#10B981' : '#EF4444',
    },
    dot: {
      backgroundColor: isOpen ? '#10B981' : '#EF4444',
    },
    statusText: {
      color: isOpen ? '#10B981' : '#EF4444',
    },
    timeText: {
      color: theme.colors.onSurfaceVariant,
    },
    refreshIcon: {
      marginLeft: 4,
    }
  }), [theme, colors, isOpen]);

  return (
    <View style={[styles.container, style, !showBadge && styles.justifyEnd]}>
      {showBadge && (
        <View style={[styles.statusBadge, themeStyles.statusBadge]}>
            <View style={styles.indicatorContainer}>
                {isOpen && (
                    <Animated.View
                    style={[
                        styles.ping,
                        {
                        backgroundColor: '#10B981',
                        opacity: fadeAnim,
                        },
                    ]}
                    />
                )}
                <View style={[styles.dot, themeStyles.dot]} />
            </View>
          <Text style={[styles.statusText, themeStyles.statusText]}>
            {isOpen ? 'MERCADO ABIERTO' : 'MERCADO CERRADO'}
          </Text>
        </View>
      )}
      
      <View style={styles.rightContent}>
        <TouchableOpacity 
            onPress={onRefresh} 
            disabled={!onRefresh}
            style={styles.refreshContainer}
            activeOpacity={0.6}
        >
            <Text style={[styles.timeText, themeStyles.timeText]}>
            Actualizado: {updatedAt}
            </Text>
            {onRefresh && (
            <MaterialIcons 
                name="refresh" 
                size={14} 
                color={theme.colors.onSurfaceVariant} 
                style={themeStyles.refreshIcon}
            />
            )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  justifyEnd: {
    justifyContent: 'flex-end',
  },
  rightContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  indicatorContainer: {
    position: 'relative',
    width: 6,
    height: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ping: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  refreshContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  }
});

export default MarketStatus;
