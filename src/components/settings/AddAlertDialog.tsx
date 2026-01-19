import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Button, TextInput, Text, SegmentedButtons, useTheme, ActivityIndicator, IconButton, Icon } from 'react-native-paper';
import { CurrencyService } from '../../services/CurrencyService';
import { StocksService } from '../../services/StocksService';
import UniversalDialog from '../ui/UniversalDialog';

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
        prices[`${r.code}/VES`] = r.value;
        if (r.type === 'crypto') {
            prices[`${r.code}/USD`] = r.value / usdRate;
            prices[`${r.code}/USDT`] = r.value / usdtRate;
        }
      });
      
      if (usdRate > 0) prices["VES/USD"] = 1 / usdRate;
      const eurRate = rates.find(r => r.code === 'EUR')?.value;
      if (eurRate && usdRate > 0) prices["EUR/USD"] = eurRate / usdRate;

      // Process Stocks
      stocks.forEach(s => {
        prices[s.symbol] = s.price;
      });

      setSymbolPrices(prices);
      const allSymbols = Object.keys(prices).sort();
      setAvailableSymbols(allSymbols);
    } catch (err) {
      console.error("Failed to load symbols for autocomplete", err);
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

  const handleSelectSymbol = (selected: string) => {
    setSymbol(selected);
    setShowDropdown(false);
    // Auto-set current price as target suggestion if empty
    if (!target && symbolPrices[selected]) {
      setTarget(symbolPrices[selected].toFixed(2));
    }
  };

  const filteredSymbols = availableSymbols.filter(s => 
    s.toLowerCase().includes(symbol.toLowerCase())
  );

  return (
    <UniversalDialog
      visible={visible}
      onDismiss={onDismiss}
      title="Nueva Alerta"
      actions={
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            onPress={onDismiss} 
            style={[styles.actionButton, { backgroundColor: theme.colors.surfaceVariant }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.onSurfaceVariant }]}>CANCELAR</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.onPrimary }]}>GUARDAR</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.formContainer}>
        {/* Symbol Input */}
        <View style={styles.inputGroup}>
          <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Activo</Text>
          <View style={styles.autocompleteContainer}>
            <TextInput
              value={symbol}
              onChangeText={(text) => {
                setSymbol(text);
                setShowDropdown(true);
                setError('');
              }}
              placeholder="Ej. USD/VES, CANTV"
              mode="flat"
              style={[
                styles.input, 
                { 
                  backgroundColor: theme.colors.surfaceVariant, // Matches surface-dark/accent from HTML
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12,
                }
              ]}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              textColor={theme.colors.onSurface}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              right={
                loadingSymbols ? <TextInput.Icon icon={() => <ActivityIndicator size={16} />} /> :
                symbol ? <TextInput.Icon icon="close" onPress={() => setSymbol('')} /> :
                <TextInput.Icon icon="refresh" onPress={loadSymbols} />
              }
            />
            
            {showDropdown && symbol.length > 0 && filteredSymbols.length > 0 && (
               <View style={[styles.dropdown, { backgroundColor: theme.colors.elevation.level3, borderColor: theme.colors.outline }]}>
                 <FlatList
                    data={filteredSymbols}
                    keyExtractor={(item) => item}
                    keyboardShouldPersistTaps="always"
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    nestedScrollEnabled={true}
                    renderItem={({ item }) => (
                     <TouchableOpacity
                       style={[styles.dropdownItem, { borderBottomColor: theme.colors.outline }]}
                       onPress={() => handleSelectSymbol(item)}
                     >
                       <View>
                         <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{item}</Text>
                         <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                           Actual: {symbolPrices[item]?.toFixed(2)}
                         </Text>
                       </View>
                       <IconButton icon="arrow-top-left" size={16} />
                     </TouchableOpacity>
                   )}
                 />
               </View>
             )}
          </View>
        </View>

        {/* Condition Toggle Buttons */}
        <View style={styles.inputGroup}>
            <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Condición</Text>
            <View style={[styles.toggleContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        condition === 'above' && { backgroundColor: theme.colors.elevation.level3 },
                        { flexDirection: 'row', gap: 8 }
                    ]}
                    onPress={() => setCondition('above')}
                    activeOpacity={0.7}
                >
                    <Icon 
                        source="trending-up" 
                        size={18} 
                        color={condition === 'above' ? theme.colors.primary : theme.colors.onSurfaceVariant} 
                    />
                    <Text style={[
                        styles.toggleButtonText,
                        { color: condition === 'above' ? theme.colors.primary : theme.colors.onSurfaceVariant }
                    ]}>
                        SUBE DE
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        condition === 'below' && { backgroundColor: theme.colors.elevation.level3 },
                        { flexDirection: 'row', gap: 8 }
                    ]}
                    onPress={() => setCondition('below')}
                    activeOpacity={0.7}
                >
                    <Icon 
                        source="trending-down" 
                        size={18} 
                        color={condition === 'below' ? theme.colors.error : theme.colors.onSurfaceVariant} 
                    />
                    <Text style={[
                        styles.toggleButtonText,
                        { color: condition === 'below' ? theme.colors.error : theme.colors.onSurfaceVariant }
                    ]}>
                        BAJA DE
                    </Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Target Price Input */}
        <View style={styles.inputGroup}>
          <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Precio Objetivo</Text>
          <TextInput
            value={target}
            onChangeText={setTarget}
            placeholder="0.00"
            keyboardType="numeric"
            mode="flat"
            style={[
                styles.input, 
                { 
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 12,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                }
            ]}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            textColor={theme.colors.onSurface}
            left={<TextInput.Affix text={
                symbolPrices[symbol] 
                    ? (symbol.endsWith('/USD') || symbol.endsWith('/USDT') ? '$ ' 
                        : symbol.endsWith('/EUR') ? '€ ' 
                        : 'Bs. ') 
                    : ''
            } />}
            right={
                loadingSymbols ? <TextInput.Icon icon={() => <ActivityIndicator size={16} />} /> :
                symbol ? <TextInput.Icon icon="close" onPress={() => setSymbol('')} /> :
                <TextInput.Icon icon="refresh" onPress={loadSymbols} />
            }
          />
          {symbolPrices[symbol] && (
            <Text variant="bodySmall" style={{ marginTop: 4, color: theme.colors.primary }}>
                Precio actual: {symbolPrices[symbol].toFixed(2)}
            </Text>
          )}
        </View>

        {/* Disclaimer / Summary */}
        {target && !isNaN(Number(target)) ? (
           <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, fontSize: 13 }}>
             Se te notificará cuando el precio sea <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{condition === 'above' ? 'mayor' : 'menor'}</Text> a <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{target}</Text>.
           </Text>
        ) : null}

        {error ? (
          <Text style={{ color: theme.colors.error, marginTop: 8, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}
      </View>
    </UniversalDialog>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    height: 50,
    fontSize: 16,
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 10,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    height: 160, // Fixed height instead of max-height to ensure scroll area is stable
    zIndex: 1000,
    elevation: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentedButton: {
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    marginTop: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default AddAlertDialog;
