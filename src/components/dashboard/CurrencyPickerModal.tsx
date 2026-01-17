import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { Text, useTheme, Searchbar } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { CurrencyRate } from '../../services/CurrencyService';
import { BottomSheetModal } from '../ui/BottomSheetModal';

interface CurrencyPickerModalProps {
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
  favorites = ['USD', 'VES', 'EUR', 'USDT', 'BTC'],
  excludedCodes = []
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

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
            inputStyle={{ color: theme.colors.onSurface }}
            iconColor={theme.colors.onSurfaceVariant}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            mode="bar"
        />

        <SectionList
            sections={sections}
            keyExtractor={item => item.code}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderSectionHeader={({ section: { title } }) => (
                <Text variant="labelSmall" style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}>
                    {title}
                </Text>
            )}
            renderItem={({ item }) => {
                const isSelected = selectedCurrencyCode === item.code;
                const isZero = Math.abs(item.changePercent) < 0.001;
                const isPositive = item.changePercent > 0;
                
                let trendColor = theme.colors.onSurfaceVariant;
                
                if (!isZero) {
                    trendColor = isPositive ? theme.colors.success : theme.colors.error;
                }
                
                return (
                <TouchableOpacity 
                    style={[
                        styles.pickerItem, 
                        { borderBottomColor: theme.colors.outline },
                        isSelected && { 
                            backgroundColor: 'rgba(30, 41, 59, 0.6)', // Full width highlight
                            borderBottomColor: 'transparent',
                        }
                    ]} 
                    onPress={() => { onSelect(item); onDismiss(); }}
                >
                    <View style={[
                        styles.iconPlaceholder, 
                        { 
                            backgroundColor: isSelected ? theme.colors.primary : theme.colors.elevation.level4,
                        }
                    ]}>
                        <MaterialIcons 
                            name={item.iconName || 'attach-money'} 
                            size={24} 
                            color={isSelected ? '#ffffff' : theme.colors.onSurface} 
                        />
                         {isSelected && (
                            <View style={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                backgroundColor: theme.colors.elevation.level2,
                                borderRadius: 10,
                            }}>
                                <MaterialIcons 
                                    name="check-circle" 
                                    size={16} 
                                    color="#38bdf8" 
                                />
                            </View>
                        )}
                    </View>
                    <View style={{flex: 1}}>
                        <Text variant="titleMedium" style={{fontWeight: 'bold', color: theme.colors.onSurface}}>
                            {item.code}
                        </Text>
                        <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>{item.name}</Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                        <Text variant="titleMedium" style={{fontWeight: 'bold', color: theme.colors.onSurface}}>
                            {item.value.toLocaleString('es-VE', { maximumFractionDigits: 2 })}
                        </Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                            {!isZero && (
                                <MaterialIcons 
                                    name={isPositive ? "arrow-drop-up" : "arrow-drop-down"} 
                                    size={16} 
                                    color={trendColor} 
                                />
                            )}
                            <Text variant="labelSmall" style={{color: trendColor, fontWeight: 'bold'}}>
                                {isZero ? '0.00%' : `${isPositive ? '+' : ''}${item.changePercent.toFixed(2)}%`}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            )}}
        />
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  searchBar: {
      marginBottom: 16,
      backgroundColor: 'rgba(0,0,0,0.2)', // Darker background for search bar
      elevation: 0,
      height: 48,
      marginHorizontal: 24, // Align with modal header and content padding
  },
  pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24, // Consistent horizontal padding for items
        borderBottomWidth: 0.5,
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    sectionHeader: {
        marginTop: 16,
        marginBottom: 8,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        fontSize: 11,
        paddingHorizontal: 24, // Align headers with content
    }
});

export default CurrencyPickerModal;
