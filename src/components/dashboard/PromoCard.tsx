import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const PromoCard: React.FC = () => {
  const theme = useTheme();

  const containerStyle = [
    styles.container,
    {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.outline,
    }
  ];

  const titleStyle = [styles.titleText, { color: theme.colors.onPrimaryContainer }];
  const descriptionStyle = [
    styles.descriptionText,
    styles.descriptionTextWithOpacity,
    { color: theme.colors.onPrimaryContainer }
  ];
  const buttonStyle = [
    styles.button,
    {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.outline
    }
  ];
  const buttonTextStyle = [styles.buttonText, { color: theme.colors.onPrimary }];

  return (
    <View style={containerStyle}>
      <Text style={titleStyle}>
        ¿Necesitas cambiar divisas?
      </Text>
      <Text style={descriptionStyle}>
        Usa nuestra calculadora integrada para conversiones exactas.
      </Text>
      <TouchableOpacity style={buttonStyle}>
        <Text style={buttonTextStyle}>Calculadora</Text>
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
    borderRadius: 24,
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
  descriptionTextWithOpacity: {
    opacity: 0.8,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default PromoCard;
