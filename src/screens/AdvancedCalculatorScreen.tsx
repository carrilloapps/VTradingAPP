import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  StatusBar,
  Keyboard,
  RefreshControl,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text, useTheme, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useNavigation } from '@react-navigation/native';
import { CurrencyService, CurrencyRate } from '@/services/CurrencyService';
import { observabilityService } from '@/services/ObservabilityService';
import { useToastStore } from '@/stores/toastStore';
import { storageService, CalculatorConfig } from '@/services/StorageService';
import CurrencyPickerModal from '@/components/dashboard/CurrencyPickerModal';
import CurrencySelectorButton from '@/components/dashboard/CurrencySelectorButton';
import UnifiedHeader from '@/components/ui/UnifiedHeader';
import MarketStatus from '@/components/ui/MarketStatus';
import { AppConfig } from '@/constants/AppConfig';
import { analyticsService, ANALYTICS_EVENTS } from '@/services/firebase/AnalyticsService';
import { BolivarIcon } from '@/components/ui/BolivarIcon';
import { CurrencyCodeIcon } from '@/components/ui/CurrencyCodeIcon';

// --- Components ---
const KeypadButton = ({
  label,
  icon,
  onPress,
  isAction = false,
  isDestructive = false,
  testID,
}: {
  label?: string;
  icon?: string;
  onPress: () => void;
  isAction?: boolean;
  isDestructive?: boolean;
  testID?: string;
}) => {
  const theme = useTheme();

  const buttonStyle = useMemo(() => {
    let backgroundColor;
    if (isDestructive) backgroundColor = theme.colors.errorContainer;
    if (isAction) backgroundColor = theme.colors.secondaryContainer;

    return {
      backgroundColor,
    };
  }, [isDestructive, isAction, theme]);

  const contentColor = useMemo(() => {
    if (isDestructive) return theme.colors.error;
    if (isAction) return theme.colors.onSecondaryContainer;
    return theme.colors.onSurface;
  }, [isDestructive, isAction, theme]);

  const textStyle = useMemo(
    () => ({
      color: contentColor,
    }),
    [contentColor],
  );

  return (
    <TouchableRipple
      style={[styles.keypadButton, buttonStyle]}
      onPress={onPress}
      rippleColor={isDestructive ? theme.colors.error : theme.colors.onSurfaceVariant}
      borderless={true}
      testID={testID}
    >
      <View style={styles.centerContent}>
        {icon ? (
          <MaterialCommunityIcons name={icon} size={28} color={contentColor} />
        ) : (
          <Text style={[styles.keypadText, textStyle]}>{label}</Text>
        )}
      </View>
    </TouchableRipple>
  );
};

const Keypad = ({
  onKeyPress,
  onDelete,
  theme,
}: {
  onKeyPress: (val: string) => void;
  onDelete: () => void;
  theme: any;
}) => {
  const containerStyle = useMemo(
    () => ({
      backgroundColor: theme.colors.elevation.level1,
      borderColor: theme.colors.outline,
    }),
    [theme],
  );

  return (
    <View style={[styles.keypadContainer, containerStyle]}>
      <View style={styles.keypadRow}>
        <KeypadButton label="7" onPress={() => onKeyPress('7')} />
        <KeypadButton label="8" onPress={() => onKeyPress('8')} />
        <KeypadButton label="9" onPress={() => onKeyPress('9')} />
      </View>
      <View style={styles.keypadRow}>
        <KeypadButton label="4" onPress={() => onKeyPress('4')} />
        <KeypadButton label="5" onPress={() => onKeyPress('5')} />
        <KeypadButton label="6" onPress={() => onKeyPress('6')} />
      </View>
      <View style={styles.keypadRow}>
        <KeypadButton label="1" onPress={() => onKeyPress('1')} />
        <KeypadButton label="2" onPress={() => onKeyPress('2')} />
        <KeypadButton label="3" onPress={() => onKeyPress('3')} />
      </View>
      <View style={styles.keypadRow}>
        <KeypadButton label="," onPress={() => onKeyPress(',')} />
        <KeypadButton label="0" onPress={() => onKeyPress('0')} />
        <KeypadButton icon="backspace" onPress={onDelete} isDestructive testID="btn-backspace" />
      </View>
    </View>
  );
};

