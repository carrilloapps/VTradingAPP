import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, TextInput, Button, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import CurrencyPickerModal from './CurrencyPickerModal';
import CurrencySelectorButton from './CurrencySelectorButton';
import { AppConfig } from '@/constants/AppConfig';
import { observabilityService } from '@/services/ObservabilityService';
import { CurrencyService, CurrencyRate } from '@/services/CurrencyService';
import { useToastStore } from '@/stores/toastStore';

const CurrencyConverter: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const showToast = useToastStore(state => state.showToast);

  // State
  const [rates, setRates] = useState<CurrencyRate[]>([]);

  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState<CurrencyRate | null>(null);

  const formatInput = (text: string) => {
    let cleanText = text;

    // If the last character is a dot, convert it to a comma (assume decimal intent)
    if (cleanText.endsWith('.')) {
      cleanText = cleanText.slice(0, -1) + ',';
    }

    // Remove all dots (thousand separators)
    cleanText = cleanText.replace(/\./g, '');

    // Remove all non-numeric characters except comma
    cleanText = cleanText.replace(/[^0-9,]/g, '');

    if (!cleanText) return '';

    // Handle multiple commas: keep only the first one
    const parts = cleanText.split(',');
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? parts.slice(1).join('') : undefined;

    // Strip leading zeros from integer part
    if (integerPart.length > 1 && integerPart.startsWith('0')) {
      integerPart = integerPart.replace(/^0+/, '');
    }
    if (integerPart === '') integerPart = '0';

    // Add thousand separators
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (decimalPart !== undefined) {
      // Limit to 2 decimal places
      decimalPart = decimalPart.substring(0, 2);
      return `${formattedInteger},${decimalPart}`;
    }

    return formattedInteger;
  };

  const handleAmountChange = (text: string) => {
    // Remove formatting characters to count real digits
    const numericOnly = text.replace(/[^0-9]/g, '');

    if (numericOnly.length > 9) {
      showToast(
        'Límite alcanzado. Para cálculos más complejos, utilice nuestra calculadora de divisas avanzada',
        {
          type: 'info',
          action: {
            label: 'Ir a Avanzada',
            onPress: () => navigation.navigate('AdvancedCalculator' as never),
          },
        },
      );
      return;
    }
    setAmount(formatInput(text));
  };

  const [toCurrency, setToCurrency] = useState<CurrencyRate | null>(null);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // const [history, setHistory] = useState<ConversionHistory[]>([]); // Unused

  // Load Rates and Sync Selection
  useEffect(() => {
    const unsubscribe = CurrencyService.subscribe(data => {
      setRates(data);
    });

    // Trigger initial fetch
    CurrencyService.getRates().catch(e => {
      observabilityService.captureError(e, {
        context: 'CurrencyConverter.loadRates',
        action: 'fetch_initial_rates',
      });
    });

    return () => unsubscribe();
  }, []); // Run once on mount

  // Filter available target rates based on business rules
  const availableToRates = useMemo(() => {
    if (!fromCurrency) return rates;
    return CurrencyService.getAvailableTargetRates(fromCurrency, rates);
  }, [fromCurrency, rates]);

  // Update selected currencies when rates change (to keep values fresh)
  useEffect(() => {
    if (rates.length > 0) {
      // Sync fromCurrency
      if (fromCurrency) {
        const updatedFrom = rates.find(r => r.code === fromCurrency.code);
        // Update if value changed or object reference is different (to ensure latest data)
        if (updatedFrom && updatedFrom !== fromCurrency) {
          setFromCurrency(updatedFrom);
        }
      } else {
        // Default: USD
        const usd = rates.find(r => r.code === 'USD');
        if (usd) setFromCurrency(usd);
      }

      // Sync toCurrency
      if (toCurrency) {
        const updatedTo = rates.find(r => r.code === toCurrency.code);

        // Validate if current toCurrency is still valid for new fromCurrency rules
        // (This part is tricky inside this effect because availableToRates depends on fromCurrency)
        // But strictly speaking, we just need to update the rate value here.
        // Validation logic should happen when fromCurrency changes.

        // Update if value changed or object reference is different
        if (updatedTo && updatedTo !== toCurrency) {
          setToCurrency(updatedTo);
        }
      } else {
        // Default: VES
        const ves = rates.find(r => r.code === AppConfig.BASE_CURRENCY);
        if (ves) setToCurrency(ves);
      }
    }
  }, [fromCurrency, rates, toCurrency]); // Only run when rates array changes

  // Validate ToCurrency when FromCurrency changes
  useEffect(() => {
    if (toCurrency && availableToRates.length > 0) {
      const isValid = availableToRates.find(r => r.code === toCurrency.code);
      if (!isValid) {
        // Reset to VES if available, otherwise first available
        const ves = availableToRates.find(r => r.code === 'VES' || r.code === 'Bs');
        setToCurrency(ves || availableToRates[0]);
      }
    }
  }, [availableToRates, fromCurrency, toCurrency]);

  // Conversion Logic
  const convertedValue = useMemo(() => {
    if (!fromCurrency || !toCurrency || !amount) return '0,00';

    // Parse formatted amount (remove dots, replace comma with dot)
    const rawAmount = amount.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(rawAmount);

    if (isNaN(val)) return '0,00';

    // Logic: Convert FROM -> VES -> TO
    // Important: rates are price in VES.
    // 1 USD = 36.5 VES (value = 36.5)
    // 1 EUR = 40.0 VES (value = 40.0)
    // To convert USD -> EUR:
    // USD amount * USD rate / EUR rate
    // 100 * 36.5 / 40.0 = 91.25 EUR
    const amountInVES = val * fromCurrency.value;
    const result = amountInVES / toCurrency.value;

    return result.toLocaleString(AppConfig.DEFAULT_LOCALE, {
      minimumFractionDigits: AppConfig.DECIMAL_PLACES,
      maximumFractionDigits: AppConfig.DECIMAL_PLACES,
    });
  }, [amount, fromCurrency, toCurrency]);

  const exchangeRate = useMemo(() => {
    if (!fromCurrency || !toCurrency) return '0.00';
    // Calculate rate: 1 FROM = X TO
    const rate = fromCurrency.value / toCurrency.value;
    return rate.toLocaleString(AppConfig.DEFAULT_LOCALE, {
      minimumFractionDigits: AppConfig.DECIMAL_PLACES,
      maximumFractionDigits: AppConfig.DECIMAL_PLACES,
    });
  }, [fromCurrency, toCurrency]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <View style={styles.container}>
      {/* Input Section */}

      {/* FROM */}
      <View style={styles.row}>
        <CurrencySelectorButton
          currencyCode={fromCurrency?.code || 'SEL'}
          iconName={fromCurrency?.iconName || 'currency-usd'}
          onPress={() => setShowFromPicker(true)}
          style={styles.zIndex10}
        />

        <TextInput
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
          style={[styles.input, { color: theme.colors.onSurface }]}
          underlineColor={theme.colors.onSurfaceVariant}
          activeUnderlineColor={theme.colors.primary}
          contentStyle={[styles.inputContent, { color: theme.colors.onSurface }]}
          placeholder="0"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          accessibilityLabel="Cantidad a convertir"
          cursorColor={theme.colors.primary}
        />
      </View>

      {/* SWAP & RATE */}
      <View style={styles.swapContainer}>
        <View style={styles.rateDisplay}>
          <Text
            variant="bodySmall"
            style={[styles.rateLabel, { color: theme.colors.onSurfaceVariant }]}
          >
            1 {fromCurrency?.code} ≈{' '}
            <Text style={[styles.rateText, { color: theme.colors.onSurface }]}>{exchangeRate}</Text>{' '}
            {toCurrency?.code}
          </Text>
        </View>
        <IconButton
          icon="swap-vertical"
          mode="contained"
          containerColor={theme.colors.elevation.level3}
          iconColor={theme.colors.onSurface}
          size={24}
          onPress={handleSwap}
          accessibilityLabel="Intercambiar monedas"
          style={[styles.swapButton, { borderColor: theme.colors.outline }]}
        />
      </View>

      {/* TO */}
      <View style={styles.row}>
        <CurrencySelectorButton
          currencyCode={toCurrency?.code || 'SEL'}
          iconName={toCurrency?.iconName || 'currency-usd'}
          onPress={() => setShowToPicker(true)}
        />

        <View style={[styles.resultContainer, styles.flex1]}>
          <Text
            variant="displaySmall"
            style={[styles.boldText, { color: theme.colors.onSurface }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {convertedValue}
          </Text>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={() => setAmount('')}
        disabled={!amount}
        style={[styles.calculateButton, { borderRadius: theme.roundness * 25 }]}
        contentStyle={styles.calculateButtonContent}
        labelStyle={styles.calculateButtonLabel}
        buttonColor={theme.colors.primary}
        textColor={theme.colors.onPrimary}
      >
        Limpiar
      </Button>

      <CurrencyPickerModal
        visible={showFromPicker}
        onDismiss={() => setShowFromPicker(false)}
        onSelect={setFromCurrency}
        selectedCurrencyCode={fromCurrency?.code || null}
        rates={rates}
        title="Seleccionar divisa"
      />

      <CurrencyPickerModal
        visible={showToPicker}
        onDismiss={() => setShowToPicker(false)}
        onSelect={setToCurrency}
        selectedCurrencyCode={toCurrency?.code || null}
        rates={availableToRates}
        title="Seleccionar divisa destino"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 120,
    justifyContent: 'space-between',
  },
  zIndex10: {
    zIndex: 10,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: 'transparent',
    textAlign: 'right',
  },
  swapContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  rateDisplay: {
    flex: 1,
  },
  swapButton: {
    borderWidth: 1,
  },
  inputContent: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  rateLabel: {
    fontWeight: '500',
  },
  rateText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  flex1: {
    flex: 1,
  },
  resultContainer: {
    alignItems: 'flex-end',
    paddingRight: 16,
    justifyContent: 'center',
  },

  calculateButton: {
    marginTop: 24,
    height: 56,
    justifyContent: 'center',
  },
  calculateButtonContent: {
    height: 56,
  },
  calculateButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconPlaceholder: {
    width: 28,
    height: 28,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default CurrencyConverter;
