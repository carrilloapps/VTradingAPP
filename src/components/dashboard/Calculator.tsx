import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, TextInput, Button } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Calculator: React.FC = () => {
  const theme = useTheme();
  const [amount, setAmount] = useState('1000');
  const [currency, setCurrency] = useState('USD');
  const rate = 350.50; // Example rate

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
            <MaterialIcons name="calculate" size={16} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>Calculadora Rápida</Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="more-horiz" size={20} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.outline }]}>
        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Monto a Invertir</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: 'transparent', color: theme.colors.onSurface }]}
            underlineColor="transparent"
            textColor={theme.colors.onSurface}
            contentStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
          />
        </View>
        <View style={[styles.currencyBadge, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.colors.outline }]}>
          <Text style={{ color: theme.colors.onSurface, fontWeight: '700' }}>USD</Text>
          <MaterialIcons name="keyboard-arrow-down" size={16} color={theme.colors.onSurfaceVariant} />
        </View>
      </View>

      <View style={styles.dividerContainer}>
        <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
        <View style={[styles.exchangeIcon, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]}>
          <MaterialIcons name="swap-vert" size={16} color={theme.colors.onSurfaceVariant} />
        </View>
      </View>

      <View style={styles.resultRow}>
        <Text style={[styles.resultLabel, { color: theme.colors.onSurfaceVariant }]}>Estimado en ARS</Text>
        <View style={styles.resultValueContainer}>
          <Text style={[styles.resultSymbol, { color: theme.colors.primary }]}>$</Text>
          <Text style={[styles.resultValue, { color: theme.colors.onSurface }]}>
            {(parseFloat(amount || '0') * rate).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      <View style={[styles.rateInfo, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
        <Text style={[styles.rateText, { color: theme.colors.primary }]}>
          Cotización actual: 1 USD = ${rate.toFixed(2)} ARS
        </Text>
      </View>

      <Button 
        mode="contained" 
        style={styles.button}
        buttonColor={theme.colors.primary}
        textColor="#ffffff"
      >
        Simular Operación
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 80, // Extra space for bottom tab
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputWrapper: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  input: {
    fontSize: 18,
    fontWeight: '700',
    height: 24,
    padding: 0,
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  dividerContainer: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
    marginVertical: 4,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  exchangeIcon: {
    position: 'absolute',
    alignSelf: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  resultValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  resultSymbol: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  rateInfo: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  rateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  button: {
    borderRadius: 8,
  }
});

export default Calculator;