// --- Types ---
interface CurrencyRow {
  code: string;
  value: number;
  exchangeRate: number;
}

// --- Helper Functions ---
const formatLargeNumber = (value: number, locale: string = 'es-CO'): string => {
  const absValue = Math.abs(value);

  if (absValue >= 1_000_000_000) {
    // Billones (Billions)
    return (
      (value / 1_000_000_000).toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + 'B'
    );
  } else if (absValue >= 1_000_000) {
    // Millones (Millions)
    return (
      (value / 1_000_000).toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + 'M'
    );
  } else if (absValue >= 10_000) {
    // Miles (Thousands) - solo para valores >= 10,000
    return (
      (value / 1_000).toLocaleString(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + 'K'
    );
  }

  // Formato normal para valores menores
  return value.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const AdvancedCalculatorScreen = ({ route }: any) => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const showToast = useToastStore(state => state.showToast);

  // Get showBackButton parameter from route (only true when navigating from Home)
  const showBackButton = route?.params?.showBackButton ?? false;

  // --- State ---
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [_isInputFocused, setIsInputFocused] = useState(false);
  // loading removed as unused
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Base Currency State
  const [baseCurrencyCode, setBaseCurrencyCode] = useState('USD');
  const [baseAmount, setBaseAmount] = useState('0');

  // Target Currencies List (Codes)
  const [targetCodes, setTargetCodes] = useState<string[]>(['VES', 'USDT']);

  // Previous config for revert
  const [previousConfig, setPreviousConfig] = useState<CalculatorConfig | null>(null);

  // Picker State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'base' | 'add'>('base');

  // Input State
  // const [isInputFocused, setIsInputFocused] = useState(false); // Removed unused variable

  // --- Data Loading ---
  useEffect(() => {
    // Load saved calculator config
    const savedConfig = storageService.getCalculatorConfig();
    if (savedConfig) {
      setBaseCurrencyCode(savedConfig.baseCurrencyCode);
      setTargetCodes(savedConfig.targetCodes);
      setPreviousConfig(savedConfig);
    }

    const unsubscribe = CurrencyService.subscribe(data => {
      setRates(data);
      setRefreshing(false);
      setLastRefreshTime(new Date()); // Update time on any data change (manual or pushed)
    });
    CurrencyService.getRates().catch(e => {
      observabilityService.captureError(e, {
        context: 'AdvancedCalculatorScreen.loadRates',
        action: 'fetch_initial_rates',
      });
    });
    return () => unsubscribe();
  }, []);

  // --- Derived Data ---
  const baseCurrency = useMemo(
    () =>
      rates.find(r => r.code === baseCurrencyCode) ||
      ({ code: 'USD', value: 1, name: 'Dollar' } as CurrencyRate),
    [rates, baseCurrencyCode],
  );

  const availableRates = useMemo(() => {
    if (pickerMode === 'base') return rates;

    // Filter for 'add' mode (Target) based on business rules
    const sourceRate = baseCurrency;
    if (!sourceRate) return rates;

    return CurrencyService.getAvailableTargetRates(sourceRate, rates);
  }, [rates, pickerMode, baseCurrency]);

  const getSourceLabel = (code: string) => {
    if (code === 'USDT') return 'Binance P2P';
    if (['USD', 'EUR', 'CNY', 'RUB', 'TRY'].includes(code)) return 'Tasa oficial BCV';
    if (code === 'VES') return 'Banco Central de Venezuela';
    return 'Tasa de Mercado';
  };

  const targetRows = useMemo(() => {
    const amountVal = parseFloat(baseAmount.replace(/\./g, '').replace(',', '.')) || 0;

    // Get USDT rate for bridge calculations
    const usdtRate = rates.find(r => r.code === 'USDT');
    const usdtInVes = usdtRate ? usdtRate.value : null; // VES per USDT

    return targetCodes
      .map(code => {
        const rateObj = rates.find(r => r.code === code);
        if (!rateObj) return null;

        let targetValue = 0;
        let exchangeRate = 0;

        // Determine if currencies are border type with usdRate
        const baseIsBorder = baseCurrency.type === 'border' && baseCurrency.usdRate;
        const targetIsBorder = rateObj.type === 'border' && rateObj.usdRate;
        const baseIsUSDorUSDT = baseCurrency.code === 'USD' || baseCurrency.code === 'USDT';
        const targetIsUSDorUSDT = rateObj.code === 'USD' || rateObj.code === 'USDT';

        // Apply USDT bridge principle for all conversions involving border currencies
        // Formula: 1 Base = (Target/USDT) / (Base/USDT)
        // Example: 1 VES = 3660.306 COP/USDT / 544.83 VES/USDT = 6.72 COP

        if (baseIsUSDorUSDT && targetIsBorder) {
          // USD/USDT to Border: direct multiplication by usdRate from API
          // 1 USD = Target/USDT (because 1 USD ≈ 1 USDT)
          targetValue = amountVal * rateObj.usdRate!;
          exchangeRate = rateObj.usdRate!;
        } else if (baseIsBorder && targetIsUSDorUSDT) {
          // Border to USD/USDT: direct division by usdRate from API
          // 1 Border = 1 / (Border/USDT)
          targetValue = amountVal / baseCurrency.usdRate!;
          exchangeRate = 1 / baseCurrency.usdRate!;
        } else if (baseIsBorder && targetIsBorder) {
          // Border to Border: cross rate using usdRates from API
          // 1 Base = (Target/USDT) / (Base/USDT)
          targetValue = amountVal * (rateObj.usdRate! / baseCurrency.usdRate!);
          exchangeRate = rateObj.usdRate! / baseCurrency.usdRate!;
        } else if (targetIsBorder && usdtInVes) {
          // Any fiat to Border: use USDT bridge
          // Get base rate in USDT terms
          const baseRateInVes = CurrencyService.getCalculatorRate(baseCurrency);
          // Base/USDT = Base/VES ÷ VES/USDT
          // Example: 1 EUR = 40 VES, 1 USDT = 544.83 VES → 1 EUR = 40/544.83 USDT
          const baseRateInUsdt = baseRateInVes / usdtInVes;
          // 1 Base = (Target/USDT) / (Base/USDT)
          targetValue = amountVal * (rateObj.usdRate! / baseRateInUsdt);
          exchangeRate = rateObj.usdRate! / baseRateInUsdt;
        } else if (baseIsBorder && usdtInVes) {
          // Border to any fiat: use USDT bridge
          // Special case for VES: it's the base currency of the system
          if (rateObj.code === 'VES') {
            // Direct conversion: 1 Border = VES/USDT ÷ Border/USDT
            // Example: 1 COP = 544.83 VES/USDT ÷ 3660.306 COP/USDT = 0.1488 VES
            targetValue = amountVal * (usdtInVes / baseCurrency.usdRate!);
            exchangeRate = usdtInVes / baseCurrency.usdRate!;
          } else {
            const targetRateInVes = CurrencyService.getCalculatorRate(rateObj);
            // Target/USDT = Target/VES ÷ VES/USDT
            // Example: 1 EUR = 40 VES, 1 USDT = 544.83 VES → 1 EUR = 40/544.83 USDT
            const targetRateInUsdt = targetRateInVes / usdtInVes;
            // 1 Base = (Target/USDT) / (Base/USDT)
            targetValue = amountVal * (targetRateInUsdt / baseCurrency.usdRate!);
            exchangeRate = targetRateInUsdt / baseCurrency.usdRate!;
          }
        } else {
          // Standard conversion using VES-based values (no border currencies involved)
          const baseRateValue = CurrencyService.getCalculatorRate(baseCurrency);
          const targetRateValue = CurrencyService.getCalculatorRate(rateObj);
          targetValue = CurrencyService.convertCrossRate(amountVal, baseRateValue, targetRateValue);
          exchangeRate = baseRateValue / targetRateValue;
        }

        return {
          code,
          value: targetValue,
          exchangeRate,
          name: rateObj.name,
          rateObj,
        };
      })
      .filter(Boolean) as (CurrencyRow & {
      exchangeRate: number;
      name: string;
      rateObj: CurrencyRate;
    })[];
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
      analyticsService.logEvent(ANALYTICS_EVENTS.CALCULATOR_ADD_CURRENCY, {
        currency: currency.code,
      });
    } else {
      showToast(`${currency.code} ya está en la lista`, 'info');
    }
    setPickerVisible(false);
  };

  const handleSetBase = (currency: CurrencyRate) => {
    setBaseCurrencyCode(currency.code);

    // Calculate valid targets for new base
    const validTargets = CurrencyService.getAvailableTargetRates(currency, rates);
    const validCodes = validTargets.map(r => r.code);

    // Filter existing targets to remove invalid ones
    setTargetCodes(prev =>
      prev.filter(code => {
        // Remove if equal to new base
        if (code === currency.code) return false;
        // Remove if not valid for new base
        if (!validCodes.includes(code)) return false;
        return true;
      }),
    );

    showToast(`Base cambiada a ${currency.code}`, 'success');
    analyticsService.logEvent(ANALYTICS_EVENTS.CALCULATOR_SET_BASE, {
      currency: currency.code,
    });
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
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AdvancedCalculatorScreen.onRefresh',
        action: 'refresh_rates',
      });
      showToast('Error al actualizar', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveConfig = () => {
    const currentConfig: CalculatorConfig = {
      baseCurrencyCode,
      targetCodes,
    };

    // Save current as previous before saving new
    const existingConfig = storageService.getCalculatorConfig();
    if (existingConfig) {
      setPreviousConfig(existingConfig);
    }

    storageService.saveCalculatorConfig(currentConfig);
    showToast('Configuración guardada', 'success');

    // Show hint about long press functionality
    setTimeout(() => {
      showToast('Mantén presionado el botón de guardar para volver a esta configuración', 'info');
    }, 1500);

    analyticsService.logEvent(ANALYTICS_EVENTS.CALCULATOR_SAVE_CONFIG, {
      baseCurrency: baseCurrencyCode,
      targetCount: targetCodes.length,
    });
  };

  const handleRevertConfig = () => {
    if (previousConfig) {
      setBaseCurrencyCode(previousConfig.baseCurrencyCode);
      setTargetCodes(previousConfig.targetCodes);
      showToast('Configuración revertida', 'info');
      analyticsService.logEvent(ANALYTICS_EVENTS.CALCULATOR_REVERT_CONFIG);
    } else {
      showToast('No hay configuración previa', 'info');
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

  const themeStyles = useMemo(
    () => ({
      container: { backgroundColor: theme.colors.background },
      targetRow: {
        backgroundColor: theme.colors.elevation.level1,
        borderColor: theme.colors.outline,
      },
      iconBox: { backgroundColor: theme.colors.elevation.level3 },
      textPrimary: { color: theme.colors.onSurface },
      textSecondary: { color: theme.colors.onSurfaceVariant },
      nameBadge: { backgroundColor: theme.colors.elevation.level3 },
      nameText: { color: theme.colors.onSurfaceVariant },
      warningText: { color: (theme.colors as any).warning },
      successText: { color: (theme.colors as any).success },
      errorContainer: {
        backgroundColor: theme.colors.errorContainer,
        borderColor: theme.colors.background,
      },
      addButton: {
        borderColor: theme.colors.outline,
      },
      addIcon: { backgroundColor: theme.colors.secondaryContainer },
    }),
    [theme],
  );

  const renderListFooter = useCallback(
    () => (
      <TouchableOpacity
        style={[styles.addButton, themeStyles.addButton]}
        onPress={() => {
          setPickerMode('add');
          setPickerVisible(true);
          analyticsService.logEvent(ANALYTICS_EVENTS.CALCULATOR_ADD_CURRENCY_PRESSED);
        }}
      >
        <View style={[styles.addIcon, themeStyles.addIcon]}>
          <MaterialCommunityIcons name="plus" size={20} color={theme.colors.onSecondaryContainer} />
        </View>
        <Text variant="bodyMedium" style={themeStyles.textSecondary}>
          Agregar divisa
        </Text>
      </TouchableOpacity>
    ),
    [theme, themeStyles],
  );

  return (
    <View style={[styles.container, themeStyles.container]}>
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
        onBackPress={showBackButton ? () => navigation.goBack() : undefined}
        onActionPress={handleSaveConfig}
        onActionLongPress={handleRevertConfig}
        rightActionIcon="content-save"
        notificationIcon="bell-outline"
        onNotificationPress={() => navigation.navigate('Notifications')}
        showNotification={true}
      />

      <View style={styles.flex1}>
        {/* Main Base Input */}
        <View style={styles.baseContainer}>
          <View style={styles.inputHeader}>
            <Text variant="labelMedium" style={themeStyles.textSecondary}>
              MONEDA BASE
            </Text>
            {/* Source Label Added */}
            <View style={styles.sourceLabelContainer}>
              <Text
                variant="labelSmall"
                style={[styles.sourceLabel, { color: theme.colors.primary }]}
              >
                {getSourceLabel(baseCurrency.code).toUpperCase()}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setBaseAmount('0');
                setTargetCodes([]);
                showToast('Calculadora reiniciada', 'info');
                analyticsService.logEvent(ANALYTICS_EVENTS.CALCULATOR_CLEAR);
              }}
            >
              <Text variant="labelMedium" style={[styles.clearText, { color: theme.colors.error }]}>
                LIMPIAR
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <CurrencySelectorButton
              currencyCode={baseCurrency.code}
              iconName={baseCurrency.iconName || 'currency-usd'}
              onPress={() => {
                setPickerMode('base');
                setPickerVisible(true);
              }}
            />

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
                  fontSize: getInputFontSize(),
                },
              ]}
              placeholder="0"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline={false}
            />
          </View>
          <MarketStatus
            status="ABIERTO"
            updatedAt={
              lastRefreshTime
                ? lastRefreshTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : rates.length > 0
                  ? new Date(rates[0].lastUpdated).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '--:--'
            }
            onRefresh={onRefresh}
            showBadge={false}
            style={styles.marketStatusOverride}
          />
        </View>

        {/* Target List */}
        <FlashList
          data={targetRows}
          keyExtractor={item => item.code}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.elevation.level3}
            />
          }
          renderItem={({ item }) => {
            const isCustomSymbol = item.rateObj.iconName?.startsWith('SYMBOL:');
            const customSymbol =
              isCustomSymbol && item.rateObj.iconName
                ? item.rateObj.iconName.replace('SYMBOL:', '')
                : null;

            return (
              <View style={[styles.targetRow, themeStyles.targetRow]}>
                {/* Left Side: Icon */}
                <View style={[styles.iconBox, themeStyles.iconBox]}>
                  {item.rateObj.iconName === 'Bs' ? (
                    <BolivarIcon color={theme.colors.primary} size={24} />
                  ) : isCustomSymbol ? (
                    <CurrencyCodeIcon code={customSymbol!} color={theme.colors.primary} size={24} />
                  ) : (
                    <MaterialCommunityIcons
                      name={item.rateObj.iconName || 'currency-usd'}
                      size={24}
                      color={theme.colors.primary}
                    />
                  )}
                </View>

                {/* Middle: Code & Name */}
                <View style={styles.middleCol}>
                  <View style={styles.codeRow}>
                    <Text variant="titleMedium" style={[styles.codeText, themeStyles.textPrimary]}>
                      {item.code}
                    </Text>
                    <View style={[styles.nameBadge, themeStyles.nameBadge]}>
                      <Text style={[styles.nameText, themeStyles.nameText]}>{item.name}</Text>
                    </View>
                  </View>
                  <Text variant="bodySmall" style={themeStyles.textSecondary}>
                    1 {baseCurrency.code} ={' '}
                    {formatLargeNumber(item.exchangeRate, AppConfig.DEFAULT_LOCALE)} {item.code}
                  </Text>
                </View>

                {/* Right Side: Value & Label */}
                <View style={styles.rightCol}>
                  <Text
                    variant="headlineSmall"
                    style={[styles.valueText, themeStyles.textPrimary]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatLargeNumber(item.value, AppConfig.DEFAULT_LOCALE)}
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.labelText,
                      item.rateObj.type === 'crypto'
                        ? themeStyles.warningText
                        : themeStyles.successText,
                    ]}
                  >
                    {item.rateObj.type === 'crypto' ? 'Cripto activo' : 'Conversión directa'}
                  </Text>
                </View>

                {/* Close Button (Absolute positioned) */}
                <TouchableOpacity
                  onPress={() => removeCurrency(item.code)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[styles.closeButton, themeStyles.errorContainer]}
                >
                  <MaterialCommunityIcons name="close" size={14} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            );
          }}
          ListFooterComponent={renderListFooter}
        />

        <Keypad onKeyPress={handleKeyPress} onDelete={handleDelete} theme={theme} />
      </View>

      <CurrencyPickerModal
        visible={pickerVisible}
        onDismiss={() => setPickerVisible(false)}
        onSelect={pickerMode === 'base' ? handleSetBase : handleAddCurrency}
        selectedCurrencyCode={pickerMode === 'base' ? baseCurrencyCode : null}
        rates={availableRates}
        title={pickerMode === 'base' ? 'Seleccionar divisa' : 'Añadir a la lista'}
        excludedCodes={getExcludedCodes}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  header: {
    zIndex: 1,
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
  sourceLabelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  sourceLabel: {
    fontWeight: 'bold',
    opacity: 0.8,
  },
  clearText: {
    fontWeight: 'bold',
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
  currencySelectorBtn: {
    backgroundColor: 'transparent',
  },
  iconRight: {
    marginRight: 8,
  },
  mainCurrencyText: {
    fontWeight: 'bold',
  },
  mainInput: {
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
    padding: 0,
    includeFontPadding: false,
  },
  marketStatusOverride: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: 4,
    paddingBottom: 0,
    paddingTop: 0,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
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
  bsIconText: {
    fontWeight: '900',
    fontSize: 18,
  },
  middleCol: {
    marginLeft: 16,
    flex: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  codeText: {
    fontWeight: '900',
    marginRight: 8,
  },
  nameBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nameText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  valueText: {
    fontWeight: 'bold',
  },
  labelText: {
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  addButton: {
    marginTop: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 100,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  addIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  addText: {
    fontWeight: 'bold',
    letterSpacing: 1,
    fontSize: 12,
  },
  keypadContainer: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(121, 116, 126, 0.2)', // theme.colors.outline fallback or use theme in component
    elevation: 0,
    shadowOpacity: 0,
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
    backgroundColor: 'transparent',
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
  },
});

export default AdvancedCalculatorScreen;
