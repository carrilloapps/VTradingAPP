import React, { useRef } from 'react';
import { StyleSheet, Animated, Image, View } from 'react-native';
import { Text, Surface, TouchableRipple } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';

interface CategoryTabProps {
    name: string;
    image?: string;
    count?: number;
    selected: boolean;
    onPress: () => void;
}

const CategoryTab = ({ name, image, selected, onPress }: CategoryTabProps) => {
    const theme = useAppTheme();
    const initials = name.substring(0, 2).toUpperCase();
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Surface
                style={[
                    styles.container,
                    {
                        borderRadius: theme.roundness * 4, // Consistent rounding
                        backgroundColor: selected ? theme.colors.secondaryContainer : theme.colors.surface,
                        borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
                    }
                ]}
                elevation={selected ? 2 : 0} // Slight elevation only when selected
            >
                <TouchableRipple
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    style={styles.touchable}
                    borderless
                    rippleColor={theme.colors.primary}
                >
                    <View style={styles.content}>
                        {image ? (
                            <Image 
                                source={{ uri: image }} 
                                style={styles.mediaItem}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[
                                styles.mediaItem, 
                                styles.initialsContainer,
                                { backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceVariant }
                            ]}>
                                <Text style={[
                                    styles.initialsText, 
                                    { color: selected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }
                                ]}>
                                    {initials}
                                </Text>
                            </View>
                        )}
                        <Text 
                            variant="labelLarge"
                            style={[
                                styles.label, 
                                { 
                                    color: selected ? theme.colors.onSecondaryContainer : theme.colors.onSurface,
                                    fontWeight: selected ? '700' : '500'
                                }
                            ]}
                        >
                            {name}
                        </Text>
                    </View>
                </TouchableRipple>
            </Surface>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginRight: 8,
        borderWidth: 1,
        overflow: 'hidden',
        minWidth: 90,
        marginBottom: 4, // Space for shadow
    },
    touchable: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    mediaItem: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    initialsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    label: {
        textTransform: 'capitalize',
        fontSize: 13,
    },
});

export default React.memo(CategoryTab);
