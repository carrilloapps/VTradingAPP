import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Keyboard, ScrollView } from 'react-native';
import { Text, ActivityIndicator, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import UnifiedHeader from '../../components/ui/UnifiedHeader';
import SearchBar from '../../components/ui/SearchBar';
import FilterSection from '../../components/ui/FilterSection';
import CustomButton from '../../components/ui/CustomButton';
import CustomDialog from '../../components/ui/CustomDialog';
import AddAlertSkeleton from '../../components/settings/AddAlertSkeleton';
import { useAppTheme } from '../../theme/theme';
import { CurrencyService } from '../../services/CurrencyService';
import { StocksService } from '../../services/StocksService';
import { storageService, UserAlert } from '../../services/StorageService';
import { fcmService } from '../../services/firebase/FCMService';
import { useToast } from '../../context/ToastContext';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

interface SymbolItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  type: 'Divisa' | 'Cripto' | 'Acción';
  changePercent: number;
  iconName?: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'AddAlert'>;

const AddAlertScreen = ({ route }: Props) => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  
  // Params for Edit Mode
  const editAlert = route.params?.editAlert;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | 'Divisas' | 'Cripto' | 'Acciones'>('Todas');
  const [items, setItems] = useState<SymbolItem[]>([]);
  const [loading, setLoading] = useState(true);

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
  
  // Configuration State
  const [selectedItem, setSelectedItem] = useState<SymbolItem | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Effects moved below


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
          iconName: r.type === 'crypto' ? 'currency-btc' : 'currency-usd'
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
            // CODE/USD
            const id3 = `${r.code}/USD`;
            const priceUsd = r.value / usdRate;
            itemsMap.set(id3, {
                id: id3,
                symbol: id3,
                name: `${r.name} / USD`,
                price: priceUsd,
                type: 'Cripto',
                changePercent: r.changePercent || 0,
                iconName: 'currency-btc'
            });
        }
      });

      // 2. Process Stocks
      stocks.forEach(s => {
         itemsMap.set(s.symbol, {
            id: s.symbol,
            symbol: s.symbol,
            name: s.name,
            price: s.price,
            type: 'Acción',
            changePercent: s.changePercent,
            iconName: 'domain'
         });
      });

      setItems(Array.from(itemsMap.values()));
    } catch (error) {
      console.error('Error loading data for alerts:', error);
      showToast('Error cargando datos de mercado', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pre-fill if editing
  useEffect(() => {
    if (editAlert && items.length > 0) {
        const item = items.find(i => i.symbol === editAlert.symbol);
        if (item) {
            setSelectedItem(item);
            setTargetPrice(editAlert.target);
            setCondition(editAlert.condition);
        }
    }
  }, [editAlert, items]);

  if (loading) {
    return <AddAlertSkeleton variant={editAlert ? 'form' : 'list'} />;
  }





  const handleSelectItem = (item: SymbolItem) => {
    setSelectedItem(item);
    // Only reset target/condition if we are NOT editing or if we changed the symbol (which effectively is a reset)
    // But since handleSelectItem is triggered by user tap, it implies a change.
    setTargetPrice(item.price.toFixed(item.price < 1 ? 4 : 2));
    setCondition('above');
    Keyboard.dismiss();
  };

  const handleSaveAlert = async () => {
    if (!selectedItem || !targetPrice) return;

    setSaving(true);
    try {
        const alerts = await storageService.getAlerts();
        
        // Validation: Limit 5 alerts (unless editing existing)
        if (!editAlert && alerts.length >= 5) {
            showToast('Límite de 5 alertas alcanzado', 'error');
            setSaving(false);
            return;
        }

        const currentTimestamp = Date.now().toString();
        const alertId = editAlert ? editAlert.id : currentTimestamp;

        const newAlert: UserAlert = {
            id: alertId,
            symbol: selectedItem.symbol,
            target: targetPrice,
            condition: condition,
            isActive: true,
            iconName: selectedItem.iconName || 'bell-ring'
        };

        let updatedAlerts: UserAlert[];

        if (editAlert) {
            // Update existing
            updatedAlerts = alerts.map(a => a.id === editAlert.id ? newAlert : a);
            
            // Handle Topic Change if symbol changed
            if (editAlert.symbol !== selectedItem.symbol) {
                 // Check if old symbol has other alerts
                 const othersWithOldSymbol = updatedAlerts.filter(a => a.symbol === editAlert.symbol && a.id !== editAlert.id);
                 if (othersWithOldSymbol.length === 0) {
                     const oldTopic = `ticker_${editAlert.symbol.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
                     await fcmService.unsubscribeFromTopic(oldTopic);
                 }
                 // New topic subscription will happen below
            }
        } else {
            // Add new
            updatedAlerts = [...alerts, newAlert];
        }

        await storageService.saveAlerts(updatedAlerts);

        // Subscribe to FCM (Always subscribe to ensure we are listening, even if already subscribed)
        const safeSymbol = selectedItem.symbol.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const topic = `ticker_${safeSymbol}`;
        await fcmService.subscribeToTopic(topic);

        showToast(editAlert ? 'Alerta actualizada' : `Alerta creada para ${selectedItem.symbol}`, 'success');
        navigation.goBack();
    } catch (error) {
        console.error('Error saving alert:', error);
        showToast('Error al guardar alerta', 'error');
    } finally {
        setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
      if (!editAlert) return;
      setShowDeleteDialog(false);
      setDeleting(true);
      try {
          const alerts = await storageService.getAlerts();
          const updated = alerts.filter(a => a.id !== editAlert.id);
          await storageService.saveAlerts(updated);

          // Unsubscribe from FCM topic if no remaining alerts for symbol
          const safeSymbol = editAlert.symbol.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          const topic = `ticker_${safeSymbol}`;
          const remainingAlerts = updated.filter(a => a.symbol === editAlert.symbol);
          
          if (remainingAlerts.length === 0) {
              await fcmService.unsubscribeFromTopic(topic);
          }

          showToast('Alerta eliminada', 'success');
          navigation.goBack();
      } catch (error) {
          console.error('Error deleting alert:', error);
          showToast('Error al eliminar alerta', 'error');
      } finally {
          setDeleting(false);
      }
  };

  const renderItem = ({ item }: { item: SymbolItem }) => {
    const isNeutral = Math.abs(item.changePercent) < 0.01;

    return (
      <TouchableOpacity 
        onPress={() => handleSelectItem(item)}
        style={[
          styles.itemCard, 
          { 
              backgroundColor: theme.colors.elevation.level1,
              borderColor: theme.colors.outline,
          }
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{ 
              width: 40, height: 40, 
              borderRadius: 20, 
              backgroundColor: theme.colors.secondaryContainer,
              alignItems: 'center', justifyContent: 'center',
              marginRight: 12
          }}>
              <MaterialCommunityIcons 
                  name={item.iconName || 'currency-usd'} 
                  size={24} 
                  color={theme.colors.onSecondaryContainer} 
              />
          </View>
          <View>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.symbol}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{item.name}</Text>
          </View>
        </View>
        
        <View style={{ alignItems: 'flex-end', gap: 4, minWidth: 80 }}>
          <Text variant="bodyMedium" style={{ fontWeight: 'bold', fontSize: 13 }}>
              {item.price < 1 ? item.price.toFixed(4) : item.price.toFixed(2)}
          </Text>
          <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              backgroundColor: isNeutral 
                  ? (theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                  : (item.changePercent > 0 ? theme.colors.successContainer : theme.colors.errorContainer),
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4
          }}>
              <MaterialCommunityIcons 
                  name={isNeutral ? 'minus' : (item.changePercent > 0 ? 'arrow-up' : 'arrow-down')} 
                  size={12} 
                  color={isNeutral ? theme.colors.onSurfaceVariant : (item.changePercent > 0 ? theme.colors.trendUp : theme.colors.trendDown)} 
              />
              <Text style={{ 
                  fontSize: 10, 
                  fontWeight: 'bold',
                  color: isNeutral ? theme.colors.onSurfaceVariant : (item.changePercent > 0 ? theme.colors.trendUp : theme.colors.trendDown) 
              }}>
                  {Math.abs(item.changePercent).toFixed(2)}%
              </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <UnifiedHeader 
        title={selectedItem ? (editAlert ? "Editar alerta" : "Configurar alerta") : "Nueva alerta"} 
        showNotification={false}
        onBackPress={() => {
            if (selectedItem && !editAlert) {
                setSelectedItem(null);
            } else {
                navigation.goBack();
            }
        }}
      />
      
      {selectedItem ? (
        <ScrollView contentContainerStyle={[styles.configContainer, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
            
            {/* Symbol Header Section */}
            <View style={styles.headerSection}>
                <View style={[styles.iconLarge, { backgroundColor: theme.colors.elevation.level2 }]}>
                    <MaterialCommunityIcons 
                        name={selectedItem.iconName || 'currency-usd'} 
                        size={40} 
                        color={theme.colors.primary} 
                    />
                </View>
                <View style={{ alignItems: 'center' }}>
                    <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>{selectedItem.symbol}</Text>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>{selectedItem.name}</Text>
                </View>
            </View>

            {/* Current Price Section */}
            <View style={[styles.priceCard, { backgroundColor: theme.colors.elevation.level1 }]}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textTransform: 'uppercase' }}>Precio Actual</Text>
                <Text variant="displaySmall" style={{ fontWeight: 'bold', color: theme.colors.onSurface, marginVertical: 4 }}>
                    {selectedItem.price < 1 ? selectedItem.price.toFixed(4) : selectedItem.price.toFixed(2)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialCommunityIcons 
                        name={Math.abs(selectedItem.changePercent) < 0.01 ? 'minus' : (selectedItem.changePercent > 0 ? 'arrow-up' : 'arrow-down')} 
                        size={16} 
                        color={Math.abs(selectedItem.changePercent) < 0.01 ? theme.colors.onSurfaceVariant : (selectedItem.changePercent > 0 ? theme.colors.trendUp : theme.colors.trendDown)} 
                    />
                    <Text variant="bodyMedium" style={{ 
                        color: Math.abs(selectedItem.changePercent) < 0.01 ? theme.colors.onSurfaceVariant : (selectedItem.changePercent > 0 ? theme.colors.trendUp : theme.colors.trendDown),
                        fontWeight: 'bold'
                    }}>
                        {Math.abs(selectedItem.changePercent).toFixed(2)}%
                    </Text>
                </View>
            </View>

            {/* Target Price Input */}
            <View style={styles.sectionContainer}>
                <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: 'bold' }}>Configurar Objetivo</Text>
                <TextInput
                    mode="outlined"
                    label="Precio Objetivo"
                    value={targetPrice}
                    onChangeText={setTargetPrice}
                    keyboardType="numeric"
                    placeholder="0.00"
                    right={<TextInput.Icon icon="target" />}
                    style={{ backgroundColor: theme.colors.background }}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                />
                
                {/* Dynamic Difference Indicator */}
                {(() => {
                    const current = selectedItem.price;
                    const target = parseFloat(targetPrice) || 0;
                    if (target > 0) {
                        const diff = ((target - current) / current) * 100;
                        const isDiffNeutral = Math.abs(diff) < 0.01;
                        const isPositive = diff > 0;
                        
                        let color = theme.colors.onSurfaceVariant;
                        let bgColor = theme.colors.elevation.level2;
                        let icon = 'minus-circle-outline';
                        let text = 'Igual al precio actual';
                        
                        if (!isDiffNeutral) {
                            if (isPositive) {
                                color = theme.colors.trendUp;
                                bgColor = theme.colors.successContainer; // Use theme container if available or fallback
                                icon = 'trending-up';
                                text = `+${diff.toFixed(2)}% vs precio actual`;
                            } else {
                                color = theme.colors.trendDown;
                                bgColor = theme.colors.errorContainer;
                                icon = 'trending-down';
                                text = `${diff.toFixed(2)}% vs precio actual`;
                            }
                        }

                        return (
                            <View style={[styles.diffIndicator, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline, marginTop: 12 }]}>
                                <MaterialCommunityIcons name={icon} size={20} color={color} />
                                <Text variant="bodyMedium" style={{ color: color, fontWeight: 'bold', marginLeft: 8 }}>
                                    {text}
                                </Text>
                            </View>
                        );
                    }
                    return null;
                })()}
            </View>

            {/* Condition Selector */}
            <View style={styles.sectionContainer}>
                <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: 'bold' }}>Condición de Alerta</Text>
                <View style={[styles.conditionSelector, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline }]}>
                    <TouchableOpacity 
                        style={[
                            styles.conditionOption, 
                            condition === 'above' && { backgroundColor: theme.colors.success }
                        ]}
                        onPress={() => setCondition('above')}
                    >
                        <MaterialCommunityIcons 
                            name="arrow-top-right" 
                            size={20} 
                            color={condition === 'above' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} 
                        />
                        <Text style={{ 
                            marginLeft: 8,
                            color: condition === 'above' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                            fontWeight: condition === 'above' ? 'bold' : 'normal'
                        }}>Mayor que</Text>
                    </TouchableOpacity>

                    <View style={{ width: 1, backgroundColor: theme.colors.outline, marginVertical: 8 }} />

                    <TouchableOpacity 
                        style={[
                            styles.conditionOption, 
                            condition === 'below' && { backgroundColor: theme.colors.error }
                        ]}
                        onPress={() => setCondition('below')}
                    >
                        <MaterialCommunityIcons 
                            name="arrow-bottom-right" 
                            size={20} 
                            color={condition === 'below' ? theme.colors.onError : theme.colors.onSurfaceVariant} 
                        />
                        <Text style={{ 
                            marginLeft: 8,
                            color: condition === 'below' ? theme.colors.onError : theme.colors.onSurfaceVariant,
                            fontWeight: condition === 'below' ? 'bold' : 'normal'
                        }}>Menor que</Text>
                    </TouchableOpacity>
                </View>
                <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                    {condition === 'above' 
                        ? `La alerta se activará cuando el precio suba a ${targetPrice || '...'}` 
                        : `La alerta se activará cuando el precio baje a ${targetPrice || '...'}`}
                </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.sectionContainer}>
                <CustomButton
                    variant="primary"
                    onPress={handleSaveAlert}
                    loading={saving}
                    disabled={!targetPrice || saving || deleting}
                    icon={editAlert ? "content-save-outline" : "bell-plus-outline"}
                    label={editAlert ? "Guardar cambios" : "Crear alerta"}
                    style={{ marginBottom: 12 }}
                />
                
                {editAlert && (
                    <CustomButton
                        variant="outlined-destructive"
                        onPress={() => setShowDeleteDialog(true)}
                        loading={deleting}
                        disabled={saving || deleting}
                        icon="trash-can-outline"
                        label="Eliminar alerta"
                    />
                )}
            </View>

            {/* Disclaimer Section */}
            <View style={[styles.disclaimerContainer, { backgroundColor: theme.colors.elevation.level1 }]}>
                <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.onSurfaceVariant} style={{ marginRight: 8 }} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                    Nota: Las alertas pueden tener un ligero retraso dependiendo de la conectividad y las actualizaciones del mercado. Asegúrate de tener las notificaciones activadas para VTradingAPP.
                </Text>
            </View>

        </ScrollView>
      ) : (
        <>
            <View style={styles.searchSection}>
                <SearchBar 
                    placeholder="Buscar divisa, cripto o acción..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <FilterSection
                    options={[
                        { label: 'Todas', value: 'Todas', icon: 'apps' },
                        { label: 'Divisas', value: 'Divisas', icon: 'currency-usd' },
                        { label: 'Cripto', value: 'Cripto', icon: 'currency-btc' },
                        { label: 'Acciones', value: 'Acciones', icon: 'domain' },
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
                    showsVerticalScrollIndicator={false}
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

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        visible={showDeleteDialog}
        onDismiss={() => setShowDeleteDialog(false)}
        title="Eliminar Alerta"
        content={`¿Estás seguro que deseas eliminar la alerta para ${selectedItem?.symbol}?`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Eliminar"
        isDestructive={true}
        cancelMode="outlined"
      />
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
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 0,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  // Config Styles
  configContainer: {
    padding: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  iconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  priceCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  diffIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  conditionSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  conditionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'flex-start',
  },
});

export default AddAlertScreen;