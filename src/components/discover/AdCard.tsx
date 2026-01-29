import React from 'react';
import { View, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
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
}

const AdCard = ({ item }: AdCardProps) => {
    const theme = useAppTheme();
    // Use window width if possible, but keep stylesheet reference for layout
    const cardWidth = Dimensions.get('window').width - 40;

    return (
        <Surface style={[styles.adCard, { width: cardWidth, borderRadius: theme.roundness * 4, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.outlineVariant }]} elevation={0}>
            <ImageBackground source={{ uri: item.image }} style={styles.adBackground} imageStyle={{ borderRadius: theme.roundness * 4 }}>
                <LinearGradient 
                    colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']} 
                    style={styles.adGradient}
                >
                    {/* Diagonal Ribbon */}
                    <View style={[styles.ribbonContainer]}>
                        <View style={[styles.ribbon, { backgroundColor: theme.colors.warning }]}>
                            <Text style={[styles.ribbonText, { color: theme.colors.onPrimary }]}>PROMO</Text>
                        </View>
                    </View>

                    <View style={styles.adContent}>
                        <Text variant="headlineSmall" style={styles.adTitle} numberOfLines={2}>
                            {item.title}
                        </Text>

                        <Button 
                            mode="contained" 
                            buttonColor={item.color || theme.colors.primary}
                            textColor={theme.colors.onPrimary}
                            style={styles.adButton}
                            labelStyle={{ fontSize: 13, fontWeight: 'bold' }}
                            compact
                            onPress={() => {}}
                        >
                            {item.cta || 'Ver Más'}
                        </Button>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </Surface>
    );
};

const styles = StyleSheet.create({
    adCard: {
        height: 200, // Slightly taller for impact
        marginHorizontal: 20,
        overflow: 'hidden',
        marginTop: 8,
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
        gap: 12,
        alignItems: 'flex-start',
    },
    adTitle: {
        color: 'white',
        fontWeight: '800',
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    adButton: {
        paddingHorizontal: 8,
    },
    ribbonContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        overflow: 'hidden',
        width: 100,
        height: 100,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    ribbon: {
        width: 150,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '45deg' }, { translateX: 30 }, { translateY: -20 }],
    },
    ribbonText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

export default React.memo(AdCard);
