import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface MenuButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  isDanger?: boolean;
  showChevron?: boolean;
  hasTopBorder?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({ 
  icon, 
  label, 
  onPress, 
  isDanger = false, 
  showChevron = true,
  hasTopBorder = false
}) => {
  const theme = useTheme();
  const colors = theme.colors as any;
  
  const textColor = isDanger 
    ? colors.danger
    : theme.colors.onSurface;
    
  const iconColor = isDanger 
    ? colors.danger
    : theme.colors.onSurfaceVariant;

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.elevation.level1,
          borderTopWidth: hasTopBorder ? 1 : 0,
          borderTopColor: theme.colors.outline,
        }
      ]}
    >
      <MaterialIcons name={icon} size={24} color={iconColor} />
      <Text style={[styles.label, { color: textColor, fontWeight: isDanger ? '700' : '500' }]}>
        {label}
      </Text>
      {showChevron && !isDanger && (
        <MaterialIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  label: {
    flex: 1,
    fontSize: 16,
  }
});

export default MenuButton;
