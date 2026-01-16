import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const PromoCard: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.primaryContainer, // primary/5 or primary/10 approx
      borderColor: 'rgba(59, 130, 246, 0.1)',
    }]}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>
        ¿Necesitas cambiar divisas?
      </Text>
      <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
        Usa nuestra calculadora integrada para conversiones exactas.
      </Text>
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.buttonText}>Calculadora</Text>
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
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default PromoCard;
