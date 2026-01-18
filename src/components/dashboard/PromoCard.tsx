import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const PromoCard: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.primaryContainer, 
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness * 6,
    }]}>
      <Text style={[styles.titleText, { color: theme.colors.onPrimaryContainer }]}>
        ¿Necesitas cambiar divisas?
      </Text>
      <Text style={[styles.descriptionText, { color: theme.colors.onPrimaryContainer, opacity: 0.8 }]}>
        Usa nuestra calculadora integrada para conversiones exactas.
      </Text>
      <TouchableOpacity style={[styles.button, { 
        backgroundColor: theme.colors.primary,
        borderRadius: theme.roundness * 3,
        borderColor: theme.colors.outline 
      }]}>
        <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Calculadora</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default PromoCard;
