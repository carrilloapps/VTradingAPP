import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WordPressCategory } from '../../services/WordPressService';
import { getCategoryIcon } from '../../utils/categoryIcons';

interface CategoryCardProps {
  category: WordPressCategory;
  onPress: (category: WordPressCategory) => void;
}



const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress }) => {
  const theme = useTheme();
  const icon = getCategoryIcon(category.name);

  return (
    <TouchableRipple 
      onPress={() => onPress(category)}
      style={{ marginBottom: 12, borderRadius: theme.roundness * 6 }}
      borderless
      accessibilityRole="button"
      accessibilityLabel={`Categoría ${category.name}`}
    >
      <Surface 
        elevation={0}
        style={[styles.card, { 
          backgroundColor: theme.colors.elevation.level1, 
          borderColor: theme.colors.outline,
          borderRadius: theme.roundness * 6
        }]}
      >
        <View style={styles.content}>
          <View
            style={[
              styles.iconContainer,
              { 
                backgroundColor: theme.colors.primaryContainer,
                borderRadius: theme.roundness * 4
              },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            {category.name}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.colors.onSurfaceVariant}
        />
      </Surface>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    elevation: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
  },
});

export default CategoryCard;
