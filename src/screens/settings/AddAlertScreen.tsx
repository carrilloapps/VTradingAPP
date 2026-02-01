import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text, ActivityIndicator, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import UnifiedHeader from '@/components/ui/UnifiedHeader';
import { BolivarIcon } from '@/components/ui/BolivarIcon';
import SearchBar from '@/components/ui/SearchBar';
import FilterSection from '@/components/ui/FilterSection';
import CustomButton from '@/components/ui/CustomButton';
import CustomDialog from '@/components/ui/CustomDialog';
import AddAlertSkeleton from '@/components/settings/AddAlertSkeleton';
import { useAppTheme } from '@/theme';
import { CurrencyService } from '@/services/CurrencyService';
import { StocksService } from '@/services/StocksService';
import { storageService, UserAlert } from '@/services/StorageService';
import { fcmService } from '@/services/firebase/FCMService';
import { useToastStore } from '@/stores/toastStore';
import { observabilityService } from '@/services/ObservabilityService';
import {
  analyticsService,
  ANALYTICS_EVENTS,
} from '@/services/firebase/AnalyticsService';
import { RootStackParamList } from '@/navigation/AppNavigator';

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

const ItemSeparator = () => <View style={styles.separatorHeight} />;

const AddAlertScreen = ({ route }: Props) => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore(state => state.showToast);

  // Params for Edit Mode
  const editAlert = route.params?.editAlert;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'Todas' | 'Divisas' | 'Cripto' | 'Acciones'
  >('Todas');
  const [items, setItems] = useState<SymbolItem[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category Filter
      if (selectedCategory === 'Divisas' && item.type !== 'Divisa')
        return false;
      if (selectedCategory === 'Cripto' && item.type !== 'Cripto') return false;
      if (selectedCategory === 'Acciones' && item.type !== 'Acción')
        return false;

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
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [pushEnabled, setPushEnabled] = useState(true);

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      const hasSystemPermission = await fcmService.checkPermission();
      const settings = await storageService.getSettings();
      setHasPermissions(hasSystemPermission);
      setPushEnabled(settings.pushEnabled);
    };

    checkPermissions();
  }, []);

  // Effects moved below

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [rates, stocks] = await Promise.all([
        CurrencyService.getRates(),
        StocksService.getAllStocks(),
      ]);

      const itemsMap = new Map<string, SymbolItem>();
      const usdRate = rates.find(r => r.code === 'USD')?.value || 1;

      // 1. Process Currencies & Crypto
      rates.forEach(r => {
        // Skip base currency to avoid VES/VES
        if (r.code === 'VES') return;

        // CODE/VES (e.g. USD/VES)
        const id1 = `${r.code}/VES`;
        // Determine simple name: Use r.name but if it contains complex description, simplify.
        // Usually r.name is "Dólar", "Euro", etc.
        // For standard currencies, just use the name.
        itemsMap.set(id1, {
          id: id1,
          symbol: id1,
          name: r.name.split('•')[0].trim(), // Remove source details if present
          price: r.value,
          type: r.type === 'crypto' ? 'Cripto' : 'Divisa',
          changePercent: r.changePercent || 0,
          iconName: r.type === 'crypto' ? 'currency-btc' : 'currency-usd',
        });

        // VES/CODE (Inverse) - e.g. VES/COP
        if (r.value > 0) {
          const id2 = `VES/${r.code}`;
          itemsMap.set(id2, {
            id: id2,
            symbol: id2,
            name: `VES vs. ${r.code}`, // Simplified name
            price: 1 / r.value,
            type: r.type === 'crypto' ? 'Cripto' : 'Divisa',
            changePercent: r.changePercent ? -r.changePercent : 0, // Approx inverse change
            iconName: 'Bs',
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
            name: r.name.split('•')[0].trim(), // Simplified name
            price: priceUsd,
            type: 'Cripto',
            changePercent: r.changePercent || 0,
            iconName: 'currency-btc',
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
          iconName: 'domain',
        });
      });

      setItems(Array.from(itemsMap.values()));
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AddAlertScreen.loadData',
        action: 'load_market_data',
      });
      await analyticsService.logError('load_market_data', {
        screen: 'AddAlertScreen',
      });
      showToast('Error cargando datos de mercado', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const renderEmptyList = useCallback(
    () => (
      <View style={styles.centerContainer}>
        <Text
          variant="bodyLarge"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          No se encontraron resultados
        </Text>
      </View>
    ),
    [theme.colors.onSurfaceVariant],
  );

  if (loading || hasPermissions === null) {
    return <AddAlertSkeleton variant={editAlert ? 'form' : 'list'} />;
  }

  // Si no tiene permisos O notificaciones deshabilitadas, mostrar estado vacío
  if (!hasPermissions || !pushEnabled) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <UnifiedHeader
          variant="simple"
          title={editAlert ? 'Editar alerta' : 'Nueva alerta'}
          onBackPress={() => navigation.goBack()}
        />

        <View style={styles.noPermissionsContainer}>
          <View
            style={[
              styles.noPermissionsIconContainer,
              { backgroundColor: theme.colors.elevation.level2 },
            ]}
          >
            <MaterialCommunityIcons
              name="bell-alert-outline"
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
          </View>

          <Text
            variant="headlineSmall"
            style={[
              styles.noPermissionsTitle,
              { color: theme.colors.onSurface },
            ]}
          >
            {!hasPermissions
              ? 'Activa las notificaciones'
              : 'Notificaciones pausadas'}
          </Text>

          <Text
            variant="bodyLarge"
            style={[
              styles.noPermissionsDescription,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {!hasPermissions
              ? 'Para crear alertas de precios, primero debes activar las notificaciones en tu dispositivo.'
              : 'Has desactivado las notificaciones. Actívalas en Ajustes para poder crear y gestionar alertas.'}
          </Text>

          <CustomButton
            variant="primary"
            onPress={() => navigation.navigate('Settings' as never)}
            icon="cog"
            label="Ir a Ajustes"
          />
        </View>
      </View>
    );
  }

  const handleSelectItem = (item: SymbolItem) => {
    setSelectedItem(item);
    // Only reset target/condition if we are NOT editing or if we changed the symbol (which effectively is a reset)
    // But since handleSelectItem is triggered by user tap, it implies a change.
    setTargetPrice(item.price.toFixed(item.price < 1 ? 4 : 2));
    setCondition('above');
    Keyboard.dismiss();
  };

  const handleSetCurrentPrice = () => {
    if (!selectedItem) return;
    setTargetPrice(selectedItem.price.toFixed(selectedItem.price < 1 ? 4 : 2));
    showToast('Precio objetivo actualizado al valor actual', 'success');
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
        iconName: selectedItem.iconName || 'bell-ring',
      };

      let updatedAlerts: UserAlert[];

      if (editAlert) {
        // Update existing
        updatedAlerts = alerts.map(a => (a.id === editAlert.id ? newAlert : a));

        // Handle Topic Change if symbol changed
        if (editAlert.symbol !== selectedItem.symbol) {
          // Check if old symbol has other alerts
          const othersWithOldSymbol = updatedAlerts.filter(
            a => a.symbol === editAlert.symbol && a.id !== editAlert.id,
          );
          if (othersWithOldSymbol.length === 0) {
            const oldTopic = `ticker_${editAlert.symbol.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
            await fcmService.unsubscribeFromTopic(oldTopic);
          }
          // New topic subscription will happen below
        }

        await analyticsService.logEvent(ANALYTICS_EVENTS.UPDATE_ALERT, {
          symbol: selectedItem.symbol,
          target: parseFloat(targetPrice),
          condition: condition,
        });
      } else {
        // Add new
        updatedAlerts = [...alerts, newAlert];
        await analyticsService.logEvent(ANALYTICS_EVENTS.CREATE_ALERT, {
          symbol: selectedItem.symbol,
          target: parseFloat(targetPrice),
          condition: condition,
        });
      }

      await storageService.saveAlerts(updatedAlerts);
      await analyticsService.setUserProperty(
        'alert_count',
        updatedAlerts.length.toString(),
      );

      // Subscribe to FCM (Always subscribe to ensure we are listening, even if already subscribed)
      const safeSymbol = selectedItem.symbol
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();
      const topic = `ticker_${safeSymbol}`;
      await fcmService.subscribeToTopic(topic);

      showToast(
        editAlert
          ? 'Alerta actualizada'
          : `Alerta creada para ${selectedItem.symbol}`,
        'success',
      );
      navigation.goBack();
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AddAlertScreen.handleSaveAlert',
        symbol: selectedItem.symbol,
        target: targetPrice,
        condition: condition,
        isEdit: !!editAlert,
      });
      await analyticsService.logError('save_alert', {
        symbol: selectedItem.symbol,
        is_edit: !!editAlert,
      });
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
      await analyticsService.setUserProperty(
        'alert_count',
        updated.length.toString(),
      );

      // Unsubscribe from FCM topic if no remaining alerts for symbol
      const safeSymbol = editAlert.symbol
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();
      const topic = `ticker_${safeSymbol}`;
      const remainingAlerts = updated.filter(
        a => a.symbol === editAlert.symbol,
      );

      if (remainingAlerts.length === 0) {
        await fcmService.unsubscribeFromTopic(topic);
      }

      await analyticsService.logEvent(ANALYTICS_EVENTS.DELETE_ALERT, {
        symbol: editAlert.symbol,
      });
      showToast('Alerta eliminada', 'success');
      navigation.goBack();
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AddAlertScreen.handleDeleteConfirm',
        symbol: editAlert.symbol,
        alertId: editAlert.id,
      });
      await analyticsService.logError('delete_alert', {
        symbol: editAlert.symbol,
      });
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
          },
        ]}
      >
        <View style={styles.rowAlignCenterFlex1}>
          <View
            style={[
              styles.iconContainerCircular,
              { backgroundColor: theme.colors.secondaryContainer },
            ]}
          >
            {item.iconName === 'Bs' ? (
              <BolivarIcon
                color={theme.colors.onSecondaryContainer}
                size={24}
              />
            ) : (
              <MaterialCommunityIcons
                name={item.iconName || 'currency-usd'}
                size={24}
                color={theme.colors.onSecondaryContainer}
              />
            )}
          </View>
          <View>
            <Text variant="titleMedium" style={styles.fontWeightBold}>
              {item.symbol}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {item.name}
            </Text>
          </View>
        </View>

        <View style={styles.alignEndGap4MinWidth80}>
          <Text variant="bodyMedium" style={styles.boldTextFontSize13}>
            {item.price < 1 ? item.price.toFixed(4) : item.price.toFixed(2)}
          </Text>
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: isNeutral
                  ? theme.dark
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.05)'
                  : item.changePercent > 0
                    ? theme.colors.successContainer
                    : theme.colors.errorContainer,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                isNeutral
                  ? 'minus'
                  : item.changePercent > 0
                    ? 'arrow-up'
                    : 'arrow-down'
              }
              size={12}
              color={
                isNeutral
                  ? theme.colors.onSurfaceVariant
                  : item.changePercent > 0
                    ? theme.colors.trendUp
                    : theme.colors.trendDown
              }
            />
            <Text
              style={[
                styles.trendBadgeText,
                {
                  color: isNeutral
                    ? theme.colors.onSurfaceVariant
                    : item.changePercent > 0
                      ? theme.colors.trendUp
                      : theme.colors.trendDown,
                },
              ]}
            >
              {Math.abs(item.changePercent).toFixed(2)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <UnifiedHeader
        title={
          selectedItem
            ? editAlert
              ? 'Editar alerta'
              : 'Configurar alerta'
            : 'Nueva alerta'
        }
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
        <ScrollView
          contentContainerStyle={[
            styles.configContainer,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Symbol Header Section */}
          <View style={styles.headerSection}>
            <View
              style={[
                styles.iconLarge,
                { backgroundColor: theme.colors.elevation.level2 },
              ]}
            >
              {selectedItem.iconName === 'Bs' ? (
                <BolivarIcon color={theme.colors.primary} size={40} />
              ) : (
                <MaterialCommunityIcons
                  name={selectedItem.iconName || 'currency-usd'}
                  size={40}
                  color={theme.colors.primary}
                />
              )}
            </View>
            <View style={styles.centerText}>
              <Text variant="headlineMedium" style={styles.symbolHeadline}>
                {selectedItem.symbol}
              </Text>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {selectedItem.name}
              </Text>
            </View>
          </View>

          {/* Current Price Section */}
          <View
            style={[
              styles.priceCard,
              { backgroundColor: theme.colors.elevation.level1 },
            ]}
          >
            <Text
              variant="labelMedium"
              style={[
                styles.currentPriceLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Precio Actual
            </Text>
            <Text
              variant="displaySmall"
              style={[
                styles.currentPriceValue,
                { color: theme.colors.onSurface },
              ]}
            >
              {selectedItem.price < 1
                ? selectedItem.price.toFixed(4)
                : selectedItem.price.toFixed(2)}
            </Text>
            <View style={styles.priceChangeRow}>
              <MaterialCommunityIcons
                name={
                  Math.abs(selectedItem.changePercent) < 0.01
                    ? 'minus'
                    : selectedItem.changePercent > 0
                      ? 'arrow-up'
                      : 'arrow-down'
                }
                size={16}
                color={
                  Math.abs(selectedItem.changePercent) < 0.01
                    ? theme.colors.onSurfaceVariant
                    : selectedItem.changePercent > 0
                      ? theme.colors.trendUp
                      : theme.colors.trendDown
                }
              />
              <Text
                variant="bodyMedium"
                style={[
                  styles.priceChangeText,
                  {
                    color:
                      Math.abs(selectedItem.changePercent) < 0.01
                        ? theme.colors.onSurfaceVariant
                        : selectedItem.changePercent > 0
                          ? theme.colors.trendUp
                          : theme.colors.trendDown,
                  },
                ]}
              >
                {Math.abs(selectedItem.changePercent).toFixed(2)}%
              </Text>
            </View>
          </View>

          {/* Target Price Input */}
          <View style={styles.sectionContainer}>
            <Text variant="titleMedium" style={styles.configHeaderBold}>
              Configurar Objetivo
            </Text>
            <TextInput
              mode="outlined"
              label="Precio Objetivo"
              value={targetPrice}
              onChangeText={setTargetPrice}
              keyboardType="numeric"
              placeholder="0.00"
              right={
                <TextInput.Icon icon="target" onPress={handleSetCurrentPrice} />
              }
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
                let icon = 'minus-circle-outline';
                let text = 'Igual al precio actual';

                if (!isDiffNeutral) {
                  if (isPositive) {
                    color = theme.colors.trendUp;
                    icon = 'trending-up';
                    text = `+${diff.toFixed(2)}% vs precio actual`;
                  } else {
                    color = theme.colors.trendDown;
                    icon = 'trending-down';
                    text = `${diff.toFixed(2)}% vs precio actual`;
                  }
                }

                return (
                  <View
                    style={[
                      styles.diffIndicator,
                      styles.diffIndicatorMargin,
                      {
                        backgroundColor: theme.colors.elevation.level1,
                        borderColor: theme.colors.outline,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={icon}
                      size={20}
                      color={color}
                    />
                    <Text
                      variant="bodyMedium"
                      style={[styles.diffIndicatorText, { color: color }]}
                    >
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
            <Text variant="titleMedium" style={styles.configHeaderBold}>
              Condición de Alerta
            </Text>
            <View
              style={[
                styles.conditionSelector,
                {
                  backgroundColor: theme.colors.elevation.level1,
                  borderColor: theme.colors.outline,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.conditionOption,
                  condition === 'above' && {
                    backgroundColor: theme.colors.success,
                  },
                ]}
                onPress={() => setCondition('above')}
              >
                <MaterialCommunityIcons
                  name="arrow-top-right"
                  size={20}
                  color={
                    condition === 'above'
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant
                  }
                />
                <Text
                  style={[
                    styles.conditionTextNormal,
                    {
                      color:
                        condition === 'above'
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Mayor que
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.conditionDivider,
                  { backgroundColor: theme.colors.outline },
                ]}
              />

              <TouchableOpacity
                style={[
                  styles.conditionOption,
                  condition === 'below' && {
                    backgroundColor: theme.colors.error,
                  },
                ]}
                onPress={() => setCondition('below')}
              >
                <MaterialCommunityIcons
                  name="arrow-bottom-right"
                  size={20}
                  color={
                    condition === 'below'
                      ? theme.colors.onError
                      : theme.colors.onSurfaceVariant
                  }
                />
                <Text
                  style={[
                    styles.conditionTextNormal,
                    {
                      color:
                        condition === 'below'
                          ? theme.colors.onError
                          : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Menor que
                </Text>
              </TouchableOpacity>
            </View>
            <Text
              variant="bodySmall"
              style={[
                styles.conditionDescription,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
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
              icon={editAlert ? 'content-save-outline' : 'bell-plus-outline'}
              label={editAlert ? 'Guardar cambios' : 'Crear alerta'}
              style={styles.saveButton}
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
          <View
            style={[
              styles.disclaimerContainer,
              { backgroundColor: theme.colors.elevation.level1 },
            ]}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={theme.colors.onSurfaceVariant}
              style={styles.disclaimerIconMargin}
            />
            <Text
              variant="bodySmall"
              style={[
                styles.disclaimerText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Nota: Las alertas pueden tener un ligero retraso dependiendo de la
              conectividad y las actualizaciones del mercado. Asegúrate de tener
              las notificaciones activadas para VTradingAPP.
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
              onSelect={val => setSelectedCategory(val as any)}
              style={styles.filterSectionNegativeMargin}
            />
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <FlashList
              data={filteredItems}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom + 16 },
              ]}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={ItemSeparator}
              ListEmptyComponent={renderEmptyList}
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
  separatorHeight: {
    height: 8,
  },
  centerText: {
    alignItems: 'center',
  },
  symbolHeadline: {
    fontWeight: 'bold',
  },
  currentPriceLabel: {
    textTransform: 'uppercase',
  },
  currentPriceValue: {
    fontWeight: 'bold',
    marginVertical: 4,
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceChangeText: {
    fontWeight: 'bold',
  },
  configHeaderBold: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  diffIndicatorMargin: {
    marginTop: 12,
  },
  diffIndicatorText: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  conditionDivider: {
    width: 1,
    marginVertical: 8,
  },
  conditionText: {
    marginLeft: 8,
  },
  conditionTextBold: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  conditionDescription: {
    marginTop: 8,
    textAlign: 'center',
  },
  saveButton: {
    marginBottom: 12,
  },
  disclaimerIconMargin: {
    marginRight: 8,
  },
  disclaimerText: {
    flex: 1,
  },
  conditionTextNormal: {
    marginLeft: 8,
    fontWeight: 'normal',
  },
  rowAlignCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marginLeft8: {
    marginLeft: 8,
  },
  paddingVertical8: {
    paddingVertical: 8,
  },
  borderRadius8: {
    borderRadius: 8,
  },
  flex1Style: {
    flex: 1,
  },
  rowAlignCenterFlex1: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainerCircular: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fontWeightBold: {
    fontWeight: 'bold',
  },
  alignEndGap4MinWidth80: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 80,
  },
  boldTextFontSize13: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterSectionNegativeMargin: {
    marginTop: 12,
    marginLeft: -16,
    marginRight: -16,
  },
  noPermissionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noPermissionsIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noPermissionsTitle: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  noPermissionsDescription: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
});

export default AddAlertScreen;
