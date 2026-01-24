import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useAppTheme } from '../../theme/theme';

export type NotificationType = 'price_alert' | 'market_news' | 'system';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isArchived?: boolean;
  trend?: 'up' | 'down';
  highlightedValue?: string; // e.g., "36.24 Bs"
  data?: any;
}

interface NotificationCardProps {
  notification: NotificationData;
  onPress: () => void;
  onArchive: () => void;
  onDelete: () => void;
  showSwipeHint?: boolean;
}

import { formatTimeAgo } from '../../utils/dateUtils';

import NotificationIcon, { getNotificationIconConfig } from './NotificationIcon';

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onArchive,
  onDelete,
  // Control swipe hint visibility (default: false)
  showSwipeHint = false,
}) => {
  const theme = useAppTheme();
  const iconConfig = getNotificationIconConfig(notification, theme);
  const formattedTime = formatTimeAgo(notification.timestamp);
  
  // Use fallback title if current title is generic "Notificación"
  const displayTitle = notification.title === 'Notificación' ? iconConfig.fallbackTitle : notification.title;

  const renderRightActions = (
    _: Animated.AnimatedInterpolation<number>,
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

  const renderLeftActions = (
    _: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.leftAction, { backgroundColor: theme.colors.errorContainer }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <MaterialIcons name="delete" size={24} color={theme.colors.onErrorContainer} />
        </Animated.View>
      </View>
    );
  };

  // Render message with bold highlighted parts
  const renderMessage = () => {
    if (!notification.highlightedValue) {
      return (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }} numberOfLines={3}>
          {notification.message}
        </Text>
      );
    }

    const parts = notification.message.split(notification.highlightedValue);
    if (parts.length < 2) {
       return (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }} numberOfLines={3}>
          {notification.message}
        </Text>
      );
    }

    return (
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }} numberOfLines={3}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                {notification.highlightedValue}
              </Text>
            )}
          </React.Fragment>
        ))}
      </Text>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onSwipeableRightOpen={onArchive}
      onSwipeableLeftOpen={onDelete}
    >
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
          <NotificationIcon notification={notification} />

          {/* Text Section */}
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurface, fontWeight: '700', flex: 1, marginRight: 8 }} numberOfLines={2}>
                {displayTitle}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {formattedTime}
              </Text>
            </View>

            {renderMessage()}

            {/* Swipe Hint */}
            {showSwipeHint && (
              <View style={styles.swipeHint}>
                <MaterialIcons name="touch-app" size={12} color={theme.colors.onSurfaceVariant} />
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4, textTransform: 'uppercase', fontSize: 10, fontWeight: 'bold' }}>
                  DESLIZA: ARCHIVAR / BORRAR
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableRipple>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
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
  leftAction: {
    justifyContent: 'center',
    alignItems: 'flex-start',
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
