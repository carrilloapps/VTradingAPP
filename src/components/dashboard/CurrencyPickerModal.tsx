import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { Text, useTheme, Searchbar, Button, Icon } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CurrencyRate } from '../../services/CurrencyService';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { AppConfig } from '../../constants/AppConfig';
import { BolivarIcon } from '../ui/BolivarIcon';

export interface CurrencyPickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect?: (currency: CurrencyRate) => void;
  selectedCurrencyCode?: string | null;
  rates: CurrencyRate[];
  title?: string;
  favorites?: string[];
  excludedCodes?: string[];
  multiSelect?: boolean;
  selectedIds?: string[];
  onToggle?: (currency: CurrencyRate) => void;
  maxSelected?: number;
}

const CurrencyPickerModal: React.FC<CurrencyPickerModalProps> = ({
  visible,
  onDismiss,
  onSelect,
  selectedCurrencyCode,
  rates,
  title = "Seleccionar divisa",
  favorites = ['USD', 'USDT', 'VES'],
  excludedCodes = [],
  multiSelect = false,
  selectedIds = [],
  onToggle,
  maxSelected
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const isMaxReached = !!(multiSelect && maxSelected && selectedIds.length >= maxSelected);

  const handleItemPress = (item: CurrencyRate) => {
    if (multiSelect && onToggle) {
        if (!selectedIds.includes(item.id) && isMaxReached) {
            return; // Block selection if max reached
        }
        onToggle(item);
    } else if (onSelect) {
        onSelect(item);
        onDismiss();
    }
  };

  const themeStyles = React.useMemo(() => ({
    searchBarInput: {
      color: theme.colors.onSurface,
    },
    sectionHeader: {
      color: theme.colors.onSurfaceVariant,
    },
    pickerItem: {
      borderRadius: theme.roundness * 3, // 12px
    },
    pickerItemSelected: {
      backgroundColor: theme.colors.secondaryContainer,
    },
    iconPlaceholderNormal: {
      backgroundColor: theme.colors.elevation.level4,
      borderRadius: theme.roundness * 5, // 20px
    },
    iconPlaceholderSelected: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.roundness * 5, // 20px
    },
    checkBadge: {
      backgroundColor: theme.colors.elevation.level2,
      borderRadius: theme.roundness * 3, // 12px
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
            style={[
                styles.searchBar, 
                { 
                    borderRadius: theme.roundness * 3, 
                    borderColor: theme.colors.outline,
                    borderWidth: 1, // Ensure border is visible in light mode
                    backgroundColor: theme.dark ? theme.colors.elevation.level2 : theme.colors.surface,
                }
            ]}
            inputStyle={themeStyles.searchBarInput}
            iconColor={theme.colors.onSurfaceVariant}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            mode="bar"
            elevation={0} // Flat style
        />

        <SectionList
            sections={sections}
            keyExtractor={(item) => item.id || item.code}
            renderItem={({ item }) => {
                const isSelected = multiSelect 
                    ? selectedIds.includes(item.id) 
                    : selectedCurrencyCode === item.code;
                
                return (
                    <TouchableOpacity 
                        onPress={() => handleItemPress(item)}
                        style={[
                            styles.pickerItem, 
                            themeStyles.pickerItem,
                            isSelected && themeStyles.pickerItemSelected,
                            // Opacity for disabled items
                            (!isSelected && isMaxReached) ? { opacity: 0.5 } : undefined
                        ]}
                        disabled={!isSelected && isMaxReached}
                    >
                        <View style={[
                            styles.iconPlaceholder, 
                            isSelected ? themeStyles.iconPlaceholderSelected : themeStyles.iconPlaceholderNormal
                        ]}>
                             {(item.code === 'VES' || item.iconName === 'Bs') ? (
                                <BolivarIcon color={isSelected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} size={24} />
                             ) : (
                                <Icon 
                                    source={item.iconName && item.iconName !== 'attach-money' ? item.iconName : 'currency-usd'} 
                                    size={24} 
                                    color={isSelected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} 
                                />
                             )}
                        </View>
                        <View style={styles.textContainer}>
                            <Text variant="titleMedium" style={[{ fontWeight: isSelected ? '700' : '400'}, themeStyles.textPrimary]}>
                                {item.code}
                            </Text>
                            <Text variant="bodySmall" style={themeStyles.textSecondary} numberOfLines={1}>
                                {item.name}
                            </Text>
                        </View>
                        <View style={styles.rightContainer}>
                            <Text variant="titleMedium" style={[styles.priceText, { color: theme.colors.onSurface }]}>
                                {item.value.toLocaleString(AppConfig.DEFAULT_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                            </Text>
                            {isSelected && (
                                <View style={styles.checkContainer}>
                                    <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.primary} />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                );
            }}
            renderSectionHeader={({ section: { title } }) => (
                <Text style={[styles.sectionHeader, themeStyles.sectionHeader]}>{title}</Text>
            )}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: 24 }}
        />
        
        {multiSelect && (
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.outline }}>
                <Button mode="contained" onPress={onDismiss}>
                    Listo
                </Button>
            </View>
        )}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
    searchBar: {
        marginBottom: 16,
        marginHorizontal: 20,
        backgroundColor: 'transparent',
        borderWidth: 1,
        height: 50,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 8,
        marginHorizontal: 24,
        letterSpacing: 1,
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginBottom: 4,
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    pickerItemContent: {
        flex: 1,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    rightContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        minWidth: 80,
        marginLeft: 16,
    },
    priceText: {
        fontWeight: 'bold',
        marginBottom: 2,
    },
    checkContainer: {
        marginTop: 2,
    },
    checkBadge: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default CurrencyPickerModal;
