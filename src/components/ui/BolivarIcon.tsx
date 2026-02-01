import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BolivarIconProps {
  size?: number;
  color?: string;
  style?: any;
}

export const BolivarIcon: React.FC<BolivarIconProps> = ({ size = 24, color, style }) => {
  return (
    <View
      style={[
        styles.container,
        styles.iconBorder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: color,
            fontSize: size * 0.55, // Adjust font size relative to container
          },
        ]}
      >
        Bs
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBorder: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    marginBottom: 1, // Visual correction for centering
  },
});
