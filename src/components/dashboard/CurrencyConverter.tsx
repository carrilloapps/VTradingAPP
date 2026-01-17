import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, TextInput, Button, IconButton } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { CurrencyService, CurrencyRate } from '../../services/CurrencyService';
import { useToast } from '../../context/ToastContext';
import CurrencyPickerModal from './CurrencyPickerModal';

interface ConversionHistory {
  id: string;
  fromCode: string;
  toCode: string;
  fromAmount: string;
  toAmount: string;
  date: Date;
}

const CurrencyConverter: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors as any;
  const navigation = useNavigation();
  const { showToast } = useToast();

  // State
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  
  const [history, setHistory] = useState<ConversionHistory[]>([]);

  // Load Rates
  useEffect(() => {
    const unsubscribe = CurrencyService.subscribe((data) => {
      setRates(data);
      setLoading(false);

      // Set defaults if not set
      if (!fromCurrency && data.length > 0) {
          const usd = data.find(r => r.code === 'USD');
          if (usd) setFromCurrency(usd);
      }
      if (!toCurrency && data.length > 0) {
          const ves = data.find(r => r.code === 'VES');
          if (ves) setToCurrency(ves);
      }
    });

    // Trigger initial fetch
    CurrencyService.getRates().catch(err => console.error("Error initial fetch", err));

    return () => unsubscribe();
  }, []); // Run once on mount

  // Conversion Logic
  const convertedValue = useMemo(() => {
    if (!fromCurrency || !toCurrency || !amount) return '0,00';
    
    // Parse formatted amount (remove dots, replace comma with dot)
    const rawAmount = amount.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(rawAmount);
    
    if (isNaN(val)) return '0,00';

    // Logic: Convert FROM -> VES -> TO
    const amountInVES = val * fromCurrency.value;
    const result = amountInVES / toCurrency.value;

    return result.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }, [amount, fromCurrency, toCurrency]);

  const exchangeRate = useMemo(() => {
    if (!fromCurrency || !toCurrency) return '0.00';
    const rate = fromCurrency.value / toCurrency.value;
    return rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }, [fromCurrency, toCurrency]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
        <Button 
            icon="calculator" 
            mode="text" 
            compact
            onPress={() => navigation.navigate('AdvancedCalculator' as never)}
            textColor={theme.colors.primary}
            labelStyle={{ fontWeight: 'bold' }}
        >
            Ampliar
        </Button>
      </View>

      {/* Input Section */}
        
        {/* FROM */}
        <View style={styles.row}>
            <TouchableOpacity 
                style={[styles.currencyButton, { backgroundColor: theme.colors.elevation.level2 }]}
                onPress={() => { setShowFromPicker(true); }}
            >
                {fromCurrency && (
                    <View style={[styles.iconPlaceholder, { width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: theme.colors.elevation.level4 }]}>
                        <MaterialIcons name={fromCurrency.iconName || 'attach-money'} size={18} color={theme.colors.onSurface} />
                    </View>
                )}
                <Text variant="titleMedium" style={{fontWeight: 'bold', color: theme.colors.onSurface}}>{fromCurrency?.code || 'SEL'}</Text>
                <MaterialIcons name="keyboard-arrow-down" size={24} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            
            <TextInput 
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: 'transparent', textAlign: 'right' }]}
                underlineColor={theme.colors.onSurfaceVariant}
                activeUnderlineColor={theme.colors.primary}
                contentStyle={{ fontSize: 32, fontWeight: 'bold', color: theme.colors.onSurface, textAlign: 'right' }}
                placeholder="0"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                accessibilityLabel="Cantidad a convertir"
                cursorColor={theme.colors.primary}
            />
        </View>

        {/* SWAP & RATE */}
        <View style={styles.swapContainer}>
            <View style={styles.rateDisplay}>
                 <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, fontWeight: '500'}}>
                    1 {fromCurrency?.code} ≈ <Text style={{color: theme.colors.onSurface, fontWeight: 'bold', fontSize: 14}}>{exchangeRate}</Text> {toCurrency?.code}
                 </Text>
            </View>
            <IconButton 
                icon="swap-vertical" 
                mode="contained" 
                containerColor={theme.colors.elevation.level3} 
                iconColor="#ffffff"
                size={24}
                onPress={handleSwap}
                accessibilityLabel="Intercambiar monedas"
                style={{ borderWidth: 1, borderColor: theme.colors.outline }}
            />
        </View>

        {/* TO */}
        <View style={styles.row}>
            <TouchableOpacity 
                style={[styles.currencyButton, { backgroundColor: theme.colors.elevation.level2 }]}
                onPress={() => { setShowToPicker(true); }}
                accessibilityLabel={`Seleccionar moneda de destino. Valor actual: ${toCurrency?.code || 'No seleccionada'}`}
                accessibilityRole="button"
            >
                {toCurrency && (
                    <View style={[styles.iconPlaceholder, { width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: theme.colors.elevation.level4 }]}>
                        <MaterialIcons name={toCurrency.iconName || 'attach-money'} size={18} color={theme.colors.onSurface} />
                    </View>
                )}
                <Text variant="titleMedium" style={{fontWeight: 'bold', color: theme.colors.onSurface}}>{toCurrency?.code || 'SEL'}</Text>
                <MaterialIcons name="keyboard-arrow-down" size={24} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            
            <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: 16, justifyContent: 'center' }}>
                <Text 
                    variant="displaySmall" 
                    style={{fontWeight: 'bold', color: theme.colors.onSurface}}
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
            style={{marginTop: 24, borderRadius: 100, height: 56, justifyContent: 'center'}}
            contentStyle={{ height: 56 }}
            labelStyle={{ fontSize: 18, fontWeight: 'bold' }}
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
    borderRadius: 24, // Pill shape
    minWidth: 120,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
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
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
  },
});

export default CurrencyConverter;
