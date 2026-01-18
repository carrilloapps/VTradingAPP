import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, TextInput, Button, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { CurrencyService, CurrencyRate } from '../../services/CurrencyService';
import { useToast } from '../../context/ToastContext';
import CurrencyPickerModal from './CurrencyPickerModal';
import CurrencySelectorButton from './CurrencySelectorButton';
import { AppConfig } from '../../constants/AppConfig';

const CurrencyConverter: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { showToast } = useToast();

  const themeStyles = React.useMemo(() => ({
    currencyButton: {
      backgroundColor: theme.colors.elevation.level2,
      borderRadius: theme.roundness * 6, // 24px
    },
    iconPlaceholder: {
      backgroundColor: theme.colors.elevation.level4,
      borderRadius: theme.roundness * 3.5, // 14px
    },
    textPrimary: {
      color: theme.colors.onSurface,
    },
    textSecondary: {
      color: theme.colors.onSurfaceVariant,
    },
    input: {
      color: theme.colors.onSurface,
      backgroundColor: 'transparent', 
      textAlign: 'right' as const,
    },
    inputContent: {
        color: theme.colors.onSurface,
        fontSize: 32, 
        fontWeight: 'bold' as const, 
        textAlign: 'right' as const
    },
    swapButton: {
        borderWidth: 1, 
        borderColor: theme.colors.outline
    },
    resultContainer: {
        flex: 1, 
        alignItems: 'flex-end' as const, 
        paddingRight: 16, 
        justifyContent: 'center' as const
    },
    calculateButton: {
        marginTop: 24, 
        borderRadius: theme.roundness * 25, // 100px (Circle)
        height: 56, 
        justifyContent: 'center' as const
    },
    calculateButtonContent: {
        height: 56
    },
    calculateButtonLabel: {
        fontSize: 18, 
        fontWeight: 'bold' as const
    },
    rateText: {
        color: theme.colors.onSurface, 
        fontWeight: 'bold' as const, 
        fontSize: 14
    },
    rateLabel: {
        color: theme.colors.onSurfaceVariant, 
        fontWeight: '500' as const
    },
    icon: {
        marginLeft: 4
    }
  }), [theme]);

  // State
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  // const [loading, setLoading] = useState(true); // Unused
  
  const [amount, setAmount] = useState('1');
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
              "Límite alcanzado. Para cálculos más complejos, utilice nuestra calculadora de divisas avanzada", 
              'info', 
              { 
                  label: 'Ir a Avanzada', 
                  onPress: () => navigation.navigate('AdvancedCalculator' as never) 
              }
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
    const unsubscribe = CurrencyService.subscribe((data) => {
      setRates(data);
    });

    // Trigger initial fetch
    CurrencyService.getRates().catch(err => console.error("Error initial fetch", err));

    return () => unsubscribe();
  }, []); // Run once on mount

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
  }, [rates]); // Only run when rates array changes

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

    return result.toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: AppConfig.DECIMAL_PLACES, maximumFractionDigits: AppConfig.DECIMAL_PLACES });
  }, [amount, fromCurrency, toCurrency]);

  const exchangeRate = useMemo(() => {
    if (!fromCurrency || !toCurrency) return '0.00';
    // Calculate rate: 1 FROM = X TO
    const rate = fromCurrency.value / toCurrency.value;
    return rate.toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: AppConfig.DECIMAL_PLACES, maximumFractionDigits: AppConfig.DECIMAL_PLACES });
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
                iconName={fromCurrency?.iconName || 'attach-money'}
                onPress={() => setShowFromPicker(true)}
                style={{zIndex: 10}}
            />
            
            <TextInput 
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                style={[styles.input, themeStyles.input]}
                underlineColor={theme.colors.onSurfaceVariant}
                activeUnderlineColor={theme.colors.primary}
                contentStyle={themeStyles.inputContent}
                placeholder="0"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                accessibilityLabel="Cantidad a convertir"
                cursorColor={theme.colors.primary}
            />
        </View>

        {/* SWAP & RATE */}
        <View style={styles.swapContainer}>
            <View style={styles.rateDisplay}>
                 <Text variant="bodySmall" style={themeStyles.rateLabel}>
                    1 {fromCurrency?.code} ≈ <Text style={themeStyles.rateText}>{exchangeRate}</Text> {toCurrency?.code}
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
                style={themeStyles.swapButton}
            />
        </View>

        {/* TO */}
        <View style={styles.row}>
            <CurrencySelectorButton 
                currencyCode={toCurrency?.code || 'SEL'}
                iconName={toCurrency?.iconName || 'attach-money'}
                onPress={() => setShowToPicker(true)}
            />
            
            <View style={themeStyles.resultContainer}>
                <Text 
                    variant="displaySmall" 
                    style={[styles.boldText, themeStyles.textPrimary]}
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
            onPress={() => { /* Optional: Calculate action or just visual feedback */ }} 
            style={themeStyles.calculateButton}
            contentStyle={themeStyles.calculateButtonContent}
            labelStyle={themeStyles.calculateButtonLabel}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
        >
            Calcular
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
          rates={rates}
          title="Seleccionar divisa"
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
    zIndex: 10,
  },
  input: {
    flex: 1,
    height: 50,
  },
  swapContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 12,
      paddingHorizontal: 4
  },
  rateDisplay: {
      flex: 1,
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
  }
});

export default CurrencyConverter;
