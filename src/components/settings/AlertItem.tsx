import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, Switch } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface AlertItemProps {
  symbol: string;
  status: 'Sube' | 'Baja';
  target: string;
  isActive: boolean;
  onToggle: (value: boolean) => void;
  iconName: string;
  iconColor: string;
  iconBgColor: string;
}

const AlertItem: React.FC<AlertItemProps> = ({ 
  symbol, 
  status, 
  target, 
  isActive, 
  onToggle,
  iconName,
  iconColor,
  iconBgColor
}) => {
  const theme = useTheme();
  const colors = theme.colors as any;
  
  const statusColor = status === 'Sube' 
    ? colors.success
    : colors.error;
    
  const statusBg = status === 'Sube'
    ? colors.successContainer
    : colors.errorContainer;

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.elevation.level1,
      borderBottomColor: theme.colors.outline,
    }]}>
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <MaterialIcons name={iconName} size={24} color={iconColor} />
        </View>
        
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
              {symbol}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {status}
              </Text>
            </View>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Objetivo: <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{target}</Text>
          </Text>
        </View>
      </View>

      <Switch 
        value={isActive} 
        onValueChange={onToggle}
        color={theme.colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});

export default AlertItem;
