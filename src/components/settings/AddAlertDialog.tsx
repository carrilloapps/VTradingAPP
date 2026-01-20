import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { TextInput, Text, ActivityIndicator, IconButton, Icon } from 'react-native-paper';
import { CurrencyService } from '../../services/CurrencyService';
import { StocksService } from '../../services/StocksService';
import CustomDialog from '../ui/CustomDialog';
import { useAppTheme } from '../../theme/theme';

interface AddAlertDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (symbol: string, target: string, condition: 'above' | 'below') => void;
}

interface SymbolData {
  price: number;
  type: 'Acción' | 'Divisa' | 'Cripto';
  changePercent: number;
}

const AddAlertDialog = ({ visible, onDismiss, onSave }: AddAlertDialogProps) => {
  const theme = useAppTheme();
  const [symbol, setSymbol] = useState('');
  const [target, setTarget] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [symbolData, setSymbolData] = useState<Record<string, SymbolData>>({});
  const [loadingSymbols, setLoadingSymbols] = useState(false);

  // Match colors with StockItem.tsx and MarketStatus.tsx for consistency
  
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
        StocksService.getAllStocks()
      ]);

      const data: Record<string, SymbolData> = {};
      const usdRate = rates.find(r => r.code === 'USD')?.value || 1;
      const usdtRate = rates.find(r => r.code === 'USDT')?.value || usdRate;

      // Process Rates
      rates.forEach(r => {
        // Base VES pair
        data[`${r.code}/VES`] = {
            price: r.value,
            type: r.type === 'crypto' ? 'Cripto' : 'Divisa',
            changePercent: r.changePercent || 0
        };

        if (r.type === 'crypto') {
            data[`${r.code}/USD`] = {
                price: r.value / usdRate,
                type: 'Cripto',
                changePercent: r.changePercent || 0
            };
            data[`${r.code}/USDT`] = {
                price: r.value / usdtRate,
                type: 'Cripto',
                changePercent: r.changePercent || 0
            };
        }
      });
      
      if (usdRate > 0) {
          data["VES/USD"] = {
              price: 1 / usdRate,
              type: 'Divisa',
              changePercent: 0
          };
      }
      
      const eurRate = rates.find(r => r.code === 'EUR')?.value;
      if (eurRate && usdRate > 0) {
          data["EUR/USD"] = {
              price: eurRate / usdRate,
              type: 'Divisa',
              changePercent: 0
          };
      }

      // Process Stocks
      stocks.forEach(s => {
        data[s.symbol] = {
            price: s.price,
            type: 'Acción',
            changePercent: s.changePercent || 0
        };
      });

      setSymbolData(data);
      const allSymbols = Object.keys(data).sort();
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
    if (!target && symbolData[selected]?.price !== undefined) {
      setTarget(symbolData[selected].price.toFixed(2));
    }
  };

  const getCurrencyPrefix = (sym: string) => {
      if (!sym) return '';
      if (sym.endsWith('/USD') || sym.endsWith('/USDT')) return '$ ';
      if (sym.endsWith('/EUR')) return '€ ';
      return 'Bs. ';
  };

  const filteredSymbols = availableSymbols.filter(s => 
    s.toLowerCase().includes(symbol.toLowerCase())
  );

  return (
    <CustomDialog
      visible={visible}
      onDismiss={onDismiss}
      title="Nueva Alerta"
      onConfirm={handleSave}
      confirmLabel="GUARDAR"
      cancelLabel="CANCELAR"
      showCancel={true}
      cancelMode="outlined"
      fullWidthActions={true}
    >
      <View style={styles.formContainer}>
        {/* Symbol Input */}
        <View style={[styles.inputGroup, { zIndex: 100 }]}>
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
                    renderItem={({ item }) => {
                       const data = symbolData[item];
                       const change = data?.changePercent || 0;
                       const isZero = Math.abs(change) < 0.001; // Float safety
                       const isPositive = change > 0;
                       
                       let changeColor = theme.colors.onSurfaceVariant;
                       let changeIcon = 'remove'; // Neutral icon
                       
                       if (!isZero) {
                           changeColor = isPositive ? theme.colors.trendUp : theme.colors.trendDown;
                           changeIcon = isPositive ? 'trending-up' : 'trending-down';
                       }
                       
                       return (
                         <TouchableOpacity
                           style={[styles.dropdownItem, { borderBottomColor: theme.colors.outline }]}
                           onPress={() => handleSelectSymbol(item)}
                         >
                           <View style={{ flex: 1 }}>
                             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{item}</Text>
                                <View style={{ 
                                    backgroundColor: theme.colors.elevation.level5, 
                                    paddingHorizontal: 6, 
                                    paddingVertical: 2, 
                                    borderRadius: 4 
                                }}>
                                    <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant }}>{data?.type}</Text>
                                </View>
                             </View>
                             
                             <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 8 }}>
                                <Text variant="labelSmall" style={{ color: theme.colors.onSurface }}>
                                   {getCurrencyPrefix(item)}{data?.price !== undefined && !isNaN(data.price) ? data.price.toFixed(2) : 'N/A'}
                                </Text>
                                {data?.changePercent !== undefined && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Icon source={changeIcon} size={12} color={changeColor} />
                                        <Text style={{ fontSize: 10, color: changeColor, marginLeft: 2 }}>
                                            {Math.abs(change).toFixed(2)}%
                                        </Text>
                                    </View>
                                )}
                             </View>
                           </View>
                           <IconButton icon="arrow-top-left" size={16} />
                         </TouchableOpacity>
                       );
                   }}
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
                        color={condition === 'above' ? theme.colors.trendUp : theme.colors.onSurfaceVariant} 
                    />
                    <Text style={[
                        styles.toggleButtonText,
                        { color: condition === 'above' ? theme.colors.trendUp : theme.colors.onSurfaceVariant }
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
                        color={condition === 'below' ? theme.colors.trendDown : theme.colors.onSurfaceVariant} 
                    />
                    <Text style={[
                        styles.toggleButtonText,
                        { color: condition === 'below' ? theme.colors.trendDown : theme.colors.onSurfaceVariant }
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
            left={<TextInput.Affix text={symbolData[symbol]?.price ? getCurrencyPrefix(symbol) : ''} />}
            right={
                loadingSymbols ? <TextInput.Icon icon={() => <ActivityIndicator size={16} />} /> :
                symbol ? <TextInput.Icon icon="close" onPress={() => setSymbol('')} /> :
                <TextInput.Icon icon="refresh" onPress={loadSymbols} />
            }
          />
          {symbolData[symbol]?.price !== undefined && (
            <Text variant="bodySmall" style={{ marginTop: 4, color: theme.colors.primary }}>
                Precio actual: {getCurrencyPrefix(symbol)}{symbolData[symbol].price.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Disclaimer / Summary */}
        {target && !isNaN(Number(target)) ? (
           <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
             Se te notificará cuando el precio sea <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{condition === 'above' ? 'mayor' : 'menor'}</Text> a <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{getCurrencyPrefix(symbol)}{target}</Text>.
           </Text>
        ) : null}

        {error ? (
          <Text style={{ color: theme.colors.error, marginTop: 8, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}
      </View>
    </CustomDialog>
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
    zIndex: 1000,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    height: 160, // Fixed height instead of max-height to ensure scroll area is stable
    zIndex: 2000,
    elevation: 100, // High elevation for Android touch events
    backgroundColor: 'white', // Ensure it has a background to capture touches (overridden by theme)
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
