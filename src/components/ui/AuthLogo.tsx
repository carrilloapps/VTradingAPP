import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import FastImage from 'react-native-fast-image';

import { useAppTheme } from '@/theme';

interface AuthLogoProps {
  size?: number;
  showBadge?: boolean;
  tintColor?: string;
  containerStyle?: ViewStyle;
}

const AuthLogo: React.FC<AuthLogoProps> = ({
  size = 80,
  showBadge = true,
  containerStyle,
}) => {
  const theme = useAppTheme();
  const isDark = theme.dark;

  return (
    <View style={[styles.logoRow, containerStyle]}>
      <FastImage
        source={isDark ? require('../../assets/images/logo.png') : require('../../assets/images/logo-white.png')}
        tintColor={isDark ? '#FFFFFF' : '#212121'}
        resizeMode="contain"
        style={[
          styles.logo,
          {
            width: size,
            height: size,
          } as any,
        ]}
      />
      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.warning,
              marginLeft: theme.spacing.m,
            },
          ]}
          accessibilityLabel="BETA"
        >
          <Text
            variant="labelSmall"
            style={[styles.badgeText, { color: theme.colors.warning }]}
          >
            BETA
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    resizeMode: 'contain',
  },
  badge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default AuthLogo;
