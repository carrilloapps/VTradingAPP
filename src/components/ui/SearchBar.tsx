import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, FlatList, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFilterPress?: () => void;
  suggestions?: string[];
  onSuggestionPress?: (suggestion: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "Buscar moneda o token...",
  value,
  onChangeText,
  onFilterPress,
  suggestions = [],
  onSuggestionPress
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const showSuggestions = isFocused && suggestions.length > 0 && value && value.length > 0;
  
  const containerStyle = [
    styles.container,
    { 
      backgroundColor: theme.dark ? theme.colors.elevation.level2 : theme.colors.surface,
      borderColor: isFocused ? theme.colors.primary : theme.colors.outline,
      borderWidth: 1,
      // Flat style
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    }
  ];

  return (
    <View style={styles.wrapper}>
      <View style={containerStyle}>
        <MaterialIcons 
          name="search" 
          size={20} 
          color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant} 
        />
        <TextInput
          style={[styles.input, { color: theme.colors.onSurface }]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.onSurfaceDisabled}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow press
          accessibilityLabel="Campo de búsqueda"
          accessibilityHint="Introduce texto para buscar"
          accessibilityRole="search"
        />
        {onFilterPress && (
          <TouchableOpacity 
            onPress={onFilterPress} 
            style={styles.filterButton}
            accessibilityLabel="Filtros"
            accessibilityHint="Abrir opciones de filtrado"
            accessibilityRole="button"
          >
            <MaterialIcons name="tune" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && (
        <View style={[
          styles.suggestionsContainer, 
          { 
            backgroundColor: theme.colors.elevation.level3,
            borderColor: theme.colors.outline 
          }
        ]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => index.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.suggestionItem, { borderBottomColor: theme.colors.outline }]}
                onPress={() => {
                  onSuggestionPress?.(item);
                  setIsFocused(false);
                }}
              >
                <MaterialIcons name="history" size={16} color={theme.colors.onSurfaceVariant} style={styles.suggestionIcon} />
                <Text style={{ color: theme.colors.onSurface }}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 44,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  filterButton: {
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderRadius: 12,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    maxHeight: 200,
    zIndex: 1001,
    borderWidth: 1,
    borderColor: '#E0E0E0', // Or theme color if available, but StyleSheet doesn't have theme. Will use default outline color or similar.
    // Since we can't access theme here easily without inline styles, I will rely on inline override if possible, 
    // or just assume a safe default. But wait, I can't put theme in StyleSheet.
    // I should check if I can move this to inline style or if it's already using theme somewhere.
    // The component uses `theme` hook. I should move this styling to inline or `themeStyles` if I want to use theme colors.
    // However, looking at the code, `suggestionsContainer` is used in:
    // <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.elevation.level3 }]}>
    // I can add borderColor there.
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionIcon: {
    marginRight: 8,
  },
});

export default SearchBar;
