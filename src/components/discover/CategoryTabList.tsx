import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, LayoutAnimation, Platform, UIManager, useWindowDimensions } from 'react-native';
import { IconButton, useTheme, Surface } from 'react-native-paper';
import { WordPressCategory } from '../../services/WordPressService';
import CategoryTab from './CategoryTab';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CategoryTabListProps {
  categories: WordPressCategory[];
  selectedCategory?: number;
  onCategorySelect: (categoryId: number) => void;
}

const CategoryTabList: React.FC<CategoryTabListProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
}) => {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [showAll, setShowAll] = useState(false);
  const [firstRowCount, setFirstRowCount] = useState(categories.length);

  // Estimate how many categories fit in first row
  useEffect(() => {
    // Average category tab width estimation
    const HORIZONTAL_PADDING = 16 * 2; // Container padding
    const AVERAGE_TAB_WIDTH = 120; // Adjusted to fit ~3 categories
    const GAP = 8;
    
    const availableWidth = windowWidth - HORIZONTAL_PADDING;
    const BUTTON_WIDTH = 48; // + button width
    
    // Calculate how many tabs fit including the + button space
    let maxTabs = Math.floor((availableWidth - BUTTON_WIDTH - GAP) / (AVERAGE_TAB_WIDTH + GAP));
    
    // Default to 3 categories, ensure at least 2
    maxTabs = Math.max(2, Math.min(maxTabs, categories.length));
    
    setFirstRowCount(maxTabs);
  }, [windowWidth, categories.length]);

  // Determine visible categories
  const visibleCategories = showAll 
    ? categories 
    : categories.slice(0, firstRowCount);

  const hiddenCount = Math.max(0, categories.length - firstRowCount);
  const shouldShowButton = categories.length > firstRowCount;

  const handleToggle = () => {
    // Animate layout change
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
    setShowAll(!showAll);
  };

  // Handle empty state
  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Categories Grid */}
      <View style={styles.categoriesGrid}>
        {visibleCategories.map((cat) => (
          <View key={cat.id} style={styles.categoryWrapper}>
            <CategoryTab
              name={cat.name}
              image={(cat as any).image}
              count={cat.count}
              selected={selectedCategory === cat.id}
              onPress={() => onCategorySelect(cat.id)}
            />
          </View>
        ))}
        
        {/* Professional + Button */}
        {shouldShowButton && !showAll && (
          <Surface 
            elevation={2}
            style={[
              styles.expandButton, 
              { 
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outline,
              }
            ]}
          >
            <IconButton
              icon="plus"
              size={18}
              iconColor={theme.colors.onSurface}
              onPress={handleToggle}
              style={styles.iconButton}
            />
            {hiddenCount > 0 && (
              <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                <Animated.Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
                  {hiddenCount}
                </Animated.Text>
              </View>
            )}
          </Surface>
        )}
        
        {/* Collapse Button (shown when expanded) */}
        {showAll && shouldShowButton && (
          <Surface 
            elevation={1}
            style={[
              styles.expandButton,
              styles.collapseButton,
              { 
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              }
            ]}
          >
            <IconButton
              icon="chevron-up"
              size={18}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={handleToggle}
              style={styles.iconButton}
            />
          </Surface>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryWrapper: {
    // Auto-sizing based on content
  },
  expandButton: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'visible',
    position: 'relative',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  collapseButton: {
    borderWidth: 1,
    shadowOpacity: 0.08,
  },
  iconButton: {
    margin: 0,
    width: 44,
    height: 44,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    // Badge shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: 12,
  },
});

export default React.memo(CategoryTabList);

