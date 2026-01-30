import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, IconButton, Divider } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';
import SectionHeader from './SectionHeader';

const RECOMMENDED_APPS = [
    { id: 'app1', name: 'TradingView', icon: 'chart-box-outline', color: 'adaptive' },
    { id: 'app2', name: 'MetaMask', icon: 'wallet-outline', color: '#F6851B' },
    { id: 'app3', name: 'Binance', icon: 'bitcoin', color: '#F3BA2F' },
    { id: 'app4', name: 'CoinGecko', icon: 'finance', color: '#8DC351' },
];

const PARTNERS = [
    { id: 'part1', name: 'AWS' },
    { id: 'part2', name: 'Firebase' },
    { id: 'part3', name: 'Google Cloud' },
];

const PartnersSection = () => {
    const theme = useAppTheme();
    return (
        <View style={styles.partnersContainer}>
            <SectionHeader title="Apps Recomendadas" onViewAll={() => { }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.appsScroll}>
                {RECOMMENDED_APPS.map(app => (
                    <Surface
                        key={app.id}
                        style={[
                            styles.appCard,
                            {
                                backgroundColor: theme.colors.elevation.level2,
                                borderWidth: 1,
                                borderColor: theme.colors.outlineVariant,
                                borderRadius: theme.roundness * 4
                            }
                        ]}
                        elevation={0}
                    >
                        <IconButton
                            icon={app.icon}
                            iconColor={app.color === 'adaptive' ? theme.colors.onSurface : app.color}
                            size={28}
                            style={{ margin: 0 }}
                        />
                        <Text variant="labelSmall" style={{ marginTop: 4, color: theme.colors.onSurface }}>{app.name}</Text>
                    </Surface>
                ))}
            </ScrollView>

            <View style={styles.dividerContainer}>
                <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
            </View>

            <View style={{ marginTop: 8 }}>
                <SectionHeader title="PARTNERS OFICIALES" variant="secondary" center />
            </View>
            <View style={styles.partnersRow}>
                {PARTNERS.map(p => (
                    <Text key={p.id} style={{ fontSize: 16, fontWeight: '700', color: theme.colors.onSurfaceVariant, opacity: 0.9 }}>{p.name}</Text>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    partnersContainer: {
        paddingBottom: 20,
        paddingTop: 10,
    },
    sectionTitle: {
        paddingHorizontal: 20,
        fontWeight: 'bold',
    },
    appsScroll: {
        paddingHorizontal: 20,
        gap: 12,
        paddingBottom: 10,
    },
    appCard: {
        width: 90,
        height: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dividerContainer: {
        paddingHorizontal: 20,
        marginVertical: 20,
    },
    partnersTitle: {
        textAlign: 'center',
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 16,
    },
    partnersRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
});

export default React.memo(PartnersSection);
