import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface BolivarIconProps {
  size?: number;
  color?: string;
  style?: any;
}

export const BolivarIcon: React.FC<BolivarIconProps> = ({ size = 24, color, style }) => {
  return (
    <Text
      style={[
        styles.text,
        {
          color: color,
          fontSize: size * 0.9, // Adjust font size relative to size
        },
        style,
      ]}
    >
      Bs
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
