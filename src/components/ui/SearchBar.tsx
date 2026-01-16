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

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { 
        backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
        borderColor: isFocused ? theme.colors.primary : 'transparent',
        borderWidth: 1
      }]}>
        <MaterialIcons 
          name="search" 
          size={20} 
          color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant} 
        />
        <TextInput
          style={[styles.input, { color: theme.colors.onSurface }]}
          placeholder={placeholder}
          placeholderTextColor={(theme.colors.onSurfaceVariant as string) + '99'}
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
        <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.elevation.level3 }]}>
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
                <MaterialIcons name="history" size={16} color={theme.colors.onSurfaceVariant} style={{ marginRight: 8 }} />
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
    zIndex: 1001,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  }
});

export default SearchBar;
