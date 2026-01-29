import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Text } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/theme';

interface DetailHeroHeaderProps {
    image?: string | null;
    categoryName: string;
    title: string;
    description?: string;
    lastUpdateDate?: string;
    articleCount: number;
    sectionTitle: string;
    type: 'CATEGORY' | 'TAG';
}

const DetailHeroHeader: React.FC<DetailHeroHeaderProps> = ({
    image,
    categoryName,
    title,
    description,
    lastUpdateDate,
    articleCount,
    sectionTitle,
    type,
}) => {
    const theme = useAppTheme();

    const formatDate = (dateString?: string) => {
        if (!dateString) return '---';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(date);
        } catch (e) {
            return '---';
        }
    };

    const getBadgeIcon = () => {
        return type === 'CATEGORY' ? 'view-grid-outline' : 'tag-outline';
    };

    const getBadgeColor = () => {
        return type === 'CATEGORY' ? theme.colors.primary : theme.colors.secondary;
    };

    const getSectionColor = () => {
        // Mimicking original styles: Category uses Primary Green, Tag uses Secondary/Light Green
        return type === 'CATEGORY' ? '#6DDBAC' : '#B3CCBE';
    };

    return (
        <View style={styles.headerWrapper}>
            <ImageBackground
                source={image ? { uri: image } : undefined}
                style={styles.heroBackground}
                blurRadius={15}
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', theme.colors.background]}
                    style={styles.gradientOverlay}
                >
                    <View style={styles.heroContent}>
                        <View style={styles.categoryBadge}>
                            <MaterialCommunityIcons name={getBadgeIcon()} size={16} color={getBadgeColor()} />
                            <Text variant="labelLarge" style={styles.badgeText}>{categoryName}</Text>
                        </View>

                        <Text variant="headlineLarge" style={styles.title}>
                            {title}
                        </Text>

                        {description ? (
                            <Text variant="bodyMedium" style={styles.description} numberOfLines={3}>
                                {description}
                            </Text>
                        ) : null}

                        <View style={styles.metaStrip}>
                            <View style={styles.metaItem}>
                                <Text variant="labelSmall" style={styles.metaLabel}>ÚLTIMA ACTUALIZACIÓN</Text>
                                <Text variant="bodyMedium" style={styles.metaValue} numberOfLines={1}>
                                    {formatDate(lastUpdateDate)}
                                </Text>
                            </View>
                            <View style={styles.metaGap} />
                            <View style={styles.metaItem}>
                                <Text variant="labelSmall" style={styles.metaLabel}>{type === 'CATEGORY' ? 'ARTÍCULOS' : 'TOTAL'}</Text>
                                <Text variant="bodyMedium" style={styles.metaValue}>{articleCount}</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>

            <View style={styles.sectionHeader}>
                <Text variant="labelLarge" style={[styles.sectionTitle, { color: getSectionColor() }]}>
                    {sectionTitle}
                </Text>
                <View style={[styles.sectionDivider, { backgroundColor: `${getSectionColor()}33` }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerWrapper: {
        marginBottom: 0,
    },
    heroBackground: {
        width: '100%',
        height: 480,
    },
    gradientOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 40,
        paddingHorizontal: 24,
        paddingTop: 80,
    },
    heroContent: {
        alignItems: 'flex-start',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginBottom: 16,
    },
    badgeText: {
        color: '#FFF',
        fontWeight: '900',
        marginLeft: 8,
        letterSpacing: 1,
    },
    title: {
        fontWeight: '900',
        color: '#FFF',
        fontSize: 48,
        lineHeight: 52,
        textTransform: 'uppercase',
        letterSpacing: -1,
        marginBottom: 12,
    },
    description: {
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 22,
        marginBottom: 32,
        fontSize: 15,
        maxWidth: '95%',
    },
    metaStrip: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        // metadata column
    },
    metaLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '800',
        marginBottom: 2,
        fontSize: 10,
    },
    metaValue: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 13,
    },
    metaGap: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 20,
    },
    sectionHeader: {
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sectionTitle: {
        fontWeight: '900',
        letterSpacing: 1.2,
    },
    sectionDivider: {
        flex: 1,
        height: 1,
    },
});

export default DetailHeroHeader;
