import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Text, useTheme, TouchableRipple, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import NotificationButton from './NotificationButton';
import { md5 } from '../../utils/md5';

export type HeaderVariant = 'profile' | 'section' | 'simple';

interface UnifiedHeaderProps {
  variant?: HeaderVariant;
  title?: string;
  subtitle?: string;
  userName?: string;
  avatarUrl?: string | null;
  email?: string | null;
  isPremium?: boolean;
  notificationCount?: number;
  onActionPress?: () => void;
  onNotificationPress?: () => void;
  onBackPress?: () => void;
  onProfilePress?: () => void;
  rightActionIcon?: string;
  notificationIcon?: string;
  showNotification?: boolean;
  style?: ViewStyle;
}

const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  variant = 'section',
  title,
  subtitle,
  userName,
  avatarUrl,
  email,
  notificationCount: _notificationCount = 0,
  isPremium = false,
  onActionPress,
  onNotificationPress: _onNotificationPress,
  onBackPress,
  onProfilePress,
  rightActionIcon = 'refresh',
  notificationIcon = 'notifications',
  showNotification = true,
  style,
}) => {
  const theme = useTheme();
  const colors = theme.colors as any;
  const insets = useSafeAreaInsets();
  
  const [imageError, setImageError] = useState(false);

  // Reset error state when identity changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl, email]);
  
  // Custom theme colors fallback
  const accentGreen = colors.success;
  const accentRed = colors.error;

  const buttonBgColor = theme.colors.elevation.level1;

  const themeStyles = React.useMemo(() => ({
    container: {
      backgroundColor: theme.colors.background,
      borderBottomColor: theme.colors.outline,
      borderBottomWidth: 1,
    },
    avatar: {
      borderColor: theme.colors.outline,
      backgroundColor: 'transparent',
    },
    statusDot: {
      backgroundColor: accentGreen,
      borderColor: theme.colors.background,
    },
    subtitlePremium: {
      color: '#FFD700',
      fontWeight: 'bold' as const,
    },
    subtitleDefault: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: 'normal' as const,
    },
    greeting: {
      color: theme.colors.onSurface,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
    },
    subtitleText: {
      color: theme.colors.onSurfaceVariant,
    },
    simpleTitle: {
      color: theme.colors.onSurface,
    },
    iconButton: {
      backgroundColor: buttonBgColor,
      borderWidth: 1,
      borderColor: theme.dark ? 'transparent' : theme.colors.outline,
    },
    badge: {
      backgroundColor: accentRed,
      borderColor: theme.colors.background,
    }
  }), [theme, accentGreen, accentRed, buttonBgColor]);

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderAvatar = () => {
    // 1. If user has a photoURL (e.g. Google Sign In), use it.
    if (avatarUrl) {
      return (
        <Avatar.Image 
          size={44} 
          source={{ uri: avatarUrl }} 
          style={[styles.avatar as ViewStyle, themeStyles.avatar]}
        />
      );
    }

    // 2. If user has email, try Gravatar (unless it errored previously)
    if (email && !imageError) {
      const hash = md5(email.trim().toLowerCase());
      const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404`;
      return (
        <Avatar.Image 
          size={44} 
          source={{ uri: gravatarUrl }} 
          onError={() => setImageError(true)}
          style={[styles.avatar as ViewStyle, themeStyles.avatar]}
        />
      );
    }

    // 3. Fallback: Initials
    return (
      <Avatar.Text 
        size={44} 
        label={getInitials(userName || 'User')} 
        style={[styles.avatar as ViewStyle, { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.outline }]}
        color={theme.colors.onPrimaryContainer}
      />
    );
  };

  const renderProfileContent = () => (
    <TouchableOpacity onPress={onProfilePress} style={styles.userInfo} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        {renderAvatar()}
        <View style={[styles.statusDot, themeStyles.statusDot]} />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.subtitle, isPremium ? themeStyles.subtitlePremium : themeStyles.subtitleDefault]}>
          {isPremium ? 'PLAN PREMIUM' : 'PLAN GRATUITO'}
        </Text>
        <Text variant="titleMedium" style={[styles.greeting, themeStyles.greeting]}>
          Hola, {userName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSectionContent = () => (
    <View style={styles.textContainer}>
      <Text variant="headlineSmall" style={[styles.sectionTitle, themeStyles.sectionTitle]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitleText, themeStyles.subtitleText]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderSimpleContent = () => (
    <View style={[styles.textContainer, styles.simpleHeaderContainer]}>
       <Text variant="titleLarge" style={[styles.simpleTitle, themeStyles.simpleTitle]}>
          {title}
        </Text>
    </View>
  );

  return (
    <View style={[styles.container, themeStyles.container, { 
      paddingTop: insets.top + 10,
    }, style]}>
      
      {/* Left Content */}
      <View style={styles.leftContent}>
        {onBackPress && (
          <TouchableRipple
            onPress={onBackPress}
            style={[styles.iconButton, themeStyles.iconButton, { marginRight: 8 }]}
            borderless
            rippleColor="rgba(0, 0, 0, .1)"
          >
            <MaterialIcons name="arrow-back" size={22} color={theme.colors.onSurface} />
          </TouchableRipple>
        )}
        {variant === 'profile' && renderProfileContent()}
        {variant === 'section' && renderSectionContent()}
        {variant === 'simple' && renderSimpleContent()}
      </View>

      {/* Right Content (Actions) */}
      {(variant !== 'simple' || onActionPress || showNotification) && (
        <View style={styles.rightContent}>
          {onActionPress && (
            <TouchableRipple 
              onPress={onActionPress} 
              style={[styles.iconButton, themeStyles.iconButton]}
              borderless
              rippleColor="rgba(0, 0, 0, .1)"
            >
              <MaterialIcons name={rightActionIcon} size={22} color={theme.colors.onSurfaceVariant} />
            </TouchableRipple>
          )}

          {showNotification && (
            <NotificationButton 
              icon={notificationIcon}
            />
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
    justifyContent: 'center',
  },
  simpleTitle: {
    fontWeight: '800',
  },
});

export default UnifiedHeader;
