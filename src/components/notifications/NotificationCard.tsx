import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useAppTheme } from '../../theme/useAppTheme';

export type NotificationType = 'price_alert' | 'market_news' | 'system';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  trend?: 'up' | 'down';
  highlightedValue?: string; // e.g., "36.24 Bs"
}

interface NotificationCardProps {
  notification: NotificationData;
  onPress: () => void;
  onArchive: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onArchive,
}) => {
  const theme = useAppTheme();

  // Icon Logic
  const getIconConfig = () => {
    switch (notification.type) {
      case 'price_alert':
        return {
          name: 'payments',
          color: notification.trend === 'up' ? theme.colors.success : theme.colors.error,
          bgColor: notification.trend === 'up' ? theme.colors.successContainer : theme.colors.errorContainer,
          badge: notification.trend === 'up' ? 'trending-up' : 'trending-down',
        };
      case 'market_news':
        return {
          name: 'show-chart', // monitoring -> show-chart
          color: theme.colors.primary,
          bgColor: theme.colors.primaryContainer,
          badge: null,
        };
      case 'system':
        return {
          name: 'campaign', // speaker-phone -> campaign
          color: theme.colors.tertiary, // Orange-ish usually
          bgColor: theme.colors.tertiaryContainer,
          badge: null,
        };
      default:
        return {
          name: 'notifications',
          color: theme.colors.onSurfaceVariant,
          bgColor: theme.colors.surfaceVariant,
          badge: null,
        };
    }
  };

  const iconConfig = getIconConfig();

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.rightAction, { backgroundColor: theme.colors.primaryContainer }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <MaterialIcons name="archive" size={24} color={theme.colors.onPrimaryContainer} />
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} onSwipeableRightOpen={onArchive}>
      <TouchableRipple
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: notification.isRead
              ? theme.colors.background // Read: blends with background
              : theme.colors.elevation.level1, // Unread: slightly elevated
            borderColor: theme.colors.outline,
          },
        ]}
        rippleColor={theme.colors.primary + '20'}
      >
        <View style={styles.contentContainer}>
          {/* Icon Section */}
          <View style={[styles.iconContainer, { backgroundColor: iconConfig.bgColor }]}>
            <MaterialIcons name={iconConfig.name} size={24} color={iconConfig.color} />
            {iconConfig.badge && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: iconConfig.color,
                    borderColor: theme.colors.elevation.level1,
                  },
                ]}
              >
                <MaterialIcons name={iconConfig.badge} size={12} color={theme.colors.surface} />
              </View>
            )}
          </View>

          {/* Text Section */}
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                {notification.title}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {notification.timestamp}
              </Text>
            </View>

            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              {notification.message}
            </Text>

            {/* Swipe Hint */}
            <View style={styles.swipeHint}>
              <MaterialIcons name="swipe" size={12} color={theme.colors.onSurfaceVariant} />
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4, textTransform: 'uppercase', fontSize: 10 }}>
                DESLIZA PARA ARCHIVAR
              </Text>
            </View>
          </View>
        </View>
      </TouchableRipple>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    padding: 2,
    borderRadius: 10,
    borderWidth: 2,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rightAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 12,
    borderRadius: 16,
    paddingHorizontal: 24,
    flex: 1,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    opacity: 0.7,
  },
});

export default NotificationCard;
