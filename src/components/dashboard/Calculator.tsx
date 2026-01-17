import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import CurrencyConverter from './CurrencyConverter';

const Calculator: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]}>
      <Text variant="titleMedium" style={{marginBottom: 16, fontWeight: 'bold', color: theme.colors.onSurface}}>
        Calculadora de Divisas
      </Text>
      <CurrencyConverter />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24, // More rounded corners to match modern UI
    padding: 20, // Slightly more padding
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 80,
  },
});

export default Calculator;
