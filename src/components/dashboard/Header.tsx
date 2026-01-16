import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ImageStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface HeaderProps {
  userName: string;
  avatarUrl: string;
  notificationCount?: number;
}

const Header: React.FC<HeaderProps> = ({ userName, avatarUrl, notificationCount = 0 }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Custom theme colors fallback
  const accentGreen = (theme.colors as any).accentGreen || '#10B981';
  const accentRed = (theme.colors as any).accentRed || '#EF4444';

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.background,
      borderBottomColor: theme.colors.outline,
      paddingTop: insets.top + 10, // Add safe area + minimal padding
    }]}>
      <View style={styles.userInfo}>
        <TouchableOpacity style={styles.avatarContainer}>
          <Image 
            source={{ uri: avatarUrl }} 
            style={[styles.avatar as ImageStyle, styles.avatarBorder]} 
          />
          <View style={[styles.statusDot, { backgroundColor: accentGreen, borderColor: theme.colors.background }]} />
        </TouchableOpacity>
        
        <View style={styles.textContainer}>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>GLOBAL TRADING</Text>
          <Text variant="titleMedium" style={[{ color: theme.colors.onSurface }, styles.greetingText]}>
            Hola, {userName}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.iconButton, styles.iconButtonBackground, { 
          borderColor: theme.colors.outline
        }]}
      >
        <MaterialIcons name="notifications-none" size={22} color={theme.colors.onSurface} />
        {notificationCount > 0 && (
          <View style={[styles.badge, { backgroundColor: accentRed, borderColor: theme.colors.background }]} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  textContainer: {
    flexDirection: 'column',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  avatarBorder: {
    borderColor: 'rgba(255,255,255,0.1)',
  },
  greetingText: {
    fontWeight: 'bold',
  },
  iconButtonBackground: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  }
});

export default Header;
