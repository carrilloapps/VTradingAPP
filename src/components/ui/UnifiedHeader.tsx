import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ImageStyle, ViewStyle } from 'react-native';
import { Text, useTheme, TouchableRipple } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export type HeaderVariant = 'profile' | 'section' | 'simple';

interface UnifiedHeaderProps {
  variant?: HeaderVariant;
  title?: string;
  subtitle?: string;
  userName?: string;
  avatarUrl?: string;
  notificationCount?: number;
  onActionPress?: () => void;
  onNotificationPress?: () => void;
  rightActionIcon?: string;
  showNotification?: boolean;
  style?: ViewStyle;
}

const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  variant = 'section',
  title,
  subtitle,
  userName,
  avatarUrl,
  notificationCount = 0,
  onActionPress,
  onNotificationPress,
  rightActionIcon = 'refresh',
  showNotification = true,
  style,
}) => {
  const theme = useTheme();
  const colors = theme.colors as any;
  const insets = useSafeAreaInsets();
  
  // Custom theme colors fallback
  const accentGreen = colors.success;
  const accentRed = colors.error;

  const buttonBgColor = theme.colors.elevation.level1;

  const renderProfileContent = () => (
    <View style={styles.userInfo}>
      <TouchableOpacity style={styles.avatarContainer}>
        <Image 
          source={{ uri: avatarUrl }} 
          style={[styles.avatar as ImageStyle, { borderColor: theme.colors.outline }]} 
        />
        <View style={[styles.statusDot, { backgroundColor: accentGreen, borderColor: theme.colors.background }]} />
      </TouchableOpacity>
      
      <View style={styles.textContainer}>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>GLOBAL TRADING</Text>
        <Text variant="titleMedium" style={[styles.greeting, { color: theme.colors.onSurface }]}>
          Hola, {userName}
        </Text>
      </View>
    </View>
  );

  const renderSectionContent = () => (
    <View style={styles.textContainer}>
      <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitleText, { color: theme.colors.onSurfaceVariant }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderSimpleContent = () => (
    <View style={[styles.textContainer, styles.simpleHeaderContainer]}>
       <Text variant="titleLarge" style={[styles.simpleTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
    </View>
  );

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.background,
      borderBottomColor: theme.colors.outline,
      paddingTop: insets.top + 10,
    }, style]}>
      
      {/* Left Content */}
      <View style={styles.leftContent}>
        {variant === 'profile' && renderProfileContent()}
        {variant === 'section' && renderSectionContent()}
        {variant === 'simple' && renderSimpleContent()}
      </View>

      {/* Right Content (Actions) */}
      {variant !== 'simple' && (
        <View style={styles.rightContent}>
          {onActionPress && (
            <TouchableRipple 
              onPress={onActionPress} 
              style={[styles.iconButton, { backgroundColor: buttonBgColor }]}
              borderless
              rippleColor="rgba(0, 0, 0, .1)"
            >
              <MaterialIcons name={rightActionIcon} size={22} color={theme.colors.onSurfaceVariant} />
            </TouchableRipple>
          )}

          {showNotification && (
            <TouchableRipple 
              onPress={onNotificationPress || (() => {})} 
              style={[styles.iconButton, { backgroundColor: buttonBgColor }]}
              borderless
              rippleColor="rgba(0, 0, 0, .1)"
            >
              <View>
                <MaterialIcons name="notifications" size={22} color={theme.colors.onSurfaceVariant} />
                {notificationCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: accentRed, borderColor: theme.colors.background }]} />
                )}
              </View>
            </TouchableRipple>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    // Border is handled by borderBottomColor + borderWidth usually 0 or 1 depending on context, 
    // but here we can default to 0 and let parent or style prop override, 
    // OR default to 1 for consistency.
    borderBottomWidth: 1, 
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  greeting: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  simpleHeaderContainer: {
    alignItems: 'center',
    width: '100%',
  },
  simpleTitle: {
    fontWeight: '800',
    textAlign: 'center',
  },
});

export default UnifiedHeader;
