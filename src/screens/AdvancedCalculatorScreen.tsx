import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, TextInput as RNTextInput, StatusBar, Platform, Keyboard, RefreshControl } from 'react-native';
import { Text, useTheme, Button, IconButton, Appbar, TouchableRipple } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import { useToast } from '../context/ToastContext';
import CurrencyPickerModal from '../components/dashboard/CurrencyPickerModal';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import MarketStatus from '../components/dashboard/MarketStatus';

// --- Components ---
const KeypadButton = ({ label, icon, onPress, theme, isAction = false, isDestructive = false, testID }: { label?: string, icon?: string, onPress: () => void, theme: any, isAction?: boolean, isDestructive?: boolean, testID?: string }) => {
    const getBackgroundColor = () => {
        if (isDestructive) return theme.colors.errorContainer;
        if (isAction) return theme.colors.secondaryContainer;
        return undefined;
    };

    const getContentColor = () => {
        if (isDestructive) return theme.colors.error;
        if (isAction) return theme.colors.onSecondaryContainer;
        return theme.colors.onSurface;
    };

    return (
    <TouchableRipple 
        style={[
            styles.keypadButton, 
            { backgroundColor: getBackgroundColor() }
        ]}
        onPress={onPress}
        rippleColor={isDestructive ? theme.colors.error : theme.colors.onSurfaceVariant}
        borderless={true}
        testID={testID}
    >
        <View style={styles.centerContent}>
            {icon ? (
                <MaterialIcons name={icon} size={28} color={getContentColor()} />
            ) : (
                <Text style={[
                    styles.keypadText, 
                    { color: getContentColor() }
                ]}>{label}</Text>
            )}
        </View>
    </TouchableRipple>
)};

const Keypad = ({ onKeyPress, onDelete, theme }: { onKeyPress: (key: string) => void, onDelete: () => void, theme: any }) => {
    return (
        <View style={[styles.keypadContainer, { backgroundColor: theme.colors.elevation.level1 }]}>
            <View style={styles.keypadRow}>
                <KeypadButton label="7" onPress={() => onKeyPress('7')} theme={theme} />
                <KeypadButton label="8" onPress={() => onKeyPress('8')} theme={theme} />
                <KeypadButton label="9" onPress={() => onKeyPress('9')} theme={theme} />
            </View>
            <View style={styles.keypadRow}>
                <KeypadButton label="4" onPress={() => onKeyPress('4')} theme={theme} />
                <KeypadButton label="5" onPress={() => onKeyPress('5')} theme={theme} />
                <KeypadButton label="6" onPress={() => onKeyPress('6')} theme={theme} />
            </View>
            <View style={styles.keypadRow}>
                <KeypadButton label="1" onPress={() => onKeyPress('1')} theme={theme} />
                <KeypadButton label="2" onPress={() => onKeyPress('2')} theme={theme} />
                <KeypadButton label="3" onPress={() => onKeyPress('3')} theme={theme} />
            </View>
            <View style={styles.keypadRow}>
                <KeypadButton label="," onPress={() => onKeyPress(',')} theme={theme} />
                <KeypadButton label="0" onPress={() => onKeyPress('0')} theme={theme} />
                <KeypadButton icon="backspace" onPress={onDelete} theme={theme} isDestructive testID="btn-backspace" />
            </View>
        </View>
    );
};

// --- Types ---
interface CurrencyRow {
  code: string;
  value: number;
}

const AdvancedCalculatorScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { showToast } = useToast();

  // --- State ---
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Base Currency State
  const [baseCurrencyCode, setBaseCurrencyCode] = useState('USD');
  const [baseAmount, setBaseAmount] = useState('1'); 
  
  // Target Currencies List (Codes)
  const [targetCodes, setTargetCodes] = useState<string[]>(['VES', 'EUR', 'USDT', 'BTC', 'COP']);
  
  // Picker State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'base' | 'add'>('base');

  // Input State
  const [isInputFocused, setIsInputFocused] = useState(false);

  // --- Data Loading ---
  useEffect(() => {
    const unsubscribe = CurrencyService.subscribe((data) => {
      setRates(data);
      setLoading(false);
    });
    CurrencyService.getRates().catch(console.error);
    return () => unsubscribe();
  }, []);

  // --- Derived Data ---
  const baseCurrency = useMemo(() => 
    rates.find(r => r.code === baseCurrencyCode) || { code: 'USD', value: 1, name: 'Dollar' } as CurrencyRate
  , [rates, baseCurrencyCode]);

  const getSourceLabel = (code: string) => {
    if (code === 'USDT') return 'Binance P2P';
    if (['USD', 'EUR', 'CNY', 'RUB', 'TRY'].includes(code)) return 'Tasa oficial BCV';
    if (code === 'VES') return 'Banco Central de Venezuela';
    return 'Tasa de Mercado';
  };

  const targetRows = useMemo(() => {
    const amountVal = parseFloat(baseAmount.replace(/\./g, '').replace(',', '.')) || 0;
    
    return targetCodes.map(code => {
      const rateObj = rates.find(r => r.code === code);
      if (!rateObj) return null;

      const amountInUSD = amountVal / baseCurrency.value; 
      const targetValue = amountInUSD * rateObj.value;

      return {
        code,
        value: targetValue,
        name: rateObj.name,
        rateObj
      };
    }).filter(Boolean) as (CurrencyRow & { name: string, rateObj: CurrencyRate })[];
  }, [baseAmount, baseCurrency, targetCodes, rates]);

  // --- Handlers ---
  const formatInput = (text: string) => {
    let cleanText = text;
    // Prevent multiple commas
    if ((cleanText.match(/,/g) || []).length > 1) {
        return baseAmount;
    }
    
    // Replace dots with empty string (thousands separator removal for processing)
    // But first, replace comma with dot for validation
    
    // Allow valid chars only
    cleanText = cleanText.replace(/[^0-9,]/g, '');

    // Handle empty
    if (cleanText === '') return '';

    const parts = cleanText.split(',');
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? parts.slice(1).join('') : undefined;

    // Remove leading zeros
    if (integerPart.length > 1 && integerPart.startsWith('0')) {
        integerPart = integerPart.replace(/^0+/, '');
    }
    if (integerPart === '') integerPart = '0';
    
    // Add thousands separators
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    if (decimalPart !== undefined) {
         return `${formattedInteger},${decimalPart}`; 
    }
    return formattedInteger;
  };

  const handleBaseAmountChange = (text: string) => {
      setBaseAmount(formatInput(text));
  };

  // Keypad Handlers
  const handleKeyPress = (key: string) => {
      // Logic to append key to current amount
      // We need to handle the formatted string
      // Easiest way: get raw value, append, reformat
      
      let current = baseAmount;
      
      // Count actual digits (excluding formatting) to enforce limit
      const digitCount = current.replace(/[^0-9]/g, '').length;
      if (digitCount >= 15 && key !== ',') {
          showToast('Límite de 15 dígitos alcanzado', 'info');
          return;
      }

      if (current === '0' && key !== ',') current = ''; // Replace initial 0
      
      const nextText = current + key;
      
      // Let's test comma
      if (key === ',') {
          if (current.includes(',')) return; // Already has comma
          setBaseAmount(current + ',');
          return;
      }
      
      setBaseAmount(formatInput(nextText));
  };

  const handleDelete = () => {
      if (baseAmount.length <= 1) {
          setBaseAmount('0');
          return;
      }
      // Remove last char
      const nextText = baseAmount.slice(0, -1);
      // Reformat? Removing a char from "1.000" -> "1.00" -> "100"
      // If we remove the last char, we should just reformat the remaining string
      
      // Special case: if ends in comma, just remove it
      if (baseAmount.endsWith(',')) {
          setBaseAmount(nextText);
          return;
      }
      
      setBaseAmount(formatInput(nextText));
  };

  const handleAddCurrency = (currency: CurrencyRate) => {
      // Business Rule: Cannot add base currency as target (1-to-1)
      if (currency.code === baseCurrencyCode) {
          showToast(`No puedes añadir la moneda base`, 'error');
          // setPickerVisible(false); // Let component handle dismiss
          return;
      }

      if (!targetCodes.includes(currency.code)) {
          setTargetCodes(prev => [...prev, currency.code]);
          showToast(`${currency.code} añadida`, 'success');
      } else {
          showToast(`${currency.code} ya está en la lista`, 'info');
      }
      setPickerVisible(false);
  };

  const handleSetBase = (currency: CurrencyRate) => {
      setBaseCurrencyCode(currency.code);
      
      // Business Rule: If new base is in target list, remove it (Prevent 1-to-1)
      if (targetCodes.includes(currency.code)) {
          setTargetCodes(prev => prev.filter(c => c !== currency.code));
          showToast(`${currency.code} removida de la lista (ahora es base)`, 'info');
      }
      
      setPickerVisible(false);
  };

  const removeCurrency = (code: string) => {
      setTargetCodes(prev => prev.filter(c => c !== code));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
        await CurrencyService.getRates(true);
        showToast('Tasas actualizadas', 'success');
    } catch (error) {
        showToast('Error al actualizar', 'error');
    } finally {
        setRefreshing(false);
    }
  };

  // --- Helpers for Responsive Text ---
  const getInputFontSize = () => {
      const len = baseAmount.length;
      if (len > 12) return 24;
      if (len > 8) return 32;
      return 42;
  };

  const getExcludedCodes = useMemo(() => {
      if (pickerMode === 'add') {
          // Exclude base currency (cannot be target) and already added ones
          return [baseCurrencyCode, ...targetCodes];
      }
      return [];
  }, [pickerMode, baseCurrencyCode, targetCodes]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        backgroundColor="transparent"
        translucent 
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
      />

      {/* Replaced custom header with UnifiedHeader for consistency */}
      <UnifiedHeader 
        variant="simple" 
        title="Calculadora"
        style={styles.header}
      />
      
      {/* Absolute Back Button to overlay UnifiedHeader */}
      <View style={styles.topNavigation}>
         <Appbar.BackAction 
            onPress={() => navigation.goBack()} 
            color={theme.colors.onSurface}
         />
         <View style={{flex: 1}} />
         <IconButton icon="refresh" onPress={onRefresh} iconColor={theme.colors.onSurface} />
         <IconButton icon="history" onPress={() => showToast('Historial próximamente', 'info')} iconColor={theme.colors.onSurface} />
      </View>

      <View style={{flex: 1}}>
          {/* Main Base Input */}
          <View style={styles.baseContainer}>
              <View style={styles.inputHeader}>
                  <Text variant="labelMedium" style={{color: theme.colors.onSurfaceVariant}}>
                      MONEDA BASE
                  </Text>
                  {/* Source Label Added */}
                  <View style={{flex: 1, alignItems: 'center'}}>
                      <Text variant="labelSmall" style={{color: theme.colors.primary, fontWeight: 'bold', opacity: 0.8}}>
                          {getSourceLabel(baseCurrency.code).toUpperCase()}
                      </Text>
                  </View>

                  <TouchableOpacity onPress={() => setBaseAmount('1')}>
                      <Text variant="labelMedium" style={{color: theme.colors.error, fontWeight: 'bold'}}>
                          LIMPIAR
                      </Text>
                  </TouchableOpacity>
              </View>

              <View style={styles.inputRow}>
                  <TouchableOpacity 
                    style={[styles.currencySelector, { backgroundColor: 'transparent' }]}
                    onPress={() => { setPickerMode('base'); setPickerVisible(true); }}
                  >
                      {baseCurrency.iconName && (
                          <MaterialIcons name={baseCurrency.iconName} size={28} color={theme.colors.onSurface} style={{marginRight: 8}} />
                      )}
                      <Text variant="headlineMedium" style={{fontWeight: 'bold', color: theme.colors.onSurface}}>
                          {baseCurrency.code}
                      </Text>
                      <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  
                  <RNTextInput 
                      value={baseAmount}
                      onChangeText={handleBaseAmountChange}
                      onFocus={() => {
                          setIsInputFocused(true);
                          Keyboard.dismiss(); // Ensure native keyboard is dismissed
                      }}
                      onBlur={() => setIsInputFocused(false)}
                      showSoftInputOnFocus={false} // Disable native keyboard
                      keyboardType="numeric"
                      style={[
                          styles.mainInput, 
                          { 
                              color: theme.colors.onSurface,
                              fontSize: getInputFontSize()
                          }
                      ]}
                      placeholder="0"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      multiline={false}
                  />
              </View>
              <MarketStatus 
                  isOpen={true} 
                  updatedAt={rates.length > 0 ? new Date(rates[0].lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  onRefresh={onRefresh}
                  showBadge={false}
                  style={{ paddingHorizontal: 0, paddingVertical: 0, marginTop: 4, paddingBottom: 0, paddingTop: 0 }}
              />
          </View>

          {/* Target List */}
          <FlatList
              data={targetRows}
              keyExtractor={item => item.code}
              style={{flex: 1}}
              contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                  <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={[theme.colors.primary]}
                      progressBackgroundColor={theme.colors.elevation.level3}
                  />
              }
              renderItem={({ item }) => (
                  <View style={[
                      styles.targetRow, 
                      { 
                          backgroundColor: theme.colors.elevation.level1,
                          borderColor: theme.colors.outline,
                      }
                  ]}>
                      {/* Left Side: Icon */}
                      <View style={[styles.iconBox, { backgroundColor: theme.colors.elevation.level3 }]}>
                            <MaterialIcons name={item.rateObj.iconName || 'attach-money'} size={24} color={theme.colors.primary} />
                      </View>

                      {/* Middle: Code & Name */}
                      <View style={{marginLeft: 16, flex: 1}}>
                          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                              <Text variant="titleMedium" style={{fontWeight: '900', color: theme.colors.onSurface, marginRight: 8}}>
                                  {item.code}
                              </Text>
                              <View style={{
                                  backgroundColor: theme.colors.elevation.level3,
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                              }}>
                                  <Text style={{fontSize: 10, fontWeight: 'bold', color: theme.colors.onSurfaceVariant, textTransform: 'uppercase'}}>
                                      {item.name}
                                  </Text>
                              </View>
                          </View>
                          <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>
                              1 {baseCurrency.code} = {(item.rateObj.value / baseCurrency.value).toLocaleString('es-VE', {maximumFractionDigits: 4})} {item.code}
                          </Text>
                      </View>

                      {/* Right Side: Value & Label */}
                      <View style={{alignItems: 'flex-end', justifyContent: 'center'}}>
                          <Text 
                            variant="headlineSmall" 
                            style={{fontWeight: 'bold', color: theme.colors.onSurface}}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                              {item.value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                          <Text variant="labelSmall" style={{
                              color: item.rateObj.type === 'crypto' ? theme.colors.warning : theme.colors.success, 
                              fontWeight: 'bold'
                          }}>
                              {item.rateObj.type === 'crypto' ? 'Cripto activo' : 'Conversión directa'}
                          </Text>
                      </View>
                      
                      {/* Close Button (Absolute positioned) */}
                      <TouchableOpacity 
                          onPress={() => removeCurrency(item.code)} 
                          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                          style={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              backgroundColor: theme.colors.errorContainer,
                              borderRadius: 12,
                              width: 24,
                              height: 24,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 2,
                              borderColor: theme.colors.background
                          }}
                      >
                          <MaterialIcons name="close" size={14} color={theme.colors.error} />
                      </TouchableOpacity>
                  </View>
              )}
              ListFooterComponent={
                  <TouchableOpacity 
                    onPress={() => { setPickerMode('add'); setPickerVisible(true); }}
                    style={{ 
                        marginTop: 16, 
                        borderWidth: 1,
                        borderColor: theme.colors.outline, 
                        borderStyle: 'dashed',
                        borderRadius: 100, // Pill
                        paddingVertical: 14,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'transparent'
                    }}
                  >
                      <View style={{
                          width: 24, 
                          height: 24, 
                          borderRadius: 12, 
                          backgroundColor: theme.colors.secondaryContainer,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 10
                      }}>
                        <MaterialIcons name="add" size={18} color={theme.colors.onSecondaryContainer} />
                      </View>
                      <Text style={{
                          color: theme.colors.onSurfaceVariant, 
                          fontWeight: 'bold', 
                          letterSpacing: 1,
                          fontSize: 12
                      }}>
                          AÑADIR OTRA DIVISA
                      </Text>
                  </TouchableOpacity>
              }
          />
          
          <Keypad onKeyPress={handleKeyPress} onDelete={handleDelete} theme={theme} />
      </View>

      <CurrencyPickerModal
          visible={pickerVisible}
          onDismiss={() => setPickerVisible(false)}
          onSelect={pickerMode === 'base' ? handleSetBase : handleAddCurrency}
          selectedCurrencyCode={pickerMode === 'base' ? baseCurrencyCode : null}
          rates={rates}
          title={pickerMode === 'base' ? "Seleccionar divisa" : "Añadir a la lista"}
          excludedCodes={getExcludedCodes}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    // Adjusted to work with UnifiedHeader
    zIndex: 1,
  },
  topNavigation: {
      position: 'absolute',
      top: Platform.OS === 'android' ? StatusBar.currentHeight : 44, // Approximate safe area top
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      zIndex: 2,
      height: 56, // Standard header height
  },
  baseContainer: {
      paddingHorizontal: 20,
      marginTop: 20, 
      marginBottom: 16,
  },
  inputHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
  },
  inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
  },
  currencySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 16,
  },
  mainInput: {
      fontWeight: 'bold',
      textAlign: 'right',
      flex: 1,
      marginLeft: 16,
      padding: 0, 
      includeFontPadding: false,
  },
  actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      marginTop: 16,
  },
  targetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginBottom: 12,
      borderRadius: 28,
      borderWidth: 1,
  },
  iconBox: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
  },
  pickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderBottomWidth: StyleSheet.hairlineWidth,
  },
  keypadContainer: {
      paddingBottom: Platform.OS === 'ios' ? 34 : 16,
      paddingTop: 8,
      paddingHorizontal: 8,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 8,
  },
  keypadRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
  },
  keypadButton: {
      flex: 1,
      height: 60,
      marginHorizontal: 6,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 16,
      backgroundColor: 'transparent', // Or slight overlay if needed
  },
  keypadText: {
      fontSize: 28,
      fontWeight: '500',
  },
  centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
  }
});

export default AdvancedCalculatorScreen;
