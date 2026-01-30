import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ImageBackground, Dimensions, Animated, Easing } from 'react-native';
import { Text, Surface, Icon, TouchableRipple } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/theme';

interface AdItem {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    color: string;
    cta: string;
}

interface AdCardProps {
    item: AdItem;
    onPress: () => void;
}

const AdCard = ({ item, onPress }: AdCardProps) => {
    const theme = useAppTheme();
    // Use window width if possible, but keep stylesheet reference for layout
    const cardWidth = Dimensions.get('window').width - 40;

    // Pulse Animation
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    return (
        <Surface style={[
            styles.adCard,
            {
                width: cardWidth,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
                borderRadius: theme.roundness * 4,
            }
        ]} elevation={0}>
            <TouchableRipple onPress={onPress} style={styles.flex1} borderless>
                <ImageBackground
                    source={{ uri: item.image }}
                    style={styles.adBackground}
                    imageStyle={[styles.adImage, { borderRadius: theme.roundness * 4 }]}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
                        style={styles.adGradient}
                    >
                        {/* Diagonal Ribbon */}
                        <View style={styles.ribbonContainer}>
                            <View style={[styles.ribbon, { backgroundColor: theme.colors.warning }]}>
                                <Text style={[styles.ribbonText, { color: theme.colors.onPrimary }]}>PROMO</Text>
                            </View>
                        </View>

                        <View style={styles.adContent}>
                            <Text variant="headlineSmall" style={styles.adTitle} numberOfLines={2}>
                                {item.title}
                            </Text>

                            <Animated.View style={[
                                styles.iconContainer,
                                {
                                    backgroundColor: theme.colors.onPrimaryContainer,
                                    transform: [{ scale: pulseAnim }],
                                    borderRadius: theme.roundness * 3
                                }
                            ]}>
                                <Icon source="arrow-right" size={24} color={theme.colors.onPrimary} />
                            </Animated.View>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </TouchableRipple>
        </Surface>
    );
};

const styles = StyleSheet.create({
    adCard: {
        height: 200,
        marginHorizontal: 20,
        overflow: 'hidden',
        marginTop: 8,
        borderWidth: 1,
    },
    flex1: {
        flex: 1,
    },
    adImage: {
    },
    adBackground: {
        width: '100%',
        height: '100%',
    },
    adGradient: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 20,
    },
    adContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 12,
    },
    adTitle: {
        flex: 1,
        color: 'white',
        fontWeight: '800',
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        marginBottom: 4, // Alignment tweak
    },
    iconContainer: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ribbonContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        overflow: 'hidden',
        width: 100,
        height: 100,
    },
    ribbon: {
        backgroundColor: '#FBC02D',
        position: 'absolute',
        top: 25,
        right: -30,
        width: 140,
        transform: [{ rotate: '45deg' }],
        paddingVertical: 4,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    ribbonText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.2,
        textAlign: 'center',
    },
});

export default React.memo(AdCard);
