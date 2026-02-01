import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { TouchableRipple, useTheme, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useNotifications } from '@/context/NotificationContext';

interface NotificationButtonProps {
  icon?: string;
  size?: number;
  color?: string;
  style?: any;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({
  icon = 'bell-outline',
  size = 22,
  color,
  style,
}) => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { unreadCount } = useNotifications();

  // Animation for badge
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 40,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [scaleAnim, unreadCount]);

  const handlePress = () => {
    navigation.navigate('Notifications');
  };

  const buttonBgColor = theme.colors.elevation.level1;
  const iconColor = color || theme.colors.onSurfaceVariant;
  const badgeColor = theme.colors.error;
  const borderColorValue = theme.dark ? 'transparent' : theme.colors.outline;
  const badgeBorderColor = theme.colors.background;

  return (
    <TouchableRipple
      testID="notification-button"
      onPress={handlePress}
      style={[
        styles.container,
        theme.dark ? styles.darkBorder : styles.lightBorder,
        {
          backgroundColor: buttonBgColor,
          borderColor: borderColorValue,
        },
        style,
      ]}
      borderless
      rippleColor="rgba(0, 0, 0, .1)"
      accessibilityRole="button"
      accessibilityLabel={`Notificaciones, ${unreadCount} ${unreadCount === 1 ? 'nueva' : 'nuevas'}`}
      accessibilityHint="Navega a la pantalla de notificaciones"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons name={icon} size={size} color={iconColor} />

        {unreadCount > 0 && (
          <Animated.View
            style={[
              styles.badge,
              {
                backgroundColor: badgeColor,
                borderColor: badgeBorderColor,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {unreadCount > 99 ? (
              <View style={styles.smallDot} />
            ) : (
              // Optional: Show number if needed, but the design often uses just a dot or small number
              // The UnifiedHeader used a simple dot. The prompt asks for "indicador visual (badge) que muestre el número".
              // So I should show the number.
              <Text style={[styles.badgeText, { color: theme.colors.onError }]}>{unreadCount}</Text>
            )}
          </Animated.View>
        )}
      </View>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden', // Ensures ripple stays inside
  },
  darkBorder: {},
  lightBorder: {},
  content: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4, // Adjusted for button size 40
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 3,
    zIndex: 10,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  smallDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
});

export default NotificationButton;
