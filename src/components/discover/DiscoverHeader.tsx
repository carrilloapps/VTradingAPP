import React from 'react';
import { View, StyleSheet, Image, Animated, StatusBar, useWindowDimensions, Keyboard } from 'react-native';
import { Text, useTheme, TouchableRipple } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SearchBar from '../ui/SearchBar';

export type DiscoverHeaderVariant = 'main' | 'detail' | 'tag' | 'category' | 'search';

interface DiscoverHeaderProps {
    variant?: DiscoverHeaderVariant;
    onSearchPress?: () => void;
    onNotificationsPress?: () => void;
    onBackPress?: () => void;
    onSharePress?: () => void;
    title?: string;
    scrollY?: Animated.Value;
    contentHeight?: number;
    // Search specific
    searchTerm?: string;
    onSearchChange?: (text: string) => void;
    onSearchSubmit?: () => void;
    autoFocus?: boolean;
}

const DiscoverHeader: React.FC<DiscoverHeaderProps> = ({
    variant = 'main',
    onSearchPress,
    onNotificationsPress,
    onBackPress,
    onSharePress,
    title = '',
    scrollY,
    contentHeight = 0,
    searchTerm,
    onSearchChange,
    onSearchSubmit,
    autoFocus = false,
}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const scroll = scrollY || new Animated.Value(0);

    // Common animations
    const gradientOpacity = scroll.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    const isFadingVariant = variant === 'detail' || variant === 'tag' || variant === 'category';

    const solidBgOpacity = variant === 'main'
        ? 0
        : variant === 'search'
            ? 1 // Search usually has a solid background for contrast
            : scroll.interpolate({
                inputRange: [50, 200],
                outputRange: [0, 1],
                extrapolate: 'clamp'
            });

    // Logo fade-out for detail/tag/category variants
    const logoOpacity = variant === 'main'
        ? 1
        : isFadingVariant || variant === 'search'
            ? scroll.interpolate({
                inputRange: [0, 80],
                outputRange: [1, 0],
                extrapolate: 'clamp'
            })
            : 1;

    // Title fade-in for detail/tag/category variants
    const titleOpacity = variant === 'main' || variant === 'search'
        ? 0
        : scroll.interpolate({
            inputRange: [120, 220],
            outputRange: [0, 1],
            extrapolate: 'clamp'
        });

    const isDark = theme.dark;

    // Status Bar Style
    const barStyle = isDark ? 'light-content' : (variant === 'main' || isFadingVariant ? (isFadingVariant ? 'light-content' : 'dark-content') : 'dark-content');

    // Button dynamic styles
    const buttonBgColor = isDark ? 'rgba(30, 35, 32, 0.7)' : 'rgba(255, 255, 255, 0.85)';
    const buttonStyles = [
        styles.iconButton,
        {
            backgroundColor: buttonBgColor,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : theme.colors.outline,
            borderWidth: 1,
        }
    ];

    const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

    // Reading Progress calculation (only for detail)
    const maxScroll = contentHeight > windowHeight ? contentHeight - windowHeight : 1;
    const isDetail = variant === 'detail';

    const progressScaleX = scroll.interpolate({
        inputRange: [0, maxScroll],
        outputRange: [0.0001, 1],
        extrapolate: 'clamp'
    });

    const progressTranslateX = scroll.interpolate({
        inputRange: [0, maxScroll],
        outputRange: [-windowWidth / 2, 0],
        extrapolate: 'clamp'
    });

    const displayTitle = variant === 'tag' && !title.startsWith('#') ? `#${title}` : title;

    return (
        <View style={[
            styles.container,
            { height: insets.top + 62 },
            variant === 'search' && styles.containerSearch
        ]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                translucent
                backgroundColor="transparent"
            />

            {/* Background Layer */}
            <View style={StyleSheet.absoluteFill}>
                {/* Gradient Layer (fades out on scroll for fading variants) */}
                <Animated.View style={[
                    StyleSheet.absoluteFill,
                    { opacity: variant === 'main' || isFadingVariant ? gradientOpacity : 0 }
                ]}>
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent']}
                        style={{ height: insets.top + 140 }}
                        pointerEvents="none"
                    />
                </Animated.View>

                {/* Solid Glassy Layer (fades in on scroll for detail/tag/category) */}
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            opacity: solidBgOpacity,
                            backgroundColor: isDark ? 'rgba(25, 28, 26, 0.95)' : 'rgba(251, 253, 249, 0.95)',
                        }
                    ]}
                >
                    <View style={[
                        styles.separator,
                        {
                            backgroundColor: theme.colors.outlineVariant,
                            bottom: 0,
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: 1,
                            opacity: 0.5
                        }
                    ]} />
                </Animated.View>

                {/* Progress Bar (detail only) */}
                {isDetail && contentHeight > 0 && (
                    <Animated.View
                        style={[
                            styles.progressBar,
                            {
                                backgroundColor: theme.colors.primary,
                                width: windowWidth,
                                transform: [
                                    { translateX: progressTranslateX },
                                    { scaleX: progressScaleX }
                                ]
                            }
                        ]}
                    />
                )}
            </View>

            {/* Content Layer */}
            <View style={[styles.content, { paddingTop: insets.top }]}>
                {/* Left Section */}
                <View style={[styles.leftContainer, variant === 'main' && { flex: 1 }]}>
                    {variant !== 'main' ? (
                        <TouchableRipple
                            onPress={onBackPress}
                            style={buttonStyles}
                            borderless
                            rippleColor="rgba(0,0,0,0.1)"
                            hitSlop={hitSlop}
                            accessibilityLabel="Volver"
                            accessibilityRole="button"
                        >
                            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
                        </TouchableRipple>
                    ) : (
                        <Animated.View style={{ opacity: logoOpacity }}>
                            <Image
                                source={require('../../assets/images/logotipo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </Animated.View>
                    )}
                </View>

                {/* Center Section (Title or SearchBar) */}
                {variant === 'search' ? (
                    <View style={styles.searchContainer}>
                        <SearchBar
                            placeholder="Buscar noticias..."
                            value={searchTerm}
                            onChangeText={onSearchChange}
                            onSubmitEditing={() => {
                                onSearchSubmit?.();
                                Keyboard.dismiss();
                            }}
                            autoFocus={autoFocus}
                            style={{ elevation: 0, shadowOpacity: 0 }}
                        />
                    </View>
                ) : (
                    <View style={[styles.centerContainer, { top: insets.top }]}>
                        {isFadingVariant && (
                            <Animated.View style={{ opacity: logoOpacity, position: 'absolute' }}>
                                <Image
                                    source={require('../../assets/images/logotipo.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </Animated.View>
                        )}
                        <Animated.View style={{ opacity: titleOpacity }}>
                            <Text
                                numberOfLines={1}
                                style={[styles.headerTitle, { color: theme.colors.onSurface }]}
                            >
                                {displayTitle}
                            </Text>
                        </Animated.View>
                    </View>
                )}

                {/* Right Section */}
                <View style={styles.rightContainer}>
                    {variant === 'main' ? (
                        <View style={styles.rightButtons}>
                            <TouchableRipple
                                onPress={onSearchPress}
                                style={buttonStyles}
                                borderless
                                rippleColor="rgba(0,0,0,0.1)"
                                hitSlop={hitSlop}
                                accessibilityLabel="Buscar"
                                accessibilityRole="button"
                            >
                                <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.onSurface} />
                            </TouchableRipple>
                            <TouchableRipple
                                onPress={onNotificationsPress}
                                style={buttonStyles}
                                borderless
                                rippleColor="rgba(0,0,0,0.1)"
                                hitSlop={hitSlop}
                                accessibilityLabel="Notificaciones"
                                accessibilityRole="button"
                            >
                                <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.onSurface} />
                            </TouchableRipple>
                        </View>
                    ) : variant === 'search' ? (
                        <TouchableRipple
                            onPress={onNotificationsPress}
                            style={buttonStyles}
                            borderless
                            rippleColor="rgba(0,0,0,0.1)"
                            hitSlop={hitSlop}
                            accessibilityLabel="Notificaciones"
                            accessibilityRole="button"
                        >
                            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.onSurface} />
                        </TouchableRipple>
                    ) : (
                        <TouchableRipple
                            onPress={onSharePress}
                            style={buttonStyles}
                            borderless
                            rippleColor="rgba(0,0,0,0.1)"
                            hitSlop={hitSlop}
                            accessibilityLabel="Compartir"
                            accessibilityRole="button"
                        >
                            <MaterialCommunityIcons name="share-variant" size={22} color={theme.colors.onSurface} />
                        </TouchableRipple>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        zIndex: 100,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    containerSearch: {
        position: 'relative',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        justifyContent: 'space-between',
    },
    leftContainer: {
        minWidth: 48,
        justifyContent: 'center',
        zIndex: 2,
    },
    centerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 70,
        right: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        flex: 1,
        paddingHorizontal: 8,
    },
    rightContainer: {
        minWidth: 48,
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 2,
    },
    rightButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    logoImage: {
        height: 32,
        width: 130,
    },
    logoImageSmall: {
        height: 24,
        width: 100,
    },
    logoText: {
        fontStyle: 'italic',
        fontWeight: '900',
        letterSpacing: -1,
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        height: 2,
        left: 0,
    },
    separator: {
        bottom: 0,
    }
});

export default DiscoverHeader;
