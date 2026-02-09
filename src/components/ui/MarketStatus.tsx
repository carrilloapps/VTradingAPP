import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, StyleProp, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '@/theme';

export type MarketState = 'ABIERTO' | 'CERRADO' | 'PRE-APERTURA';

export interface MarketStatusProps {
  status: MarketState;
  updatedAt: string;
  onRefresh?: () => void;
  showBadge?: boolean;
  style?: StyleProp<ViewStyle>;
}

const MarketStatus: React.FC<MarketStatusProps> = ({
  status,
  updatedAt,
  onRefresh,
  showBadge = true,
  style,
}) => {
  const theme = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (status === 'ABIERTO') {
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
        ]),
      ).start();
    } else {
      fadeAnim.setValue(0.4); // Reset if closed or pre-opening
    }
  }, [status, fadeAnim]);

  // Determinar colores según el estado
  const getStatusColors = () => {
    switch (status) {
      case 'ABIERTO':
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          border: theme.colors.trendUp,
          text: theme.colors.trendUp,
        };
      case 'PRE-APERTURA':
        return {
          bg: theme.dark ? 'rgba(230, 196, 73, 0.1)' : 'rgba(230, 196, 73, 0.15)',
          border: theme.colors.warning,
          text: theme.colors.warning,
        };
      case 'CERRADO':
      default:
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          border: theme.colors.trendDown,
          text: theme.colors.trendDown,
        };
    }
  };

  const statusColors = getStatusColors();

  const themeStyles = React.useMemo(
    () => ({
      statusBadge: {
        backgroundColor: statusColors.bg,
        borderColor: statusColors.border,
      },
      dot: {
        backgroundColor: statusColors.text,
      },
      statusText: {
        color: statusColors.text,
      },
      timeText: {
        color: theme.colors.onSurfaceVariant,
      },
      refreshIcon: {
        marginLeft: 4,
      },
    }),
    [theme, statusColors],
  );

  return (
    <View style={[styles.container, style, !showBadge && styles.justifyEnd]}>
      {showBadge && (
        <View style={[styles.statusBadge, themeStyles.statusBadge]}>
          <View style={styles.indicatorContainer}>
            {status === 'ABIERTO' && (
              <Animated.View
                style={[
                  styles.ping,
                  {
                    backgroundColor: theme.colors.trendUp,
                    opacity: fadeAnim,
                  },
                ]}
              />
            )}
            <View style={[styles.dot, themeStyles.dot]} />
          </View>
          <Text style={[styles.statusText, themeStyles.statusText]}>
            {status === 'ABIERTO'
              ? 'MERCADO ABIERTO'
              : status === 'PRE-APERTURA'
                ? 'PRE-APERTURA'
                : 'MERCADO CERRADO'}
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
          <Text style={[styles.timeText, themeStyles.timeText]}>Actualizado: {updatedAt}</Text>
          {onRefresh && (
            <MaterialCommunityIcons
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  justifyEnd: {
    justifyContent: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  indicatorContainer: {
    width: 8,
    height: 8,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ping: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    marginRight: 2,
  },
});

export default React.memo(MarketStatus);
