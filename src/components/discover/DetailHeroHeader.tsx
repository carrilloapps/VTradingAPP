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
        if (type === 'CATEGORY') {
            return theme.dark ? '#6DDBAC' : theme.colors.primary;
        } else {
            return theme.dark ? '#B3CCBE' : theme.colors.secondary;
        }
    };

    return (
        <View style={styles.headerWrapper}>
            <View style={[styles.heroBackground, { backgroundColor: theme.colors.surface }]}>
                <ImageBackground
                    source={image ? { uri: image } : undefined}
                    style={styles.heroBackground}
                    blurRadius={15}
                    imageStyle={{ opacity: theme.dark ? 0.5 : 0.35 }}
                >
                    <LinearGradient
                        colors={[
                            theme.dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
                            theme.dark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)',
                            'transparent',
                            theme.colors.background
                        ]}
                        locations={[0, 0.2, 0.5, 1]}
                        style={styles.gradientOverlay}
                    >
                        <View style={styles.heroContent}>
                            <View style={[styles.categoryBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
                                <MaterialCommunityIcons name={getBadgeIcon()} size={16} color={getBadgeColor()} />
                                <Text variant="labelLarge" style={[styles.badgeText, { color: theme.colors.onSurface }]}>{categoryName}</Text>
                            </View>

                            <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.primary }]}>
                                {title}
                            </Text>

                            {description ? (
                                <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
                                    {description}
                                </Text>
                            ) : null}

                            <View style={styles.metaStrip}>
                                <View style={styles.metaItem}>
                                    <Text variant="labelSmall" style={[styles.metaLabel, { color: theme.colors.onSurfaceVariant, opacity: 0.7 }]}>ÚLTIMA ACTUALIZACIÓN</Text>
                                    <Text variant="bodyMedium" style={[styles.metaValue, { color: theme.colors.onSurface }]} numberOfLines={1}>
                                        {formatDate(lastUpdateDate)}
                                    </Text>
                                </View>
                                <View style={styles.metaGap} />
                                <View style={styles.metaItem}>
                                    <Text variant="labelSmall" style={[styles.metaLabel, { color: theme.colors.onSurfaceVariant, opacity: 0.7 }]}>{type === 'CATEGORY' ? 'ARTÍCULOS' : 'TOTAL'}</Text>
                                    <Text variant="bodyMedium" style={[styles.metaValue, { color: theme.colors.onSurface }]}>{articleCount}</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </View>

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
        fontWeight: '900',
        marginLeft: 8,
        letterSpacing: 1,
    },
    title: {
        fontWeight: '900',
        fontSize: 48,
        lineHeight: 52,
        textTransform: 'uppercase',
        letterSpacing: -1,
        marginBottom: 12,
    },
    description: {
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
        fontWeight: '800',
        marginBottom: 2,
        fontSize: 10,
    },
    metaValue: {
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
