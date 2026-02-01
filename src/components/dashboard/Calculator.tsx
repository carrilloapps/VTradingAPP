import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import CurrencyConverter from './CurrencyConverter';
import { RootStackParamList } from '@/navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Memoized CurrencyConverter to prevent unnecessary re-renders
const MemoizedCurrencyConverter = React.memo(CurrencyConverter);

const Calculator: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const themeStyles = React.useMemo(
    () => ({
      container: {
        backgroundColor: theme.colors.elevation.level1,
        borderColor: theme.colors.primary,
        borderRadius: theme.roundness * 6,
      },
      title: {
        fontWeight: 'bold' as const,
        color: theme.colors.onSurface,
      },
      icon: {
        marginRight: 4,
      },
      expandText: {
        color: theme.colors.onPrimaryContainer,
        fontWeight: 'bold' as const,
      },
      button: {
        backgroundColor: theme.colors.primaryContainer,
        borderRadius: theme.roundness * 2,
        paddingHorizontal: 12,
        paddingVertical: 6,
      },
    }),
    [theme],
  );

  return (
    <View style={[styles.container, themeStyles.container]}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={themeStyles.title}>
          Calculadora Rápida
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AdvancedCalculator')}
          style={[styles.expandButton, themeStyles.button]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Abrir calculadora avanzada"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="calculator-variant"
            size={20}
            color={theme.colors.onPrimaryContainer}
            style={themeStyles.icon}
          />
          <Text variant="labelMedium" style={themeStyles.expandText}>
            Ampliar
          </Text>
        </TouchableOpacity>
      </View>
      <MemoizedCurrencyConverter />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20, // Slightly more padding
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
});

export default Calculator;
