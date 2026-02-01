import React, { useRef } from 'react';
import { StyleSheet, Animated, View } from 'react-native';
import { Text, Surface, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';

import { useAppTheme } from '@/theme';
import { getCategoryIcon } from '@/utils/categoryIcons';

interface CategoryTabProps {
  name: string;
  image?: string;
  count?: number;
  selected: boolean;
  onPress: () => void;
}

const CategoryTab = ({ name, image, selected, onPress }: CategoryTabProps) => {
  const theme = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableRipple
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.ripple, { borderRadius: theme.roundness * 6 }]}
        borderless
        rippleColor={theme.colors.primary}
        accessibilityRole="button"
        accessibilityLabel={`Categoría ${name}`}
        accessibilityState={{ selected }}
      >
        <Surface
          style={[
            styles.container,
            {
              borderRadius: theme.roundness * 6,
              backgroundColor: selected
                ? theme.colors.primaryContainer
                : theme.colors.elevation.level1,
              borderColor: selected
                ? theme.colors.primary
                : theme.colors.outline,
            },
          ]}
          elevation={0}
        >
          <View style={styles.content}>
            {/* Icon Container */}
            {image ? (
              <FastImage
                source={{ uri: image }}
                style={styles.iconImage}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                    borderRadius: theme.roundness * 3,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={getCategoryIcon(name)}
                  size={18}
                  color={
                    selected
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant
                  }
                />
              </View>
            )}

            {/* Label */}
            <Text
              variant="labelMedium"
              style={[
                styles.label,
                {
                  color: selected
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurface,
                },
              ]}
              numberOfLines={1}
            >
              {name}
            </Text>
          </View>
        </Surface>
      </TouchableRipple>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  ripple: {},
  container: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    minWidth: 100,
    // Professional shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  label: {
    textTransform: 'capitalize',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default React.memo(CategoryTab);
