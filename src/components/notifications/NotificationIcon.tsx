import React from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '@/theme';
import { BolivarIcon } from '@/components/ui/BolivarIcon';
import { NotificationData } from './NotificationCard';

interface NotificationIconProps {
  notification: NotificationData;
  size?: number;
}

export const getNotificationIconConfig = (
  notification: NotificationData,
  theme: any,
) => {
  const effectiveType = notification.type || 'system';

  switch (effectiveType) {
    case 'price_alert':
      return {
        name: 'cash-multiple',
        color:
          notification.trend === 'up'
            ? theme.colors.success
            : theme.colors.error,
        bgColor:
          notification.trend === 'up'
            ? theme.colors.successContainer
            : theme.colors.errorContainer,
        badge: notification.trend === 'up' ? 'trending-up' : 'trending-down',
        fallbackTitle: 'Alerta de precio',
      };
    case 'market_news':
      return {
        name: 'chart-line',
        color: theme.colors.primary,
        bgColor: theme.colors.primaryContainer,
        badge: null,
        fallbackTitle: 'Noticia del Mercado',
      };
    case 'system':
    default:
      // Try to infer from title if type is generic
      if (
        notification.title.toLowerCase().includes('bs') ||
        notification.title.toLowerCase().includes('bolivar')
      ) {
        return {
          name: 'Bs', // Special marker
          color: theme.colors.primary,
          bgColor: theme.colors.primaryContainer,
          badge: null,
          fallbackTitle: 'Notificación de Bolívar',
        };
      }
      if (notification.title.toLowerCase().includes('dolar')) {
        return {
          name: 'currency-usd',
          color: theme.colors.secondary,
          bgColor: theme.colors.secondaryContainer,
          badge: null,
          fallbackTitle: 'Notificación de Divisa',
        };
      }
      return {
        name: 'bell',
        color: theme.colors.onSurfaceVariant,
        bgColor: theme.colors.surfaceVariant,
        badge: null,
        fallbackTitle: 'Notificación',
      };
  }
};

const NotificationIcon: React.FC<NotificationIconProps> = ({
  notification,
  size = 24,
}) => {
  const theme = useAppTheme();
  const iconConfig = getNotificationIconConfig(notification, theme);

  return (
    <View
      style={[
        styles.iconContainer,
        {
          backgroundColor: iconConfig.bgColor,
          width: size * 2,
          height: size * 2,
        },
      ]}
    >
      {iconConfig.name === 'Bs' ? (
        <BolivarIcon color={iconConfig.color} size={size} />
      ) : (
        <MaterialCommunityIcons
          name={iconConfig.name}
          size={size}
          color={iconConfig.color}
        />
      )}
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
          <MaterialCommunityIcons
            name={iconConfig.badge}
            size={size * 0.5}
            color={theme.colors.surface}
          />
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
