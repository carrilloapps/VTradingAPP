import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';
import SectionHeader from './SectionHeader';
import AppRecommendations from './AppRecommendations';

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
            <AppRecommendations />

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
