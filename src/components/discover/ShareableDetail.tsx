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

    const getIcon = () => {
        switch (type) {
            case 'CATEGORY': return 'view-grid-outline';
            case 'TAG': return 'tag-outline';
            case 'ARTICLE': return 'text-box-outline';
            default: return 'star-outline';
        }
    };

    const getAccentColor = () => {
        switch (type) {
            case 'CATEGORY': return '#6DDBAC';
            case 'TAG': return '#B3CCBE';
            case 'ARTICLE': return '#5FA3FF';
            default: return '#FFF';
        }
    };

    const getLabel = () => {
        switch (type) {
            case 'CATEGORY': return 'COLECCIÓN';
            case 'TAG': return 'TENDENCIA';
            case 'ARTICLE': return 'ARTÍCULO';
            default: return 'DESTACADO';
        }
    };

    // Render logic helper
    const renderHeroWithList = () => {
        if (!items || items.length === 0) return null;

        const heroItem = items[0];
        const listItems = items.slice(1, aspectRatio === '16:9' ? 4 : 2);

        return (
            <View style={styles.listContainer}>
                {/* Hero Card */}
                <View style={[styles.heroCard, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                    {heroItem.image ? (
                        <Image source={{ uri: heroItem.image }} style={styles.heroImage} resizeMode="cover" />
                    ) : (
                        <View style={[styles.heroImage, { backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }]}>
                            <MaterialCommunityIcons name="image-off-outline" size={40} color="rgba(255,255,255,0.2)" />
                        </View>
                    )}

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.heroContent}>
                        <View style={styles.heroBadge}>
                            <Text style={styles.heroBadgeText}><Text style={{ color: getAccentColor() }}>★</Text> DESTACADO</Text>
                        </View>
                        <Text style={styles.heroTitle} numberOfLines={3}>{heroItem.title}</Text>
                        <View style={styles.cardMeta}>
                            {heroItem.author && <Text style={styles.cardMetaAuthor}>Por {heroItem.author}</Text>}
                            {heroItem.date && (
                                <Text style={styles.cardMetaDate}>
                                    {heroItem.author ? ' • ' : ''}{heroItem.date}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* List Items */}
                {listItems.length > 0 && (
                    <View style={styles.compactList}>
                        {listItems.map((item, index) => (
                            <View key={index} style={[styles.card, { borderColor: 'rgba(255,255,255,0.05)' }]}>
                                {item.image && (
                                    <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                                )}
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                                    <Text style={[styles.cardDate, { color: getAccentColor() }]}>{item.date}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.hiddenTemplate} pointerEvents="none">
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }}>
                <View style={[
                    styles.shareTemplate,
                    aspectRatio === '16:9' ? styles.shareTemplateVertical : styles.shareTemplateSquare,
                ]}>
                    {/* Background Image with heavy blur/overlay */}
                    <ImageBackground
                        source={image ? { uri: image } : require('../../assets/images/logotipo.png')}
                        style={styles.backgroundImage}
                        blurRadius={40} // Heavy blur for abstract abstract background
                    >
                        {/* Multiple Gradients for depth */}
                        <LinearGradient
                            colors={['rgba(10,10,10,0.7)', '#0A0A0A']}
                            style={StyleSheet.absoluteFill}
                        />
                        <LinearGradient
                            colors={[getAccentColor() + '20', 'transparent']} // Subtle color tint from top
                            style={[StyleSheet.absoluteFill, { height: '40%' }]}
                        />
                    </ImageBackground>

                    <View style={styles.contentContainer}>
                        {/* Top Bar: Type + Brand */}
                        <View style={styles.topBar}>
                            <View style={[styles.pillBadge, { borderColor: getAccentColor() }]}>
                                <MaterialCommunityIcons name={getIcon()} size={14} color={getAccentColor()} />
                                <Text style={[styles.pillText, { color: getAccentColor() }]}>{getLabel()}</Text>
                            </View>
                            <Image source={require('../../assets/images/logotipo.png')} style={styles.topLogo} resizeMode="contain" />
                        </View>

                        {/* Main Title Section */}
                        <View style={styles.headerSection}>
                            <Text style={[
                                styles.mainTitle,
                                (type === 'ARTICLE' && title.length > 50) && { fontSize: 36, lineHeight: 42 }
                            ]} numberOfLines={3}>
                                {title}
                            </Text>

                            {description && !items && (
                                <Text style={styles.description} numberOfLines={3}>{description}</Text>
                            )}

                            {/* Author Row for Article Type */}
                            {type === 'ARTICLE' && author && (
                                <View style={styles.authorRow}>
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarLetter}>{author[0]}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.authorName}>{author}</Text>
                                        <Text style={styles.authorLabel}>Autor en VTrading</Text>
                                    </View>
                                </View>
                            )}

                            {/* Stats Row for Category/Tag */}
                            {count !== undefined && (type === 'CATEGORY' || type === 'TAG') && (
                                <View style={styles.statsRow}>
                                    <Text style={[styles.statValue, { color: getAccentColor() }]}>{count}</Text>
                                    <Text style={styles.statLabel}>Artículos{"\n"}Disponibles</Text>
                                </View>
                            )}
                        </View>

                        {/* Middle Content: Hero + List */}
                        <View style={styles.middleSection}>
                            {renderHeroWithList()}
                        </View>

                        {/* Footer Section */}
                        <View style={styles.footer}>
                            <View style={styles.footerLeft}>
                                <View style={styles.storeRow}>
                                    <View style={styles.storeIcon}><Icon source="apple" size={14} color="#FFF" /></View>
                                    <View style={styles.storeIcon}><Icon source="google-play" size={14} color="#FFF" /></View>
                                    <Text style={styles.downloadText}>Descarga gratis en stores</Text>
                                </View>
                            </View>
                            <View style={styles.footerRight}>
                                <Text style={styles.websiteText}>vtrading.app</Text>
                            </View>
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
        left: -3000,
        top: 0,
        zIndex: -1,
    },
    shareTemplate: {
        backgroundColor: '#050505',
    },
    shareTemplateSquare: {
        width: 1080,
        height: 1080,
    },
    shareTemplateVertical: {
        width: 1080,
        height: 1920,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
    },
    contentContainer: {
        flex: 1,
        padding: 60, // Generous padding for 1080p
        justifyContent: 'space-between',
    },

    // Top Bar
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    pillBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 50,
        borderWidth: 2,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    pillText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    topLogo: {
        width: 180,
        height: 50,
        tintColor: 'white',
        opacity: 0.9,
    },

    // Header
    headerSection: {
        marginBottom: 40,
    },
    mainTitle: {
        fontSize: 72,
        lineHeight: 78,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 24,
        letterSpacing: -1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    description: {
        fontSize: 28,
        lineHeight: 38,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '400',
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 20,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarLetter: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: 'bold',
    },
    authorName: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    authorLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    statValue: {
        fontSize: 56,
        fontWeight: '900',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        lineHeight: 20,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },

    // Middle Content
    middleSection: {
        flex: 1,
        justifyContent: 'flex-end', // Push content down in available space
        marginBottom: 40,
    },
    listContainer: {
        width: '100%',
        gap: 24,
    },
    heroCard: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#1A1A1A',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        elevation: 10,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 32,
    },
    heroBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    heroBadgeText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    heroTitle: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 40,
        marginBottom: 16,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardMetaAuthor: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 18,
        fontWeight: '600',
    },
    cardMetaDate: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 18,
    },

    // Compact List
    compactList: {
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        overflow: 'hidden',
        height: 100, // Fixed height for consistency
        alignItems: 'center',
        borderWidth: 1,
    },
    cardImage: {
        width: 100,
        height: 100,
    },
    cardContent: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    cardTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        lineHeight: 26,
        marginBottom: 6,
    },
    cardDate: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 40,
        borderTopWidth: 2,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    storeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    storeIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    downloadText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    footerRight: {

    },
    websiteText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 1,
    },

});

export default ShareableDetail;
