import React from 'react';
import { View, StyleSheet, Image, ImageBackground } from 'react-native';
import { Text, Surface, useTheme, Icon } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ViewShot from 'react-native-view-shot';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export interface ShareableItem {
    title: string;
    image?: string;
    date?: string;
    author?: string;
}

interface ShareableDetailProps {
    viewShotRef: React.RefObject<any>;
    title: string;
    type: 'CATEGORY' | 'TAG' | 'ARTICLE';
    count?: number;
    image?: string | null;
    description?: string;
    items?: ShareableItem[]; // List of detailed items
    aspectRatio?: '1:1' | '16:9';

    author?: string; // For Article
    metaLabel?: string; // Custom label override
    metaValue?: string; // Custom value override
}

const ShareableDetail: React.FC<ShareableDetailProps> = ({
    viewShotRef,
    title,
    type,
    count,
    image,
    description,
    items,
    aspectRatio = '1:1',
    author,
    metaLabel,
    metaValue,
}) => {
    const theme = useTheme();

    const getIcon = () => {
        switch (type) {
            case 'CATEGORY': return 'view-grid-outline';
            case 'TAG': return 'tag-outline';
            case 'ARTICLE': return 'file-document-outline';
            default: return 'star-outline';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'CATEGORY': return 'rgba(109, 219, 172, 1)'; // #6DDBAC
            case 'TAG': return 'rgba(179, 204, 190, 1)'; // #B3CCBE
            case 'ARTICLE': return '#4aa3ff'; // A nice blue for articles
            default: return '#FFF';
        }
    };

    const getLabel = () => {
        switch (type) {
            case 'CATEGORY': return 'CATEGORÍA';
            case 'TAG': return 'ETIQUETA';
            case 'ARTICLE': return 'ARTÍCULO';
            default: return '';
        }
    };

    return (
        <View style={styles.hiddenTemplate} pointerEvents="none">
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
                <View style={[
                    styles.shareTemplate,
                    aspectRatio === '16:9' ? styles.shareTemplateVertical : styles.shareTemplateSquare,
                    { backgroundColor: '#0A0A0A' }
                ]}>
                    <ImageBackground
                        source={image ? { uri: image } : require('../../assets/images/logotipo.png')}
                        style={styles.backgroundImage}
                        blurRadius={type === 'ARTICLE' ? 3 : 20}
                    >
                        <LinearGradient
                            colors={['rgba(0,0,0,0.3)', '#0A0A0A']}
                            style={styles.gradientOverlay}
                        />
                    </ImageBackground>

                    <View style={styles.contentContainer}>
                        {/* Header Badge */}
                        <View style={styles.headerRow}>
                            <Surface style={[styles.platformBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]} elevation={0}>
                                <Icon source="google-play" size={12} color="#FFF" />
                                <Text style={styles.storeText}>Android</Text>
                            </Surface>
                            <Surface style={[styles.platformBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]} elevation={0}>
                                <Icon source="apple" size={12} color="#FFF" />
                                <Text style={styles.storeText}>iOS</Text>
                            </Surface>
                        </View>

                        {/* Main Content */}
                        <View style={styles.mainContent}>
                            <View style={styles.typeBadge}>
                                <MaterialCommunityIcons
                                    name={getIcon()}
                                    size={16}
                                    color={getColor()}
                                />
                                <Text style={styles.typeText}>{getLabel()}</Text>
                            </View>

                            <Text style={[
                                styles.title,
                                type === 'ARTICLE' && { fontSize: 32, lineHeight: 38 },
                                (items && items.length > 0) && { marginBottom: 24 }
                            ]} numberOfLines={items ? 2 : 4}>
                                {title}
                            </Text>

                            {description && !items && (
                                <Text style={styles.description} numberOfLines={3}>
                                    {description}
                                </Text>
                            )}

                            {/* Article Author specific */}
                            {type === 'ARTICLE' && author && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                    <MaterialCommunityIcons name="account-edit-outline" size={16} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
                                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>{author}</Text>
                                </View>
                            )}

                            {/* Featured Hero Card + List */}
                            {items && items.length > 0 && (
                                <View style={styles.listContainer}>
                                    {/* Hero Card (First Item) */}
                                    <View style={styles.heroCard}>
                                        {items[0].image && (
                                            <Image source={{ uri: items[0].image }} style={styles.heroImage} resizeMode="cover" />
                                        )}
                                        <View style={styles.heroContent}>
                                            <Text style={styles.heroTitle} numberOfLines={2}>{items[0].title}</Text>
                                            <View style={styles.cardMeta}>
                                                {items[0].date && (
                                                    <Text style={[styles.cardMetaText, { color: getColor() }]}>{items[0].date}</Text>
                                                )}
                                                {items[0].author && (
                                                    <>
                                                        <Text style={[styles.cardMetaText, { marginHorizontal: 6, color: 'rgba(255,255,255,0.4)' }]}>|</Text>
                                                        <Text style={[styles.cardMetaText, { color: 'rgba(255,255,255,0.8)' }]}>{items[0].author}</Text>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                    </View>

                                    {/* Compact List (Remaining Items) */}
                                    {items.length > 1 && (
                                        <View style={styles.compactList}>
                                            {items.slice(1, aspectRatio === '16:9' ? 4 : 2).map((item, index) => (
                                                <View key={index} style={styles.card}>
                                                    {item.image && (
                                                        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                                                    )}
                                                    <View style={styles.cardContent}>
                                                        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                                                        <View style={styles.cardMeta}>
                                                            {item.date && (
                                                                <Text style={[styles.cardMetaText, { color: getColor() }]}>{item.date}</Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}

                            <View style={styles.metaBox}>
                                <Text style={[styles.countValue, { color: getColor() }]}>
                                    {metaValue || count}
                                </Text>
                                <Text style={styles.countLabel}>
                                    {metaLabel || (type === 'CATEGORY' ? 'Artículos Disponibles' : 'Artículos Relacionados')}
                                </Text>
                            </View>
                        </View>


                        {/* Footer */}
                        <View style={styles.footer}>
                            <Image
                                source={require('../../assets/images/logotipo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <Text style={[styles.footerUrl, { color: getColor() }]}>vtrading.app</Text>
                        </View>
                    </View>
                </View>
            </ViewShot>
        </View>
    );
};

const styles = StyleSheet.create({
    hiddenTemplate: {
        position: 'absolute',
        left: -2000,
        width: 600,
        zIndex: -1,
    },
    shareTemplate: {
        overflow: 'hidden',
        position: 'relative',
    },
    shareTemplateSquare: {
        width: 600,
        height: 600,
    },
    shareTemplateVertical: {
        width: 600,
        height: 1066,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    contentContainer: {
        flex: 1,
        padding: 40,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        gap: 12,
    },
    platformBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    storeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8,
    },
    typeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    title: {
        fontSize: 48,
        lineHeight: 52,
        color: '#FFF',
        fontWeight: '900',
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 32,
        lineHeight: 24,
    },
    metaBox: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        paddingTop: 20,
        width: '100%',
        marginTop: 'auto', // Push to bottom of mainContainer
    },
    countValue: {
        fontSize: 32,
        fontWeight: '900',
    },
    countLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 20,
    },
    logo: {
        width: 120,
        height: 30,
        tintColor: '#FFF',
    },
    footerUrl: {
        color: '#6DDBAC',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    listContainer: {
        width: '100%',
        marginBottom: 24,
        flex: 1,
    },
    heroCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    heroImage: {
        width: '100%',
        height: 200, // Taller image for hero
    },
    heroContent: {
        padding: 16,
    },
    heroTitle: {
        color: '#FFF',
        fontSize: 20, // Larger title
        fontWeight: '900',
        lineHeight: 26,
        marginBottom: 10,
    },
    compactList: {
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        overflow: 'hidden',
        alignItems: 'center',
        height: 56,
    },
    cardImage: {
        width: 56,
        height: 56,
    },
    cardContent: {
        flex: 1,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    cardTitle: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
        lineHeight: 16,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    cardMetaText: {
        fontSize: 10,
        fontWeight: '700',
        opacity: 0.9,
    },
});

export default ShareableDetail;
