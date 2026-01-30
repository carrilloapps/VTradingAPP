import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
        <Animated.View style={[styles.actionIcon, { transform: [{ scale }] }]}>
          <MaterialCommunityIcons name="archive" size={24} color={theme.colors.onPrimaryContainer} />
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
        <Animated.View style={[styles.actionIcon, { transform: [{ scale }] }]}>
          <MaterialCommunityIcons name="trash-can" size={24} color={theme.colors.onErrorContainer} />
        </Animated.View>
      </View>
    );
  };

  // Render message with bold highlighted parts and number formatting
  const renderMessage = () => {
    let displayMessage = notification.message;
    let highlight = notification.highlightedValue;

    // Attempt to format numeric highlight to 2 decimals
    if (highlight) {
      // Extract number from highlight string (e.g. "36.24123" or "36.24123 Bs")
      const numberMatch = highlight.match(/(\d+\.\d+)/);
      if (numberMatch) {
        const originalNumberStr = numberMatch[0];
        const numericVal = parseFloat(originalNumberStr);

        if (!isNaN(numericVal)) {
          const formattedNumber = numericVal.toFixed(2);
          // Replace only the number part in highlight
          const formattedHighlight = highlight.replace(originalNumberStr, formattedNumber);

          // Replace the highlight in the full message
          if (displayMessage.includes(highlight)) {
            displayMessage = displayMessage.replace(highlight, formattedHighlight);
            highlight = formattedHighlight;
          }
        }
      }
    }

    if (!highlight) {
      return (
        <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
          {displayMessage}
        </Text>
      );
    }

    const parts = displayMessage.split(highlight);
    if (parts.length < 2) {
      return (
        <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
          {displayMessage}
        </Text>
      );
    }

    return (
      <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <Text style={[styles.messageHighlight, { color: theme.colors.onSurface }]}>
                {highlight}
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
              <Text variant="labelLarge" style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={2}>
                {displayTitle}
              </Text>
              <Text variant="labelSmall" style={[styles.time, { color: theme.colors.onSurfaceVariant }]}>
                {formattedTime}
              </Text>
            </View>

            {renderMessage()}

            {/* Swipe Hint */}
            {showSwipeHint && (
              <View style={styles.swipeHint}>
                <MaterialCommunityIcons name="gesture-swipe-horizontal" size={12} color={theme.colors.onSurfaceVariant} />
                <Text variant="labelSmall" style={[styles.swipeHintText, { color: theme.colors.onSurfaceVariant }]}>
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
  title: {
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  time: {
  },
  message: {
    marginTop: 4,
  },
  messageHighlight: {
    fontWeight: 'bold',
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
  actionIcon: {
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
  swipeHintText: {
    marginLeft: 4,
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default NotificationCard;
