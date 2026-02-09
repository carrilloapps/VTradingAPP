import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { BolivarIcon } from '@/components/ui/BolivarIcon';
import { CurrencyCodeIcon } from '@/components/ui/CurrencyCodeIcon';

interface CurrencySelectorButtonProps {
  currencyCode: string;
  iconName?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const CurrencySelectorButton: React.FC<CurrencySelectorButtonProps> = ({
  currencyCode,
  iconName = 'currency-usd',
  onPress,
  style,
}) => {
  const theme = useTheme();

  const isCustomSymbol = iconName?.startsWith('SYMBOL:');
  const customSymbol = isCustomSymbol && iconName ? iconName.replace('SYMBOL:', '') : null;

  const themeStyles = React.useMemo(
    () => ({
      container: {
        backgroundColor: theme.colors.elevation.level2,
        borderRadius: theme.roundness * 6, // 24px
      },
      iconPlaceholder: {
        backgroundColor: theme.colors.elevation.level4,
        borderRadius: theme.roundness * 3.5, // 14px
      },
      textPrimary: {
        color: theme.colors.onSurface,
      },
      icon: {
        marginLeft: 4,
      },
    }),
    [theme],
  );

  return (
    <TouchableOpacity
      style={[styles.currencyButton, themeStyles.container, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Seleccionar moneda. Actual: ${currencyCode}`}
    >
      <View style={[styles.iconPlaceholder, themeStyles.iconPlaceholder]}>
        {iconName === 'Bs' || currencyCode === 'VES' ? (
          <BolivarIcon color={theme.colors.onSurface} size={18} />
        ) : isCustomSymbol ? (
          <CurrencyCodeIcon code={customSymbol!} color={theme.colors.onSurface} size={18} />
        ) : (
          <MaterialCommunityIcons name={iconName} size={18} color={theme.colors.onSurface} />
        )}
      </View>

      <Text variant="titleMedium" style={[styles.boldText, themeStyles.textPrimary]}>
        {currencyCode}
      </Text>

      <MaterialCommunityIcons
        name="chevron-down"
        size={24}
        color={theme.colors.onSurfaceVariant}
        style={themeStyles.icon}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 110,
    justifyContent: 'space-between',
  },
  iconPlaceholder: {
    width: 28,
    height: 28,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default CurrencySelectorButton;
