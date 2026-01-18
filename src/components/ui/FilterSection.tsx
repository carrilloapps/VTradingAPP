import React from 'react';
import { ScrollView, View, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterSectionProps {
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  mode?: 'scroll' | 'wrap';
  visible?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  options,
  selectedValue,
  onSelect,
  mode = 'scroll',
  visible = true,
}) => {
  const theme = useTheme();

  if (!visible) return null;

  const renderChip = (option: FilterOption) => {
    const isSelected = selectedValue === option.value;
    
    return (
      <Chip
        key={option.value}
        selected={isSelected}
        onPress={() => {
          // Optional: Add animation on selection if desired
          // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); 
          onSelect(option.value);
        }}
        style={[
          styles.chip,
          isSelected 
            ? [styles.chipSelected, { backgroundColor: theme.colors.primary }] 
            : [styles.chipUnselected, { borderColor: theme.colors.outline }]
        ]}
        textStyle={
          isSelected 
            ? [styles.chipTextSelected, { color: theme.colors.onPrimary }]
            : [styles.chipTextUnselected, { color: theme.colors.onSurfaceVariant }]
        }
        selectedColor={theme.colors.onPrimary}
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
        style={styles.container}
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.wrapContainer, styles.container]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  wrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
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
