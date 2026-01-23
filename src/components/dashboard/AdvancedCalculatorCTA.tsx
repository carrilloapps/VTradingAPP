import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/theme';

interface AdvancedCalculatorCTAProps {
  spread: number | null;
}

const AdvancedCalculatorCTA: React.FC<AdvancedCalculatorCTAProps> = ({ 
  spread,
}) => {
  const theme = useAppTheme();
  const navigation = useNavigation<any>();

  const handlePress = () => {
    navigation.navigate('AdvancedCalculator');
  };

  // Determine colors based on the "Warning/Gold" aesthetic requested
  // Warning color is Yellow/Orange in the theme
  const accentColor = theme.colors.warning;
  const containerColor = theme.dark ? theme.colors.elevation.level2 : theme.colors.surface;
  
  // Text color for the badge (Dark text on Light Orange in Dark Mode, White text on Dark Orange in Light Mode)
  const badgeTextColor = theme.dark ? '#2A2A2A' : '#FFFFFF';

  return (
    <Surface
      style={[
        styles.container, 
        { 
          backgroundColor: containerColor,
          borderColor: accentColor,
          borderRadius: theme.roundness * 6,
        }
      ]}
    >
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <View style={styles.content}>
          <View style={styles.leftColumn}>
            <View style={styles.headerRow}>
              <Icon source="calculator-variant" size={24} color={accentColor} />
              <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
                Calculadora profesional
              </Text>
            </View>
            <Text variant="bodySmall" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Herramienta para trading y comercio
            </Text>
            
            <View style={styles.noteContainer}>
                <Icon source="information-outline" size={12} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.noteText, { color: theme.colors.onSurfaceVariant }]}>
                    Spread: Diferencia USD vs USDT
                </Text>
            </View>
          </View>

          {spread !== null && (
            <View style={styles.rightColumn}>
              <View style={[
                styles.badge, 
                { backgroundColor: accentColor }
              ]}>
                <Text style={[styles.badgeLabel, { color: badgeTextColor }]}>
                  SPREAD
                </Text>
                <Text style={[styles.badgeValue, { color: badgeTextColor }]}>
                  {spread.toFixed(2)}%
                </Text>
              </View>
              <Icon source="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  touchable: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 18,
  },
  leftColumn: {
    flex: 1,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 6,
  },
  ratesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  rateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    fontSize: 12,
    opacity: 0.5,
  },
  rightColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  badgeValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    opacity: 0.7,
  },
  noteText: {
    fontSize: 10,
    marginLeft: 4,
    fontStyle: 'italic',
  },
});

export default AdvancedCalculatorCTA;
