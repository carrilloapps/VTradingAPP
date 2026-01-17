import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface MarketStatusProps {
  isOpen: boolean;
  updatedAt: string;
  onRefresh?: () => void;
  showBadge?: boolean;
  style?: any;
}

const MarketStatus: React.FC<MarketStatusProps> = ({ isOpen, updatedAt, onRefresh, showBadge = true, style }) => {
  const theme = useTheme();
  const colors = theme.colors as any;

  return (
    <View style={[styles.container, style, !showBadge && { justifyContent: 'flex-end' }]}>
      {showBadge && (
        <View style={[styles.statusBadge, { 
          backgroundColor: colors.successContainer,
          borderColor: colors.success
        }]}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={[styles.statusText, { color: colors.success }]}>
            {isOpen ? 'MERCADO ABIERTO' : 'MERCADO CERRADO'}
          </Text>
        </View>
      )}
      
      <TouchableOpacity 
        onPress={onRefresh} 
        disabled={!onRefresh}
        style={styles.refreshContainer}
        activeOpacity={0.6}
      >
        <Text style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}>
          Actualizado: {updatedAt}
        </Text>
        {onRefresh && (
          <MaterialIcons 
            name="refresh" 
            size={14} 
            color={theme.colors.onSurfaceVariant} 
            style={{ marginLeft: 4 }}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  refreshContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  }
});

export default MarketStatus;
