import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const ModernTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // Create animated values for each tab
  const animatedValues = useRef(state.routes.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Animate the active tab
    const animations = state.routes.map((_, index) => {
      const isFocused = state.index === index;
      return Animated.spring(animatedValues[index], {
        toValue: isFocused ? 1 : 0,
        useNativeDriver: true,
        friction: 5,
        tension: 40,
      });
    });
    Animated.parallel(animations).start();
  }, [state.index, state.routes]);

  return (
    <View pointerEvents="box-none" style={styles.mainContainer}>
      <View style={[
        styles.barBackground,
        { 
          backgroundColor: theme.colors.surface,
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        }
      ]}>
        <View style={styles.content}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            
            // Get the icon function from options
            const IconComponent = options.tabBarIcon;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            // Animations
            const translateY = animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, -20]
            });

            const scale = animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.1]
            });
            
            const circleScale = animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1]
            });
            
            const iconTranslateY = animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0] 
            });

            const iconColor = isFocused ? theme.colors.onPrimary : theme.colors.onSurfaceVariant;

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
                activeOpacity={0.8}
              >
                <Animated.View style={[
                  styles.iconContainer,
                  {
                    transform: [{ translateY }],
                  }
                ]}>
                  {/* Background Circle for Active State */}
                  <Animated.View style={[
                    StyleSheet.absoluteFill,
                    styles.activeCircle,
                    {
                      backgroundColor: theme.colors.primary,
                      transform: [{ scale: circleScale }],
                      opacity: circleScale
                    }
                  ]} />
                  
                  {/* Icon */}
                  <Animated.View style={{ transform: [{ scale }, { translateY: iconTranslateY }] }}>
                    {IconComponent && IconComponent({ 
                      focused: isFocused, 
                      color: iconColor, 
                      size: 24 
                    })}
                  </Animated.View>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    // We wrap in a container to manage shadow/elevation if needed
    backgroundColor: 'transparent',
  },
  barBackground: {
    flexDirection: 'row',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // Ensure the elevated button is visible
    overflow: 'visible',
    borderTopWidth: 0,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center', // Center items vertically in the bar
    justifyContent: 'space-around',
    height: 60, // Fixed height for content area
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircle: {
    borderRadius: 25,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  }
});

export default ModernTabBar;
