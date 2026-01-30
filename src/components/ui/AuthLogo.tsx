import React from 'react';
import { View, StyleSheet, Image, ViewStyle, ImageStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';

interface AuthLogoProps {
  size?: number;
  showBadge?: boolean;
  tintColor?: string;
  containerStyle?: ViewStyle;
}

const AuthLogo: React.FC<AuthLogoProps> = ({
  size = 80,
  showBadge = true,
  tintColor,
  containerStyle
}) => {
  const theme = useAppTheme();
  const resolvedTintColor = tintColor || (theme.dark ? undefined : '#212121');

  return (
    <View style={[styles.logoRow, containerStyle]}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={[
          styles.logo,
          { width: size, height: size, tintColor: resolvedTintColor || undefined }
        ] as ImageStyle[]}
      />
      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.warning,
              marginLeft: theme.spacing.m,
            }
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
