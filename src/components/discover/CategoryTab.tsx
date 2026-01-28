import React, { useRef } from 'react';
import { StyleSheet, Animated, Image, View } from 'react-native';
import { Text, Surface, TouchableRipple, useTheme } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';

interface CategoryTabProps {
    name: string;
    image?: string;
    count?: number;
    selected: boolean;
    onPress: () => void;
}

const CategoryTab = ({ name, image, count, selected, onPress }: CategoryTabProps) => {
    const theme = useAppTheme();
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
                        backgroundColor: selected ? theme.colors.primary : theme.colors.elevation.level1,
                        borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
                    }
                ]}
                elevation={selected ? 2 : 0}
            >
                <TouchableRipple
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    style={styles.touchable}
                    borderless
                    rippleColor="rgba(255, 255, 255, 0.2)"
                >
                    <View style={styles.content}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: selected ? 'rgba(255,255,255,0.2)' : theme.colors.surfaceVariant }]}>
                                <Text style={[styles.avatarText, { color: selected ? 'white' : theme.colors.primary }]}>
                                    {name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        
                        <View style={styles.textContainer}>
                            <Text 
                                style={[
                                    styles.label, 
                                    { color: selected ? 'white' : theme.colors.onSurfaceVariant }
                                ]}
                            >
                                {name}
                            </Text>
                            {count !== undefined && count > 0 && (
                                <Text 
                                    style={[
                                        styles.count, 
                                        { color: selected ? 'rgba(255,255,255,0.7)' : theme.colors.outline }
                                    ]}
                                >
                                    {count}
                                </Text>
                            )}
                        </View>
                    </View>
                </TouchableRipple>
            </Surface>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        marginRight: 10,
        borderWidth: 1,
        overflow: 'hidden',
        minWidth: 80,
    },
    touchable: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    avatarPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 10,
        fontWeight: '900',
    },
    textContainer: {
        flexDirection: 'column',
    },
    label: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    count: {
        fontSize: 9,
        fontWeight: '700',
        marginTop: -1,
    },
});

export default React.memo(CategoryTab);
