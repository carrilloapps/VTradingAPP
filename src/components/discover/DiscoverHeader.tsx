import React from 'react';
import { View, StyleSheet, Image, Animated, StatusBar, useWindowDimensions } from 'react-native';
import { Text, useTheme, TouchableRipple } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface DiscoverHeaderProps {
    variant?: 'main' | 'detail';
    onSearchPress?: () => void;
    onNotificationsPress?: () => void;
    onBackPress?: () => void;
    onSharePress?: () => void;
    title?: string;
    scrollY?: Animated.Value;
    contentHeight?: number;
}

const DiscoverHeader = ({
    variant = 'main',
    onSearchPress,
    onNotificationsPress,
    onBackPress,
    onSharePress,
    title,
    scrollY,
    contentHeight = 0
}: DiscoverHeaderProps) => {
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    // Default scroll value if none provided
    const scroll = scrollY || new Animated.Value(0);

    // Reading Progress calculation
    // contentHeight includes the header and other elements, so we need a rough estimate of scrollable area
    const maxScroll = contentHeight > windowHeight ? contentHeight - windowHeight : 1;

    const progressScaleX = scroll.interpolate({
        inputRange: [0, maxScroll],
        outputRange: [0.0001, 1], // Avoid 0 scale issues
        extrapolate: 'clamp'
    });

    const progressTranslateX = scroll.interpolate({
        inputRange: [0, maxScroll],
        outputRange: [-windowWidth / 2, 0],
        extrapolate: 'clamp'
    });

    // Background transition: From Gradient (Top) to Solid (Glass)
    const gradientOpacity = scroll.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    const solidBgOpacity = variant === 'main'
        ? 0
        : scroll.interpolate({
            inputRange: [50, 200],
            outputRange: [0, 1],
            extrapolate: 'clamp'
        });

    // Logo fade-out for detail variant
    const logoOpacity = variant === 'main'
        ? 1
        : scroll.interpolate({
            inputRange: [0, 80],
            outputRange: [1, 0],
            extrapolate: 'clamp'
        });

    // Title fade-in for detail variant
    const titleOpacity = variant === 'main'
        ? 0
        : scroll.interpolate({
            inputRange: [120, 220],
            outputRange: [0, 1],
            extrapolate: 'clamp'
        });

    const isDark = theme.dark;

    // Status Bar Style: Adaptive to theme to ensure visibility over the background gradient
    const barStyle = isDark ? 'light-content' : 'dark-content';

    // Logo Glow Color: Green in light Mode, Dark in dark mode
    const logoGlowColor = isDark ? 'rgba(0,0,0,0.8)' : '#22C55E';

    // Button dynamic styles (Match UnifiedHeader) - Glassy style
    const buttonBgColor = isDark ? 'rgba(30, 35, 32, 0.7)' : 'rgba(255, 255, 255, 0.85)';
    const buttonStyles = [
        styles.iconButton,
        {
            backgroundColor: buttonBgColor,
            borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : theme.colors.outline,
            borderWidth: 1,
        }
    ];

    const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

    return (
        <View style={[styles.container, { height: insets.top + (variant === 'detail' ? 62 : 60) }]}>
            <StatusBar
                barStyle={barStyle}
                translucent
                backgroundColor="transparent"
            />

            {/* Background Layer */}
            <View style={StyleSheet.absoluteFill}>
                {/* Initial Gradient: Visibility for Main and Initial Detail view */}
                <Animated.View style={[
                    StyleSheet.absoluteFill,
                    variant === 'detail' ? { opacity: gradientOpacity } : { opacity: 1 }
                ]}>
                    <LinearGradient
                        colors={[theme.colors.background, 'transparent']}
                        style={{ height: insets.top + 120 }}
                        pointerEvents="none"
                    />
                </Animated.View>

                {/* Solid Background (Glassmorphism): Fades in only on scroll for DETAIL variant */}
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            opacity: solidBgOpacity,
                            backgroundColor: isDark ? 'rgba(25, 28, 26, 0.95)' : 'rgba(251, 253, 249, 0.95)',
                        }
                    ]}
                >
                    {/* Add a subtle bottom separator */}
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

                {/* Reading Progress Indicator */}
                {variant === 'detail' && contentHeight > 0 && (
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

            <View style={[styles.content, { marginTop: insets.top }]}>
                {/* Left Section */}
                <View style={styles.leftContainer}>
                    {variant === 'main' ? (
                        <View style={[styles.logoWrapper, {
                            shadowColor: logoGlowColor,
                            shadowRadius: isDark ? 10 : 15,
                            shadowOpacity: isDark ? 0.3 : 0.6,
                        }]}>
                            <Image
                                source={require('../../assets/images/logotipo.png')}
                                style={[styles.logo, { tintColor: isDark ? 'white' : theme.colors.onPrimaryContainer }]}
                                resizeMode="contain"
                            />
                        </View>
                    ) : (
                        <TouchableRipple
                            onPress={onBackPress}
                            style={buttonStyles}
                            borderless
                            rippleColor="rgba(0, 0, 0, .1)"
                            accessibilityRole="button"
                            accessibilityLabel="Regresar"
                            accessibilityHint="Volver a la pantalla anterior"
                            hitSlop={hitSlop}
                        >
                            <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.onSurface} />
                        </TouchableRipple>
                    )}
                </View>

                {/* Center Section (Detail only) */}
                {variant === 'detail' && (
                    <View style={styles.centerContainer} pointerEvents="none">
                        <Animated.View style={[
                            styles.logoWrapper,
                            {
                                opacity: logoOpacity,
                                shadowColor: logoGlowColor,
                                shadowRadius: isDark ? 10 : 15,
                                shadowOpacity: isDark ? 0.3 : 0.5,
                            }
                        ]}>
                            <Image
                                source={require('../../assets/images/logotipo.png')}
                                style={[styles.logo, { tintColor: isDark ? 'white' : theme.colors.onPrimaryContainer }]}
                                resizeMode="contain"
                            />
                        </Animated.View>

                        <Animated.View style={[StyleSheet.absoluteFill, styles.centerContainer, { opacity: titleOpacity }]}>
                            <Text
                                variant="titleSmall"
                                numberOfLines={1}
                                style={{
                                    fontWeight: '800',
                                    color: theme.colors.onSurface,
                                    letterSpacing: -0.5,
                                }}
                            >
                                {title}
                            </Text>
                        </Animated.View>
                    </View>
                )}

                {/* Right Section */}
                <View style={styles.rightContainer}>
                    {onSearchPress && (
                        <TouchableRipple
                            onPress={onSearchPress}
                            style={buttonStyles}
                            borderless
                            rippleColor="rgba(0, 0, 0, .1)"
                            accessibilityRole="button"
                            accessibilityLabel="Buscar"
                            accessibilityHint="Abrir el buscador de artículos"
                            hitSlop={hitSlop}
                        >
                            <MaterialCommunityIcons name="magnify" size={26} color={theme.colors.onSurface} />
                        </TouchableRipple>
                    )}

                    {onNotificationsPress && (
                        <TouchableRipple
                            onPress={onNotificationsPress}
                            style={buttonStyles}
                            borderless
                            rippleColor="rgba(0, 0, 0, .1)"
                            accessibilityRole="button"
                            accessibilityLabel="Notificaciones"
                            accessibilityHint="Ver tus notificaciones"
                            hitSlop={hitSlop}
                        >
                            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.onSurface} />
                        </TouchableRipple>
                    )}

                    {onSharePress && (
                        <TouchableRipple
                            onPress={onSharePress}
                            style={buttonStyles}
                            borderless
                            rippleColor="rgba(0, 0, 0, .1)"
                            accessibilityRole="button"
                            accessibilityLabel="Compartir"
                            accessibilityHint="Compartir este artículo"
                            hitSlop={hitSlop}
                        >
                            <MaterialCommunityIcons name="share-variant-outline" size={22} color={theme.colors.onSurface} />
                        </TouchableRipple>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    leftContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    centerContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 38, // Maximized space for title
        right: 38, // Maximized space for title
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoWrapper: {
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    logo: {
        height: 28,
        width: 120,
    },
    rightContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    separator: {
        zIndex: 1,
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 2,
        zIndex: 10,
    }
});

export default DiscoverHeader;
