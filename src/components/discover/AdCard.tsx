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
                    colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']} 
                    style={styles.adGradient}
                >
                    <View style={styles.adContent}>
                        <View>
                            <Text variant="titleLarge" style={styles.adTitle}>{item.title}</Text>
                            <Text variant="bodyMedium" style={styles.adSubtitle}>{item.subtitle}</Text>
                        </View>

                        <Button 
                            mode="contained" 
                            buttonColor={item.color}
                            textColor="#fff"
                            style={styles.adButton}
                            labelStyle={{ fontSize: 13, fontWeight: 'bold' }}
                            onPress={() => {}}
                        >
                            {item.cta}
                        </Button>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </Surface>
    );
};

const styles = StyleSheet.create({
    adCard: {
        height: 180,
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
        gap: 8,
        alignItems: 'flex-start',
    },
    adTitle: {
        color: 'white',
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    adSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    adButton: {
        borderRadius: 20,
        marginTop: 8,
    },
});

export default React.memo(AdCard);
