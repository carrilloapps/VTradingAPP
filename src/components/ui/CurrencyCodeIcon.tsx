import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface CurrencyCodeIconProps {
  code: string;
  size?: number;
  color?: string;
  style?: any;
}

/**
 * CurrencyCodeIcon - Displays currency code (e.g., S./, COP, PEN, CLP, ARS) as text
 * Similar to BolivarIcon but for generic currency codes
 */
export const CurrencyCodeIcon: React.FC<CurrencyCodeIconProps> = ({
  code,
  size = 24,
  color,
  style,
}) => {
  // Adjust font size based on code length
  const getFontSize = () => {
    if (code.length <= 2) return size * 0.85;
    if (code.length === 3) return size * 0.75;
    return size * 0.65;
  };

  return (
    <Text
      style={[
        styles.text,
        {
          color: color,
          fontSize: getFontSize(),
        },
        style,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {code}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
