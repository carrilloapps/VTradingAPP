import React from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAppTheme } from '../../theme/theme';
import { NotificationData } from './NotificationCard';

interface NotificationIconProps {
  notification: NotificationData;
  size?: number;
}

export const getNotificationIconConfig = (notification: NotificationData, theme: any) => {
  const effectiveType = notification.type || 'system';
  
  switch (effectiveType) {
    case 'price_alert':
      return {
        name: 'payments',
        color: notification.trend === 'up' ? theme.colors.success : theme.colors.error,
        bgColor: notification.trend === 'up' ? theme.colors.successContainer : theme.colors.errorContainer,
        badge: notification.trend === 'up' ? 'trending-up' : 'trending-down',
        fallbackTitle: 'Alerta de Precio',
      };
    case 'market_news':
      return {
        name: 'show-chart',
        color: theme.colors.primary,
        bgColor: theme.colors.primaryContainer,
        badge: null,
        fallbackTitle: 'Noticia del Mercado',
      };
    case 'system':
    default:
      // Try to infer from title if type is generic
      if (notification.title.toLowerCase().includes('dolar') || notification.title.toLowerCase().includes('bs')) {
           return {
              name: 'attach-money',
              color: theme.colors.secondary,
              bgColor: theme.colors.secondaryContainer,
              badge: null,
              fallbackTitle: 'Notificación de Divisa',
           };
      }
      return {
        name: 'notifications',
        color: theme.colors.onSurfaceVariant,
        bgColor: theme.colors.surfaceVariant,
        badge: null,
        fallbackTitle: 'Notificación',
      };
  }
};

const NotificationIcon: React.FC<NotificationIconProps> = ({ notification, size = 24 }) => {
  const theme = useAppTheme();
  const iconConfig = getNotificationIconConfig(notification, theme);

  return (
    <View style={[styles.iconContainer, { backgroundColor: iconConfig.bgColor, width: size * 2, height: size * 2 }]}>
      <MaterialIcons name={iconConfig.name} size={size} color={iconConfig.color} />
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
          <MaterialIcons name={iconConfig.badge} size={size * 0.5} color={theme.colors.surface} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
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
});

export default NotificationIcon;
