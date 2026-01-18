import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { Text, useTheme, Searchbar } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { CurrencyRate } from '../../services/CurrencyService';
import { BottomSheetModal } from '../ui/BottomSheetModal';

export interface CurrencyPickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (currency: CurrencyRate) => void;
  selectedCurrencyCode: string | null;
  rates: CurrencyRate[];
  title?: string;
  favorites?: string[];
  excludedCodes?: string[];
}

const CurrencyPickerModal: React.FC<CurrencyPickerModalProps> = ({
  visible,
  onDismiss,
  onSelect,
  selectedCurrencyCode,
  rates,
  title = "Seleccionar divisa",
  favorites = ['USD', 'USDT', 'VES'],
  excludedCodes = []
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const themeStyles = React.useMemo(() => ({
    searchBarInput: {
      color: theme.colors.onSurface,
    },
    sectionHeader: {
      color: theme.colors.onSurfaceVariant,
    },
    pickerItem: {
      borderBottomColor: theme.colors.outline,
    },
    pickerItemSelected: {
      backgroundColor: 'rgba(30, 41, 59, 0.6)',
      borderBottomColor: 'transparent',
    },
    iconPlaceholderNormal: {
      backgroundColor: theme.colors.elevation.level4,
    },
    iconPlaceholderSelected: {
      backgroundColor: theme.colors.primary,
    },
    checkBadge: {
      backgroundColor: theme.colors.elevation.level2,
    },
    textPrimary: {
      color: theme.colors.onSurface,
    },
    textSecondary: {
      color: theme.colors.onSurfaceVariant,
    },
  }), [theme]);

  const sections = useMemo(() => {
      const lowerQuery = searchQuery.toLowerCase();
      
      // First filter by search query and excluded codes
      const filtered = rates.filter(r => 
          (r.code.toLowerCase().includes(lowerQuery) || 
          r.name.toLowerCase().includes(lowerQuery)) &&
          !excludedCodes.includes(r.code)
      );

      const main = filtered.filter(r => favorites.includes(r.code));
      const others = filtered.filter(r => !favorites.includes(r.code));

      const result = [];
      if (main.length > 0) result.push({ title: 'PRINCIPALES', data: main });
      if (others.length > 0) result.push({ title: 'OTRAS MONEDAS', data: others });

      return result;
  }, [rates, searchQuery, favorites, excludedCodes]);

  return (
    <BottomSheetModal
        visible={visible}
        onClose={onDismiss}
        title={title}
    >
        <Searchbar 
            placeholder="Buscar moneda o país..." 
            onChangeText={setSearchQuery} 
            value={searchQuery} 
            style={styles.searchBar}
            inputStyle={themeStyles.searchBarInput}
            iconColor={theme.colors.onSurfaceVariant}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            mode="bar"
        />

        <SectionList
            sections={sections}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
                const isSelected = selectedCurrencyCode === item.code;
                return (
                    <TouchableOpacity 
                        onPress={() => {
                            onSelect(item);
                            onDismiss();
                        }}
                        style={[
                            styles.pickerItem, 
                            themeStyles.pickerItem,
                            isSelected && themeStyles.pickerItemSelected
                        ]}
                    >
                        <View style={[
                            styles.iconPlaceholder, 
                            isSelected ? themeStyles.iconPlaceholderSelected : themeStyles.iconPlaceholderNormal
                        ]}>
                             <MaterialIcons 
                                name={item.iconName || 'attach-money'} 
                                size={24} 
                                color={isSelected ? '#fff' : theme.colors.onSurfaceVariant} 
                             />
                        </View>
                        <View style={styles.pickerItemContent}>
                            <Text variant="titleMedium" style={themeStyles.textPrimary}>{item.code}</Text>
                            <Text variant="bodySmall" style={themeStyles.textSecondary}>{item.name}</Text>
                        </View>
                        {isSelected && (
                            <View style={[styles.checkBadge, themeStyles.checkBadge]}>
                                <MaterialIcons name="check" size={16} color={theme.colors.primary} />
                            </View>
                        )}
                    </TouchableOpacity>
                );
            }}
            renderSectionHeader={({ section: { title } }) => (
                <Text style={[styles.sectionHeader, themeStyles.sectionHeader]}>{title}</Text>
            )}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        />
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
    searchBar: {
        marginBottom: 16,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(128,128,128, 0.2)',
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        letterSpacing: 1,
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderRadius: 12,
        marginBottom: 4,
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    pickerItemContent: {
        flex: 1,
    },
    checkBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default CurrencyPickerModal;
