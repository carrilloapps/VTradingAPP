import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import CurrencyConverter from './CurrencyConverter';

const Calculator: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  const themeStyles = React.useMemo(() => ({
    container: {
        backgroundColor: theme.colors.elevation.level1, 
        borderColor: theme.colors.outline 
    },
    title: {
        fontWeight: 'bold' as const, 
        color: theme.colors.onSurface
    },
    icon: {
        marginRight: 4
    },
    expandText: {
        color: theme.colors.primary, 
        fontWeight: 'bold' as const
    }
  }), [theme]);

  return (
    <View style={[styles.container, themeStyles.container]}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={themeStyles.title}>
            Calculadora Rápida
        </Text>
        <TouchableOpacity 
            onPress={() => navigation.navigate('AdvancedCalculator' as never)}
            style={styles.expandButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
            <MaterialIcons name="open-in-full" size={18} color={theme.colors.primary} style={themeStyles.icon} />
            <Text variant="labelLarge" style={themeStyles.expandText}>Ampliar</Text>
        </TouchableOpacity>
      </View>
      <CurrencyConverter />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24, // More rounded corners to match modern UI
    padding: 20, // Slightly more padding
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 80,
  },
  header: {
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 16
  },
  expandButton: {
      flexDirection: 'row', 
      alignItems: 'center',
      padding: 4
  }
});

export default Calculator;
