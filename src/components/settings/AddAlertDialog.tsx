import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Portal, Dialog, Button, TextInput, Text, SegmentedButtons, useTheme, Divider, ActivityIndicator } from 'react-native-paper';
import { CurrencyService } from '../../services/CurrencyService';
import { StocksService } from '../../services/StocksService';

interface AddAlertDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (symbol: string, target: string, condition: 'above' | 'below') => void;
}

const AddAlertDialog = ({ visible, onDismiss, onSave }: AddAlertDialogProps) => {
  const theme = useTheme();
  const [symbol, setSymbol] = useState('');
  const [target, setTarget] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [symbolPrices, setSymbolPrices] = useState<Record<string, number>>({});
  const [loadingSymbols, setLoadingSymbols] = useState(false);

  useEffect(() => {
    if (visible) {
      setSymbol('');
      setTarget('');
      setCondition('above');
      setError('');
      setShowDropdown(false);
      loadSymbols();
    }
  }, [visible]);

  const loadSymbols = async () => {
    setLoadingSymbols(true);
    try {
      // Fetch data in parallel
      const [rates, stocks] = await Promise.all([
        CurrencyService.getRates(),
        StocksService.getStocks()
      ]);

      const prices: Record<string, number> = {};
      const usdRate = rates.find(r => r.code === 'USD')?.value || 1;
      const usdtRate = rates.find(r => r.code === 'USDT')?.value || usdRate;

      // Process Rates
      rates.forEach(r => {
        // Base symbols (assumed vs VES if not specified, or just the value provided)
        // Only add pairs as requested
        prices[`${r.code}/VES`] = r.value;
        
        // Crypto pairs
        if (r.type === 'crypto') {
            prices[`${r.code}/USD`] = r.value / usdRate;
            prices[`${r.code}/USDT`] = r.value / usdtRate;
        }
      });
      
      // Special common pairs
      if (usdRate > 0) prices["VES/USD"] = 1 / usdRate;
      const eurRate = rates.find(r => r.code === 'EUR')?.value;
      if (eurRate && usdRate > 0) prices["EUR/USD"] = eurRate / usdRate;

      // Process Stocks
      stocks.forEach(s => {
        // Stocks are typically in VES, add /VES suffix for consistency
        prices[`${s.symbol}/VES`] = s.price;
      });

      setSymbolPrices(prices);

      // Combine and deduplicate based STRICTLY on available prices
      // This ensures that every symbol in the list has a valid price from the API
      const allSymbols = Object.keys(prices).sort();

      setAvailableSymbols(allSymbols);
    } catch (err) {
      console.error("Failed to load symbols for autocomplete", err);
      // No fallback to hardcoded data - strict API requirement
      setAvailableSymbols([]);
    } finally {
      setLoadingSymbols(false);
    }
  };

  const handleSave = () => {
    if (!symbol.trim()) {
      setError('El símbolo es requerido (ej. BTC/USD)');
      return;
    }
    if (!target.trim() || isNaN(Number(target))) {
      setError('Ingresa un precio objetivo válido');
      return;
    }

    onSave(symbol.toUpperCase().trim(), target.trim(), condition);
    onDismiss();
  };

  const filteredSymbols = availableSymbols.filter(s => 
    s.toLowerCase().includes(symbol.toLowerCase())
  );

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss} 
        style={{ 
          backgroundColor: theme.colors.elevation.level3,
          borderRadius: 28, // Material 3 standard
          borderColor: theme.colors.outline,
          borderWidth: 1,
          elevation: 0, // Flat style requested
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
        }}
      >
        <Dialog.Title style={{ 
          textAlign: 'center',
          color: theme.colors.onSurface,
          fontSize: 24,
        }}>
          Nueva Alerta
        </Dialog.Title>
        <Dialog.Content>
          <View style={styles.inputContainer}>
            <View style={{ zIndex: 10 }}>
              <TextInput
                label="Par / Símbolo"
                placeholder="Ej. BTC/USD, VES/USD"
                value={symbol}
                onChangeText={(text) => {
                  setSymbol(text);
                  setError('');
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                mode="outlined"
                style={styles.input}
                autoCapitalize="characters"
              />
              {showDropdown && symbol.length > 0 && filteredSymbols.length > 0 && (
                <View style={[styles.dropdown, { backgroundColor: theme.colors.elevation.level2, borderColor: theme.colors.outline }]}>
                  {loadingSymbols ? (
                      <View style={{ padding: 16, alignItems: 'center' }}>
                         <ActivityIndicator size="small" />
                      </View>
                  ) : (
                    <ScrollView style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                      {filteredSymbols.map((item, index) => (
                        <React.Fragment key={item}>
                          <TouchableOpacity 
                            style={styles.dropdownItem} 
                            onPress={() => {
                              setSymbol(item);
                              if (symbolPrices[item]) {
                                const p = symbolPrices[item];
                                // Auto-fill target price with current value
                                // Use 8 decimals for very small numbers (crypto), 4 for < 1, 2 for normal
                                const formattedPrice = p < 0.01 ? p.toFixed(8) : p < 1 ? p.toFixed(4) : p.toFixed(2);
                                setTarget(formattedPrice);
                              }
                              setShowDropdown(false);
                              setError('');
                            }}
                          >
                            <Text style={{ color: theme.colors.onSurface }}>{item}</Text>
                          </TouchableOpacity>
                          {index < filteredSymbols.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>

            <TextInput
              label="Precio Objetivo"
              placeholder="0.00"
              value={target}
              onChangeText={(text) => {
                setTarget(text);
                setError('');
              }}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text variant="bodyMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              Condición
            </Text>

            <SegmentedButtons
              value={condition}
              onValueChange={value => setCondition(value as 'above' | 'below')}
              buttons={[
                {
                  value: 'above',
                  label: 'Sube de',
                  icon: 'trending-up',
                },
                {
                  value: 'below',
                  label: 'Baja de',
                  icon: 'trending-down',
                },
              ]}
              style={styles.segmentedButton}
            />

            {error ? (
              <Text style={{ color: theme.colors.error, marginTop: 8, fontSize: 12 }}>
                {error}
              </Text>
            ) : null}
          </View>
        </Dialog.Content>
        <Dialog.Actions style={{ justifyContent: 'space-around', paddingBottom: 16 }}>
          <Button 
            onPress={onDismiss} 
            textColor={theme.colors.onSurfaceVariant}
            mode="text"
          >
            Cancelar
          </Button>
          <Button 
            onPress={handleSave} 
            mode="contained" 
            style={{ paddingHorizontal: 16 }}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
          >
            Guardar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  label: {
    marginBottom: 4,
  },
  segmentedButton: {
    marginBottom: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 56, // Height of TextInput roughly
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
  }
});

export default AddAlertDialog;
