import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Keyboard } from 'react-native';
import { Text, ActivityIndicator, TextInput, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import UnifiedHeader from '../../components/ui/UnifiedHeader';
import SearchBar from '../../components/ui/SearchBar';
import FilterSection from '../../components/ui/FilterSection';
import { useAppTheme } from '../../theme/theme';
import { CurrencyService } from '../../services/CurrencyService';
import { StocksService } from '../../services/StocksService';
import { storageService, UserAlert } from '../../services/StorageService';
import { fcmService } from '../../services/firebase/FCMService';
import { useToast } from '../../context/ToastContext';

interface SymbolItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  type: 'Divisa' | 'Cripto' | 'Acción';
  changePercent: number;
  iconName?: string;
}

const AddAlertScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | 'Divisas' | 'Cripto' | 'Acciones'>('Todas');
  const [items, setItems] = useState<SymbolItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Configuration State
  const [selectedItem, setSelectedItem] = useState<SymbolItem | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rates, stocks] = await Promise.all([
        CurrencyService.getRates(),
        StocksService.getAllStocks()
      ]);

      const itemsMap = new Map<string, SymbolItem>();
      const usdRate = rates.find(r => r.code === 'USD')?.value || 1;
      const usdtRate = rates.find(r => r.code === 'USDT')?.value || usdRate;

      // 1. Process Currencies & Crypto
      rates.forEach(r => {
        // Skip base currency to avoid VES/VES
        if (r.code === 'VES') return;

        // CODE/VES (e.g. USD/VES)
        const id1 = `${r.code}/VES`;
        itemsMap.set(id1, {
          id: id1,
          symbol: id1,
          name: r.name,
          price: r.value,
          type: r.type === 'crypto' ? 'Cripto' : 'Divisa',
          changePercent: r.changePercent || 0,
          iconName: r.type === 'crypto' ? 'bitcoin' : 'currency-usd'
        });

        // VES/CODE (Inverse) - e.g. VES/COP
        if (r.value > 0) {
           const id2 = `VES/${r.code}`;
           itemsMap.set(id2, {
            id: id2,
            symbol: id2,
            name: `VES vs ${r.name}`,
            price: 1 / r.value,
            type: r.type === 'crypto' ? 'Cripto' : 'Divisa',
            changePercent: r.changePercent ? -r.changePercent : 0, // Approx inverse change
            iconName: 'swap-horizontal'
          });
        }

        // Crypto Pairs against USD/USDT
        if (r.type === 'crypto') {
          const id3 = `${r.code}/USD`;
          itemsMap.set(id3, {
            id: id3,
            symbol: id3,
            name: `${r.name} en Dólares`,
            price: r.value / usdRate,
            type: 'Cripto',
            changePercent: r.changePercent || 0,
            iconName: 'bitcoin'
          });
        }
      });

      // Special Case: EUR/USD
      const eurRate = rates.find(r => r.code === 'EUR')?.value;
      if (eurRate && usdRate > 0) {
        itemsMap.set('EUR/USD', {
            id: 'EUR/USD',
            symbol: 'EUR/USD',
            name: 'Euro vs Dólar',
            price: eurRate / usdRate,
            type: 'Divisa',
            changePercent: 0,
            iconName: 'currency-eur'
        });
      }

      // 2. Process Stocks
      stocks.forEach(s => {
        itemsMap.set(s.symbol, {
          id: s.symbol,
          symbol: s.symbol,
          name: s.name,
          price: s.price,
          type: 'Acción',
          changePercent: s.changePercent || 0,
          iconName: 'chart-line'
        });
      });

      setItems(Array.from(itemsMap.values()).sort((a, b) => a.symbol.localeCompare(b.symbol)));
    } catch (error) {
      console.error('Error loading alert items:', error);
      showToast('Error cargando activos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category Filter
      if (selectedCategory === 'Divisas' && item.type !== 'Divisa') return false;
      if (selectedCategory === 'Cripto' && item.type !== 'Cripto') return false;
      if (selectedCategory === 'Acciones' && item.type !== 'Acción') return false;

      // Search Filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, selectedCategory]);

  const handleSelectItem = (item: SymbolItem) => {
    setSelectedItem(item);
    setTargetPrice(item.price.toFixed(item.price < 1 ? 4 : 2));
    setCondition('above');
    Keyboard.dismiss();
  };

  const handleSaveAlert = async () => {
    if (!selectedItem || !targetPrice) return;

    setSaving(true);
    try {
        const alerts = await storageService.getAlerts();
        
        if (alerts.length >= 5) {
            showToast('Límite de 5 alertas alcanzado', 'error');
            setSaving(false);
            return;
        }

        const newAlert: UserAlert = {
            id: Date.now().toString(),
            symbol: selectedItem.symbol,
            target: targetPrice,
            condition: condition,
            isActive: true,
            iconName: selectedItem.iconName || 'bell-ring'
        };

        const updated = [...alerts, newAlert];
        await storageService.saveAlerts(updated);

        // Subscribe to FCM
        const safeSymbol = selectedItem.symbol.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const topic = `ticker_${safeSymbol}`;
        await fcmService.subscribeToTopic(topic);

        showToast(`Alerta creada para ${selectedItem.symbol}`, 'success');
        navigation.goBack();
    } catch (error) {
        console.error('Error saving alert:', error);
        showToast('Error al guardar alerta', 'error');
    } finally {
        setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: SymbolItem }) => (
    <TouchableOpacity
      style={[styles.itemCard, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
      onPress={() => handleSelectItem(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.elevation.level2 }]}>
        <MaterialCommunityIcons name={item.iconName || 'finance'} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.symbol}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <View style={styles.priceContainer}>
        <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
          {item.price < 1 ? item.price.toFixed(4) : item.price.toFixed(2)}
        </Text>
        <Text 
          variant="labelSmall" 
          style={{ 
            color: item.changePercent >= 0 ? theme.colors.trendUp : theme.colors.trendDown 
          }}
        >
          {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handleBack = () => {
    if (selectedItem) {
      setSelectedItem(null);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <UnifiedHeader 
        title={selectedItem ? "Configurar alerta" : "Nueva alerta"} 
        variant="section"
        onBackPress={handleBack}
      />
      
      {/* Configuration Mode */}
      {selectedItem ? (
        <View style={[styles.configContainer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.targetCard, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]}>
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                        {selectedItem.symbol}
                    </Text>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                        Precio actual: {selectedItem.price < 1 ? selectedItem.price.toFixed(4) : selectedItem.price.toFixed(2)}
                    </Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text variant="labelMedium" style={{ marginBottom: 8 }}>Precio Objetivo</Text>
                    <TextInput
                        mode="outlined"
                        value={targetPrice}
                        onChangeText={setTargetPrice}
                        keyboardType="numeric"
                        right={<TextInput.Icon icon="target" />}
                        style={{ backgroundColor: theme.colors.surface }}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text variant="labelMedium" style={{ marginBottom: 8 }}>Condición</Text>
                    <View style={styles.conditionRow}>
                        <TouchableOpacity 
                            style={[
                                styles.conditionBtn, 
                                condition === 'above' && { backgroundColor: theme.colors.trendUp, borderColor: theme.colors.trendUp }
                            ]}
                            onPress={() => setCondition('above')}
                        >
                            <MaterialCommunityIcons 
                                name="trending-up" 
                                size={24} 
                                color={condition === 'above' ? '#FFF' : theme.colors.onSurfaceVariant} 
                            />
                            <Text style={{ color: condition === 'above' ? '#FFF' : theme.colors.onSurfaceVariant, fontWeight: 'bold' }}>
                                SUBE DE
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[
                                styles.conditionBtn, 
                                condition === 'below' && { backgroundColor: theme.colors.trendDown, borderColor: theme.colors.trendDown }
                            ]}
                            onPress={() => setCondition('below')}
                        >
                            <MaterialCommunityIcons 
                                name="trending-down" 
                                size={24} 
                                color={condition === 'below' ? '#FFF' : theme.colors.onSurfaceVariant} 
                            />
                            <Text style={{ color: condition === 'below' ? '#FFF' : theme.colors.onSurfaceVariant, fontWeight: 'bold' }}>
                                BAJA DE
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={{ flex: 1 }} />

            <Button 
                mode="contained" 
                onPress={handleSaveAlert} 
                loading={saving}
                style={{ borderRadius: 8, height: 48, justifyContent: 'center' }}
                labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            >
                GUARDAR ALERTA
            </Button>
        </View>
      ) : (
        /* Search Mode */
        <>
            <View style={[styles.searchSection, { backgroundColor: theme.colors.surface }]}>
                <SearchBar
                    placeholder="Buscar activo (ej. BTC, VES, AAPL)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <FilterSection
                    options={[
                        { label: 'Todas', value: 'Todas' },
                        { label: 'Divisas', value: 'Divisas', icon: 'currency-exchange' },
                        { label: 'Cripto', value: 'Cripto', icon: 'bitcoin' },
                        { label: 'Acciones', value: 'Acciones', icon: 'chart-line' },
                    ]}
                    selectedValue={selectedCategory}
                    onSelect={(val) => setSelectedCategory(val as any)}
                    style={{ marginTop: 12, marginLeft: -16, marginRight: -16 }}
                />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                                No se encontraron resultados
                            </Text>
                        </View>
                    }
                />
            )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  // Config Styles
  configContainer: {
    flex: 1,
    padding: 24,
  },
  targetCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    gap: 8,
  },
});

export default AddAlertScreen;
