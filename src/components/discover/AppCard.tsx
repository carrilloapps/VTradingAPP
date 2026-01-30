import React, { useCallback } from 'react';
import { View, StyleSheet, Linking, Image } from 'react-native';
import { Text, useTheme, Surface, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SvgUri } from 'react-native-svg';

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
  const accentColor = app.color || (app.useTint ? theme.colors.primary : theme.colors.onSurface);

  const renderVisual = useCallback(() => {
    if (app.logoUri) {
      const isSvg = app.logoUri.trim().toLowerCase().endsWith('.svg');

      if (isSvg) {
        return (
          <SvgUri
            uri={app.logoUri}
            width={64}
            height={64}
            color={accentColor}
            fill={accentColor}
          />
        );
      }

      return (
        <Image
          source={{ uri: app.logoUri }}
          style={[styles.remoteLogo, app.useTint ? { tintColor: accentColor } : null]}
          resizeMode="contain"
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
      style={{ borderRadius: theme.roundness * 6 }}
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
          numberOfLines={2}
        >
          {app.name}
        </Text>
      </Surface>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 9, // Reduced from 10
  },
  remoteLogo: {
    width: 64,
    height: 64,
  },
});

export default AppCard;
