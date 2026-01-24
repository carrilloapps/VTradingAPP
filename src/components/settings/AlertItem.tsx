import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Switch, IconButton, TouchableRipple } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface AlertItemProps {
  symbol: string;
  status: 'Sube' | 'Baja';
  target: string;
  isActive: boolean;
  onToggle: (value: boolean) => void;
  onDelete: () => void;
  onPress: () => void;
  iconName: string;
  disabled?: boolean;
}

const AlertItem: React.FC<AlertItemProps> = ({ 
  symbol, 
  status, 
  target, 
  isActive, 
  onToggle,
  onDelete,
  onPress,
  iconName,
  disabled = false
}) => {
  const theme = useTheme();
  const colors = theme.colors as any;
  
  const statusColor = status === 'Sube' 
    ? colors.success
    : colors.error;
    
  const statusBg = status === 'Sube'
    ? colors.successContainer
    : colors.errorContainer;

  const iconColor = status === 'Sube' ? colors.success : colors.error;
  const iconBgColor = status === 'Sube' ? colors.successContainer : colors.errorContainer;

  return (
    <TouchableRipple 
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, { 
        borderBottomColor: theme.colors.outline,
      }]}
    >
      <View style={styles.innerContainer}>
        <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <MaterialIcons name={iconName} size={24} color={iconColor} />
        </View>
        
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text variant="titleMedium" style={[styles.symbolText, { color: theme.colors.onSurface }]}>
              {symbol}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {status}
              </Text>
            </View>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Objetivo: <Text style={[styles.targetText, { color: theme.colors.onSurface }]}>{target}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Switch 
          value={isActive} 
          onValueChange={onToggle}
          color={theme.colors.primary}
          disabled={disabled}
        />
        <IconButton
          icon="delete-outline"
          size={20}
          iconColor={theme.colors.error}
          onPress={onDelete}
          disabled={disabled}
        />
      </View>
    </View>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container for the ripple
  },
  innerContainer: {
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  symbolText: {
    fontWeight: 'bold',
  },
  targetText: {
    fontWeight: 'bold',
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
