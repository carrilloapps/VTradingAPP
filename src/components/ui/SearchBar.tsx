import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, FlatList, Text, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFilterPress?: () => void;
  suggestions?: string[];
  onSuggestionPress?: (suggestion: string) => void;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "Buscar moneda o token...",
  value,
  onChangeText,
  onFilterPress,
  suggestions = [],
  onSuggestionPress,
  style,
  inputStyle,
  onSubmitEditing,
  autoFocus
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
    }
  ];

  return (
    <View style={[styles.wrapper, style]}>
      <View style={containerStyle}>
        <MaterialCommunityIcons 
          name="magnify" 
          size={20} 
          color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant} 
        />
        <TextInput
          style={[styles.input, { color: theme.colors.onSurface }, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.onSurfaceDisabled}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow press
          accessibilityLabel="Campo de búsqueda"
          accessibilityRole="search"
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
        />
        {onFilterPress && (
          <TouchableOpacity 
            onPress={onFilterPress} 
            style={styles.filterButton}
            accessibilityLabel="Filtros"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="tune" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && (
        <View style={[
          styles.suggestionsContainer, 
          { 
            backgroundColor: theme.colors.elevation.level3,
            borderColor: theme.colors.outlineVariant 
          }
        ]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => index.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.suggestionItem, { borderBottomColor: theme.colors.outlineVariant }]}
                onPress={() => {
                  onSuggestionPress?.(item);
                  setIsFocused(false);
                }}
              >
                <MaterialCommunityIcons name="history" size={16} color={theme.colors.onSurfaceVariant} style={styles.suggestionIcon} />
                <Text style={{ color: theme.colors.onSurface }}>{item}</Text>
              </TouchableOpacity>
            )}
            style={{ borderRadius: 12 }}
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
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 15,
    paddingVertical: 0,
  },
  filterButton: {
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 52, // Just below search input
    left: 0,
    right: 0,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    maxHeight: 200,
    zIndex: 1001,
    borderWidth: 1,
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
