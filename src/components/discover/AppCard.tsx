import React, { useCallback } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Text, useTheme, Surface, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SvgUri } from 'react-native-svg';
import FastImage from 'react-native-fast-image';

export interface RecommendedApp {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  url?: string;
  logoUri?: string;
  useTint?: boolean;
  description?: string;
}

interface AppCardProps {
  app: RecommendedApp;
  onPress?: (app: RecommendedApp) => void;
}

const AppCard: React.FC<AppCardProps> = ({ app, onPress }) => {
  const theme = useTheme();
  const accentColor =
    app.color || (app.useTint ? theme.colors.primary : theme.colors.onSurface);

  const renderVisual = useCallback(() => {
    if (app.logoUri) {
      const isSvg = app.logoUri.trim().toLowerCase().endsWith('.svg');

      if (isSvg) {
        return (
          <SvgUri
            uri={app.logoUri}
            width={54}
            height={54}
            color={accentColor}
            fill={accentColor}
          />
        );
      }

      return (
        <FastImage
          source={{ uri: app.logoUri }}
          style={[
            styles.remoteLogo,
            app.useTint && ({ tintColor: accentColor } as any),
          ]}
          resizeMode={FastImage.resizeMode.contain}
        />
      );
    }

    return (
      <MaterialCommunityIcons
        name={app.icon || 'star-outline'}
        size={32}
        color={accentColor}
      />
    );
  }, [accentColor, app.icon, app.logoUri, app.useTint]);

  const handlePress = () => {
    if (onPress) {
      onPress(app);
    } else if (app.url) {
      Linking.openURL(app.url);
    }
  };

  return (
    <TouchableRipple
      onPress={handlePress}
      style={[styles.ripple, { borderRadius: theme.roundness * 3 }]}
      borderless
      accessibilityRole="button"
      accessibilityLabel={`App ${app.name}`}
    >
      <Surface
        elevation={0}
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outline,
            borderRadius: theme.roundness * 6,
          },
        ]}
      >
        <View style={styles.iconContainer}>{renderVisual()}</View>
        <Text
          variant="labelSmall"
          style={[styles.name, { color: theme.colors.onSurface }]}
          numberOfLines={1}
        >
          {app.name}
        </Text>
      </Surface>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  ripple: {},
  container: {
    flex: 1,
    aspectRatio: 1,
    padding: 8, // Reduced from 16
    borderWidth: 1,
    elevation: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64, // Reduced from 48
    height: 32,
    marginBottom: 4, // Reduced from 8
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  name: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 10, // Reduced from 10
    marginTop: 4, // Reduced from 8
  },
  remoteLogo: {
    width: 54,
    height: 54,
  },
});

export default AppCard;
