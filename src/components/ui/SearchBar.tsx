import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "Buscar moneda o token...",
  value,
  onChangeText
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', // slate-100 / surface-highlight/50
      borderColor: 'transparent'
    }]}>
      <MaterialIcons name="search" size={20} color={theme.colors.onSurfaceVariant} />
      <TextInput
        style={[styles.input, { color: theme.colors.onSurface }]}
        placeholder={placeholder}
        placeholderTextColor={(theme.colors.onSurfaceVariant as string) + '99'} // 60% opacity
        value={value}
        onChangeText={onChangeText}
      />
      <MaterialIcons name="tune" size={18} color={theme.colors.onSurfaceVariant} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0, // Fix alignment on Android
  },
});

export default SearchBar;
