import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Text, useTheme, TouchableRipple } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import ProfileInfo from './header/ProfileInfo';
import HeaderActions from './header/HeaderActions';
import { AppConfig } from '@/constants/AppConfig';
import { useAuthStore } from '@/stores/authStore';

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
  onActionLongPress?: () => void;
  onSecondaryActionPress?: () => void;
  onNotificationPress?: () => void;
  onBackPress?: () => void;
  onProfilePress?: () => void;
  rightActionIcon?: string;
  secondaryActionIcon?: string;
  notificationIcon?: string;
  subtitleIcon?: string;
  subtitleIconColor?: string;
  showNotification?: boolean;
  showSecondaryAction?: boolean;
  showAd?: boolean;
  hideDivider?: boolean;
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
  isPremium,
  onActionPress,
  onActionLongPress,
  onSecondaryActionPress,
  onNotificationPress: _onNotificationPress,
  onBackPress,
  onProfilePress,
  rightActionIcon = 'refresh',
  secondaryActionIcon = 'share-variant',
  notificationIcon = 'bell-outline',
  subtitleIcon,
  subtitleIconColor,
  showNotification = true,
  showSecondaryAction = false,
  showAd = true,
  hideDivider = false,
  style,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(state => state.user);
  const resolvedIsPremium = typeof isPremium === 'boolean' ? isPremium : !!user; // Logueado = Premium
  const adUnitId =
    Platform.OS === 'ios' ? AppConfig.ADMOB_BANNER_ID_IOS : AppConfig.ADMOB_BANNER_ID_ANDROID;
  // Use TestIds.BANNER in dev, or real ID in prod (if configured)
  const bannerId = __DEV__ ? TestIds.BANNER : adUnitId;
  const shouldShowAd = showAd && !resolvedIsPremium && !!bannerId;

  const themeStyles = React.useMemo(
    () => ({
      container: {
        backgroundColor: theme.colors.background,
        borderBottomColor: theme.colors.outline,
        borderBottomWidth: hideDivider ? 0 : 1,
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
        backgroundColor: theme.colors.elevation.level1,
        borderWidth: 1,
        borderColor: theme.dark ? 'transparent' : theme.colors.outline,
      },
      adContainer: {
        backgroundColor: theme.colors.background,
        borderBottomColor: theme.colors.outline,
      },
    }),
    [theme, hideDivider],
  );

  const renderSectionContent = () => (
    <View style={styles.textContainer} accessibilityRole="header">
      <Text variant="headlineSmall" style={[styles.sectionTitle, themeStyles.sectionTitle]}>
        {title}
      </Text>
      {subtitle && (
        <View style={styles.subtitleContainer}>
          {subtitleIcon && (
            <MaterialCommunityIcons
              name={subtitleIcon}
              size={14}
              color={subtitleIconColor || theme.colors.onSurfaceVariant}
              style={styles.subtitleIcon}
            />
          )}
          <Text
            style={[
              styles.subtitleText,
              themeStyles.subtitleText,
              subtitleIcon && styles.noMarginTop,
            ]}
          >
            {subtitle}
          </Text>
        </View>
      )}
    </View>
  );

  const renderSimpleContent = () => (
    <View style={[styles.textContainer, styles.simpleHeaderContainer]} accessibilityRole="header">
      <Text variant="titleLarge" style={[styles.simpleTitle, themeStyles.simpleTitle]}>
        {title}
      </Text>
    </View>
  );

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.container,
          themeStyles.container,
          {
            paddingTop: insets.top + (styles.headerPadding.paddingTop as number),
          },
        ]}
      >
        <View style={styles.leftContent}>
          {onBackPress && (
            <TouchableRipple
              onPress={onBackPress}
              style={[styles.iconButton, themeStyles.iconButton, styles.backButton]}
              borderless
              rippleColor="rgba(0, 0, 0, .1)"
              accessibilityRole="button"
              accessibilityLabel="Regresar"
              accessibilityHint="Volver a la pantalla anterior"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.onSurface} />
            </TouchableRipple>
          )}

          {variant === 'profile' && (
            <ProfileInfo
              onProfilePress={onProfilePress}
              userName={userName}
              avatarUrl={avatarUrl}
              email={email}
              isPremium={resolvedIsPremium}
            />
          )}
          {variant === 'section' && renderSectionContent()}
          {variant === 'simple' && renderSimpleContent()}
        </View>

        {(variant !== 'simple' || onActionPress || showNotification) && (
          <HeaderActions
            onActionPress={onActionPress}
            onActionLongPress={onActionLongPress}
            onSecondaryActionPress={onSecondaryActionPress}
            rightActionIcon={rightActionIcon}
            secondaryActionIcon={secondaryActionIcon}
            notificationIcon={notificationIcon}
            showNotification={showNotification}
            showSecondaryAction={showSecondaryAction}
          />
        )}
      </View>
      {shouldShowAd && (
        <View style={[styles.adContainer, themeStyles.adContainer]}>
          <BannerAd unitId={bannerId} size={BannerAdSize.BANNER} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerPadding: {
    paddingTop: 10,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'column',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backButton: {
    marginRight: 8,
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
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subtitleIcon: {
    marginRight: 4,
  },
  noMarginTop: {
    marginTop: 0,
  },
  adContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
});

export default React.memo(UnifiedHeader);
