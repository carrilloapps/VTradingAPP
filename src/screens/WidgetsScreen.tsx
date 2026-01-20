import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, Switch } from 'react-native';
import { Text, TextInput, IconButton, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import UnifiedHeader from '../components/ui/UnifiedHeader';
import { useAppTheme } from '../theme/theme';
import CustomButton from '../components/ui/CustomButton';
import DeviceInfo from 'react-native-device-info';
import { CurrencyService, CurrencyRate } from '../services/CurrencyService';
import { TetherIcon } from '../components/ui/TetherIcon';
import WidgetPreview, { WidgetItem } from '../components/widgets/WidgetPreview';
import CurrencyPickerModal from '../components/dashboard/CurrencyPickerModal';
import { storageService, WidgetConfig } from '../services/StorageService';
import { useToast } from '../context/ToastContext';

const APP_VERSION = DeviceInfo.getVersion();

// Helper to format rate for widget display
const mapRateToWidgetItem = (rate: CurrencyRate): WidgetItem => {
    const isUp = (rate.changePercent || 0) > 0;
    const isDown = (rate.changePercent || 0) < 0;
    
    return {
        id: rate.id,
        // Simplificar nombre: "DOLAR BCV" en lugar de "USD/VES • BCV" si es posible, o usar el name
        label: rate.name.split('•')[0].replace('/VES', '').trim().toUpperCase() + (rate.name.includes('•') ? ` (${rate.name.split('•')[1].trim()})` : ''),
        value: rate.value.toFixed(2),
        currency: 'VES',
        trend: isUp ? 'up' : isDown ? 'down' : 'neutral',
        trendValue: `${isUp ? '+' : ''}${rate.changePercent || 0}%`,
        trendColor: isUp ? '#2E8B57' : isDown ? '#AE4158' : '#64748B',
        trendBg: isUp ? 'rgba(46, 139, 87, 0.15)' : isDown ? 'rgba(174, 65, 88, 0.15)' : 'rgba(100, 116, 139, 0.15)'
    };
};

const WidgetsScreen = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showToast } = useToast();

  // Data State
  const [availableRates, setAvailableRates] = useState<CurrencyRate[]>([]);
  const [selectedRates, setSelectedRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);

  // Customization State
  const [isTransparent, setIsTransparent] = useState(false);
  const [showGraph, setShowGraph] = useState(true);
  const [isWidgetDarkMode, setIsWidgetDarkMode] = useState(theme.dark);
  const [isWallpaperDark, setIsWallpaperDark] = useState(theme.dark);
  const [widgetTitle, setWidgetTitle] = useState(`VTrading • ${APP_VERSION}`);
  // visibleItemCount removed as it should be automatic
  const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const rates = await CurrencyService.getRates();
        setAvailableRates(rates);
        
        // Load saved config
        const config = await storageService.getWidgetConfig();
        
        if (config) {
            setWidgetTitle(config.title);
            setIsWallpaperDark(config.isWallpaperDark);
            setIsTransparent(config.isTransparent);
            setShowGraph(config.showGraph);
            setIsWidgetDarkMode(config.isWidgetDarkMode);
            
            if (config.selectedCurrencyIds && config.selectedCurrencyIds.length > 0) {
                // Restore selected rates maintaining order
                const restoredRates = config.selectedCurrencyIds
                    .map(id => rates.find(r => r.id === id))
                    .filter(r => r !== undefined) as CurrencyRate[];
                    
                if (restoredRates.length > 0) {
                    setSelectedRates(restoredRates);
                } else {
                    setDefaultRates(rates);
                }
            } else {
                setDefaultRates(rates);
            }
        } else {
            setDefaultRates(rates);
        }
    } catch (error) {
        console.error('Error loading data for widget:', error);
        showToast('Error cargando datos', 'error');
    } finally {
        setLoading(false);
    }
  };

  const setDefaultRates = (rates: CurrencyRate[]) => {
    const defaults: CurrencyRate[] = [];
    // Prioritize USD Fiat (BCV) and USDT
    const usd = rates.find(r => r.code === 'USD' && r.type === 'fiat');
    const usdt = rates.find(r => r.code === 'USDT');
    
    if (usd) defaults.push(usd);
    if (usdt) defaults.push(usdt);
    
    // Fallback if defaults not found
    if (defaults.length === 0 && rates.length > 0) {
        defaults.push(...rates.slice(0, 2));
    }

    setSelectedRates(defaults);
  };

  const handleSave = async () => {
    try {
        const config: WidgetConfig = {
            title: widgetTitle,
            selectedCurrencyIds: selectedRates.map(r => r.id),
            isWallpaperDark,
            isTransparent,
            showGraph,
            isWidgetDarkMode
        };
        await storageService.saveWidgetConfig(config);
        showToast('Configuración guardada', 'success');
        navigation.goBack();
    } catch (error) {
        console.error('Error saving widget config:', error);
        showToast('Error al guardar', 'error');
    }
  };

  // Order & Selection Handlers
  const moveRate = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === selectedRates.length - 1) return;

      const newRates = [...selectedRates];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newRates[index], newRates[targetIndex]] = [newRates[targetIndex], newRates[index]];
      setSelectedRates(newRates);
  };

  const toggleRateSelection = (rate: CurrencyRate) => {
      const isSelected = selectedRates.some(r => r.id === rate.id);
      
      if (isSelected) {
          setSelectedRates(prev => prev.filter(r => r.id !== rate.id));
      } else {
          if (selectedRates.length >= 4) {
              // Optional: Show toast "Max 4 items"
              return; 
          }
          setSelectedRates(prev => [...prev, rate]);
      }
  };

  // Widget Preview Data
  const widgetItems = selectedRates.map(mapRateToWidgetItem);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        backgroundColor="transparent"
        translucent 
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
      />
      
      <UnifiedHeader 
        variant="simple" 
        title="Personalización" 
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            Previsualiza cómo se verá el widget <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Widget Tracker</Text> en tu pantalla de inicio para Android e iOS.
          </Text>
        </View>

        {/* Mockup Container */}
        <WidgetPreview 
            items={widgetItems}
            widgetTitle={widgetTitle}
            isWallpaperDark={isWallpaperDark}
            isTransparent={isTransparent}
            isWidgetDarkMode={isWidgetDarkMode}
            showGraph={showGraph}
        />

        {/* Customization Section */}
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>PERSONALIZACIÓN</Text>

            <View style={[styles.cardContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.elevation.level1 }]}>
                {/* Title Input */}
                <View style={[styles.prefRow, { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryContainer }]}>
                            <MaterialIcons name="title" size={20} color={theme.colors.onPrimaryContainer} />
                        </View>
                        <Text variant="bodyLarge" style={[styles.prefText, { color: theme.colors.onSurface, marginLeft: 12 }]}>Título del Widget</Text>
                    </View>
                    <TextInput
                        mode="outlined"
                        value={widgetTitle}
                        onChangeText={setWidgetTitle}
                        placeholder="Escribe un título..."
                        style={{ backgroundColor: theme.colors.background }}
                        dense
                    />
                </View>

                <View style={[styles.separator, { backgroundColor: theme.colors.outline }]} />

                {/* Currency Header */}
                <View style={styles.prefRow}>
                     <View style={styles.prefLeft}>
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.elevation.level2 }]}>
                            <MaterialIcons name="attach-money" size={20} color={theme.colors.onSurfaceVariant} />
                        </View>
                        <Text variant="bodyLarge" style={[styles.prefText, { color: theme.colors.onSurface }]}>Divisas ({selectedRates.length})</Text>
                     </View>
                     <Button mode="text" onPress={() => setIsSelectionModalVisible(true)} compact>
                        Editar
                    </Button>
                </View>

                {/* Currency List */}
                {selectedRates.map((rate, index) => {
                    let iconElement;
                    if (rate.code === 'USDT') {
                        iconElement = (
                            <View style={{ width: 24, height: 24, borderRadius: 12, overflow: 'hidden' }}>
                                <TetherIcon backgroundColor={theme.colors.secondaryContainer} contentColor={theme.colors.onSecondaryContainer} />
                            </View>
                        );
                    } else if (rate.type === 'crypto') {
                        iconElement = (
                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F7931A', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>₿</Text>
                            </View>
                        );
                    } else {
                        iconElement = <MaterialIcons name={rate.iconName || 'attach-money'} size={24} color={theme.colors.onSurfaceVariant} />;
                    }

                    return (
                        <React.Fragment key={rate.id}>
                             <View style={[styles.separator, { backgroundColor: theme.colors.outline }]} />
                             <View style={[styles.prefRow, { paddingVertical: 8 }]}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                     {iconElement}
                                     <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1, color: theme.colors.onSurface }}>{rate.name}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconButton icon="arrow-up" size={20} disabled={index === 0} onPress={() => moveRate(index, 'up')} />
                                    <IconButton icon="arrow-down" size={20} disabled={index === selectedRates.length - 1} onPress={() => moveRate(index, 'down')} />
                                </View>
                             </View>
                        </React.Fragment>
                    );
                })}
                
                {selectedRates.length === 0 && (
                     <Text style={{ textAlign: 'center', color: theme.colors.error, padding: 16 }}>Selecciona al menos una divisa</Text>
                )}
            </View>
        </View>

        <View style={styles.section}>
             <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>APARIENCIA</Text>
             <View style={[styles.cardContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.elevation.level1 }]}>
                 {/* Wallpaper */}
                 <View style={styles.prefRow}>
                    <View style={styles.prefLeft}>
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.elevation.level2 }]}>
                             <MaterialIcons name="wallpaper" size={20} color={theme.colors.onSurfaceVariant} />
                        </View>
                        <Text variant="bodyLarge" style={[styles.prefText, { color: theme.colors.onSurface }]}>Fondo de pantalla oscuro</Text>
                    </View>
                    <Switch 
                        value={isWallpaperDark} 
                        onValueChange={setIsWallpaperDark}
                        trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary }}
                        thumbColor={'#FFF'}
                    />
                 </View>
                 
                 <View style={[styles.separator, { backgroundColor: theme.colors.outline }]} />
                 
                 {/* Transparent */}
                 <View style={styles.prefRow}>
                    <View style={styles.prefLeft}>
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.elevation.level2 }]}>
                             <MaterialIcons name="opacity" size={20} color={theme.colors.onSurfaceVariant} />
                        </View>
                        <Text variant="bodyLarge" style={[styles.prefText, { color: theme.colors.onSurface }]}>Widget transparente</Text>
                    </View>
                    <Switch 
                        value={isTransparent} 
                        onValueChange={setIsTransparent}
                        trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary }}
                        thumbColor={'#FFF'}
                    />
                 </View>

                 <View style={[styles.separator, { backgroundColor: theme.colors.outline }]} />

                 {/* Graph */}
                 <View style={styles.prefRow}>
                    <View style={styles.prefLeft}>
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.elevation.level2 }]}>
                             <MaterialIcons name="show-chart" size={20} color={theme.colors.onSurfaceVariant} />
                        </View>
                        <Text variant="bodyLarge" style={[styles.prefText, { color: theme.colors.onSurface }]}>Mostrar porcentaje</Text>
                    </View>
                    <Switch 
                        value={showGraph} 
                        onValueChange={setShowGraph}
                        trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary }}
                        thumbColor={'#FFF'}
                    />
                 </View>

                 <View style={[styles.separator, { backgroundColor: theme.colors.outline }]} />

                 {/* Dark Mode */}
                 <View style={styles.prefRow}>
                    <View style={styles.prefLeft}>
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.elevation.level2 }]}>
                             <MaterialIcons name="brightness-6" size={20} color={theme.colors.onSurfaceVariant} />
                        </View>
                        <Text variant="bodyLarge" style={[styles.prefText, { color: theme.colors.onSurface }]}>Widget modo oscuro</Text>
                    </View>
                    <Switch 
                        value={isWidgetDarkMode} 
                        onValueChange={setIsWidgetDarkMode}
                        trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary }}
                        thumbColor={'#FFF'}
                    />
                 </View>
             </View>
        </View>

      </ScrollView>

      {/* Footer Action */}
      <View style={[styles.footer, { 
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.outline,
          paddingBottom: insets.bottom + 16
      }]}>
          <CustomButton 
            label="Guardar" 
            onPress={handleSave} 
            variant="primary"
            icon="content-save"
          />
      </View>

      {/* Selection Modal */}
      <CurrencyPickerModal
        visible={isSelectionModalVisible}
        onDismiss={() => setIsSelectionModalVisible(false)}
        rates={availableRates}
        multiSelect={true}
        selectedIds={selectedRates.map(r => r.id)}
        onToggle={toggleRateSelection}
        title="Seleccionar Divisas"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  cardContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 0,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prefText: {
    fontWeight: '500',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
  },
  headerSection: {
    marginBottom: 24,
  },
  mockupContainer: {
    borderRadius: 32,
    borderWidth: 8,
    overflow: 'hidden',
    marginBottom: 32,
    aspectRatio: 9/16,
    maxHeight: 600,
    alignSelf: 'center',
    width: '80%',
    elevation: 4,
  },
  wallpaper: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  statusBarMockup: {
    position: 'absolute',
    top: 12,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});

export default WidgetsScreen;
