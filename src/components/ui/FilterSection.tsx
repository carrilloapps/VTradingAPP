import React from 'react';
import { ScrollView, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/theme';

export interface FilterOption {
  label: string;
  value: string;
  icon?: string;
  color?: string;
}

interface FilterSectionProps {
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  mode?: 'scroll' | 'wrap';
  visible?: boolean;
  style?: StyleProp<ViewStyle>;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  options,
  selectedValue,
  onSelect,
  mode = 'scroll',
  visible = true,
  style,
}) => {
  const theme = useAppTheme();

  if (!visible) return null;

  const renderChip = (option: FilterOption) => {
    const isSelected = selectedValue === option.value;
    
    // Determine content color based on selection state and theme
    // If selected, use onPrimary. If unselected, use option.color or onSurfaceVariant.
    const contentColor = isSelected 
      ? theme.colors.onPrimary 
      : (option.color || theme.colors.onSurfaceVariant);

    return (
      <Chip
        key={option.value}
        selected={isSelected}
        icon={option.icon ? ({ size }) => (
          <MaterialCommunityIcons name={option.icon!} size={size} color={contentColor} />
        ) : undefined}
        onPress={() => {
          // Optional: Add animation on selection if desired
          onSelect(option.value);
        }}
        style={[
          styles.chip,
          isSelected 
            ? [styles.chipSelected, { backgroundColor: option.color || theme.colors.primary }] 
            : [styles.chipUnselected, { borderColor: theme.colors.outline }]
        ]}
        textStyle={
          isSelected 
            ? [styles.chipTextSelected, { color: contentColor }]
            : [styles.chipTextUnselected, { color: contentColor }]
        }
        selectedColor={contentColor}
        showSelectedOverlay={true}
        rippleColor={isSelected ? undefined : 'rgba(0,0,0,0.1)'}
      >
        {option.label}
      </Chip>
    );
  };

  const content = options.map(renderChip);

  if (mode === 'scroll') {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        style={[{ marginTop: theme.spacing.m, marginLeft: -20, marginRight: -20 }, style]}
      >
        {/* Add left spacer for initial padding that scrolls */}
        <View style={{ width: 20 }} /> 
        {content}
        {/* Add right spacer for final padding that scrolls */}
        <View style={{ width: 20 }} />
      </ScrollView>
    );
  }

  return (
    <View style={[styles.wrapContainer, { marginTop: theme.spacing.m }, style]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 0,
    gap: 8,
  },
  wrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 0,
    gap: 8,
  },
  chip: {
    height: 36,
    borderRadius: 12,
    borderWidth: 1, // Ensure border width is consistent
  },
  chipSelected: {
    borderWidth: 0,
  },
  chipUnselected: {
    backgroundColor: 'transparent',
  },
  chipTextSelected: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  chipTextUnselected: {
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default FilterSection;
