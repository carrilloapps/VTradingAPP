import React from 'react';
import { View, StyleSheet, Image, ImageBackground } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ViewShot from 'react-native-view-shot';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/theme';
import XIcon from '../common/XIcon';

export interface ShareableItem {
    title: string;
    image?: string;
    date?: string;
    author?: string;
}

// Expanded Author Interface based on FormattedPost
interface ShareableAuthor {
    name: string;
    avatar?: string;
    role?: string; // e.g. "Editorial", "Colaborador"
    socials?: boolean; // Indicator to show social icons
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

    author?: ShareableAuthor; // Full Author Object
    categoryName?: string; // New prop for Category Name
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
    categoryName,
    metaLabel,
    metaValue,
}) => {
    const theme = useAppTheme();
    const isDark = theme.dark;

    const getIcon = () => {
        switch (type) {
            case 'CATEGORY': return 'view-grid-outline';
            case 'TAG': return 'pound';
            case 'ARTICLE': return 'text-box-outline';
            default: return 'star-outline';
        }
    };

    const getAccentColor = () => {
        switch (type) {
            case 'CATEGORY': return theme.colors.primary;
            case 'TAG': return theme.colors.tertiary;
            case 'ARTICLE': return theme.colors.secondary;
            default: return theme.colors.primary;
        }
    };

    const getLabel = () => {
        if (metaLabel) return metaLabel.toUpperCase();
        switch (type) {
            case 'CATEGORY': return 'COLECCIÓN';
            case 'TAG': return 'TENDENCIA';
            case 'ARTICLE': return 'ARTÍCULO';
            default: return 'DESTACADO';
        }
    };

    const cleanText = (text: string) => {
        if (!text) return '';
        return text
            // Remove HTML tags
            .replace(/<[^>]+>/g, '')
            // Remove multiple spaces/newlines
            .replace(/\s+/g, ' ')
            // Decode common entities (basic set)
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&#8217;/g, "'")
            .replace(/&#8211;/g, "-")
            .replace(/&#8212;/g, "--")
            .replace(/&#8230;/g, "...")
            .trim();
    };

    // Determine dimensions based on aspect ratio
    const width = 1080;
    const height = aspectRatio === '16:9' ? 1920 : 1080;

    // Styles that depend on theme and dimensions
    const containerStyle = {
        width,
        height,
        backgroundColor: '#121212', // Deep dark background
    };

    // Helper to render author block
    const renderAuthorBlock = () => {
        if (!author) return null;
        
        return (
            <View style={styles.authorRow}>
                {author.avatar ? (
                     <Image source={{ uri: author.avatar }} style={styles.avatarImage} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { 
                        backgroundColor: theme.colors.primaryContainer,
                        borderColor: theme.colors.primary 
                    }]}>
                        <Text style={[styles.avatarLetter, { color: theme.colors.onPrimaryContainer }]}>{author.name[0]}</Text>
                    </View>
                )}
                <View>
                    <Text style={[styles.authorName, { color: '#FFF' }]}>{author.name}</Text>
                    <View style={styles.authorMetaRow}>
                        {author.role && <Text style={[styles.authorLabel, { color: 'rgba(255,255,255,0.6)' }]}>{author.role}</Text>}
                        {author.socials && (
                            <View style={styles.socialIcons}>
                                <XIcon size={20} color="rgba(255,255,255,0.6)" />
                                <MaterialCommunityIcons name="instagram" size={22} color="rgba(255,255,255,0.6)" />
                                <MaterialCommunityIcons name="linkedin" size={22} color="rgba(255,255,255,0.6)" />
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    // Modern Article Layout
    if (type === 'ARTICLE') {
        return (
            <View style={styles.hiddenTemplate} pointerEvents="none">
                <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }}>
                    <View style={containerStyle}>
                        {/* Top Image Section (45%) */}
                        <View style={{ height: '45%', width: '100%', overflow: 'hidden' }}>
                            {image ? (
                                <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                            ) : (
                                <View style={{ flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
                                    <MaterialCommunityIcons name="image-off-outline" size={100} color="#333" />
                                </View>
                            )}
                            {/* Gradient Fade to Bottom */}
                            <LinearGradient
                                colors={['transparent', 'rgba(18,18,18,0.2)', '#121212']}
                                style={[StyleSheet.absoluteFill, { top: '50%' }]} 
                            />
                            
                            {/* Top Bar Overlay */}
                            <View style={[styles.topBar, { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 64, marginTop: 40 }]}>
                                <View style={[styles.pillBadge, { 
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    backgroundColor: 'rgba(0,0,0,0.6)'
                                }]}>
                                    <MaterialCommunityIcons name={getIcon()} size={24} color="#FFF" />
                                    <Text style={[styles.pillText, { color: '#FFF' }]}>{getLabel()}</Text>
                                </View>
                                
                                <View style={styles.brandContainer}>
                                    <Image 
                                        source={require('../../assets/images/logotipo.png')} 
                                        style={styles.brandLogo} 
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Content Section (55%) */}
                        <View style={{ flex: 1, paddingHorizontal: 64, paddingBottom: 64, justifyContent: 'space-between' }}>
                            <View>
                                {/* Category Badge */}
                                <View style={[styles.categoryBadge, { backgroundColor: getAccentColor() }]}>
                                    <Text style={[styles.categoryBadgeText, { color: '#000' }]}>
                                        {categoryName ? categoryName.toUpperCase() : 'ARTÍCULO'}
                                    </Text>
                                </View>

                                {/* Title */}
                                <Text style={styles.modernTitle} numberOfLines={4}>
                                    {title}
                                </Text>

                                {/* Author */}
                                {renderAuthorBlock()}

                                {/* Description */}
                                {description && aspectRatio === '16:9' && (
                                    <Text style={styles.modernDescription} numberOfLines={10}>
                                        {cleanText(description)}
                                    </Text>
                                )}
                            </View>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <View style={styles.footerLeft}>
                                    <View style={styles.storeIcons}>
                                        <View style={styles.storeIconCircle}>
                                            <MaterialCommunityIcons name="apple" size={32} color="#000" />
                                        </View>
                                        <View style={styles.storeIconCircle}>
                                            <MaterialCommunityIcons name="google-play" size={28} color="#000" />
                                        </View>
                                    </View>
                                    <Text style={[styles.downloadText, { color: '#FFF' }]}>Descarga Gratis</Text>
                                </View>
                                
                                <View style={[styles.urlBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                    <MaterialCommunityIcons name="web" size={24} color="#FFF" style={{ marginRight: 10 }} />
                                    <Text style={[styles.urlText, { color: '#FFF' }]}>vtrading.app</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </ViewShot>
            </View>
        );
    }

    const renderHeroWithList = () => {
        // If items are provided, use them. Otherwise, if it's an article, treat the article itself as the "Hero"
        
        // For Lists (Category/Tag)
        if (!items || items.length === 0) return null;

        const heroItem = items[0];
        const listItems = items.slice(1, aspectRatio === '16:9' ? 3 : 1);

        return (
            <View style={styles.listContainer}>
                {/* Hero Card */}
                <Surface style={[styles.heroCard, { 
                    backgroundColor: '#1A1A1A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 40,
                }]} elevation={5}>
                    {heroItem.image ? (
                        <Image source={{ uri: heroItem.image }} style={styles.heroImage} resizeMode="cover" />
                    ) : (
                        <View style={[styles.heroImage, { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }]}>
                            <MaterialCommunityIcons name="image-off-outline" size={60} color="#666" />
                        </View>
                    )}

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.heroContent}>
                        <View style={[styles.heroBadge, { backgroundColor: getAccentColor() }]}>
                            <Text style={[styles.heroBadgeText, { color: '#000' }]}>DESTACADO</Text>
                        </View>
                        <Text style={styles.heroTitle} numberOfLines={2}>{heroItem.title}</Text>
                        <View style={styles.cardMeta}>
                            {heroItem.author && <Text style={styles.cardMetaText}>Por {heroItem.author}</Text>}
                        </View>
                    </View>
                </Surface>

                {/* List Items */}
                {listItems.length > 0 && (
                    <View style={styles.compactList}>
                        {listItems.map((item, index) => (
                            <View key={index} style={[styles.card, { 
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderColor: 'rgba(255,255,255,0.1)' 
                            }]}>
                                {item.image && (
                                    <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                                )}
                                <View style={styles.cardContent}>
                                    <Text style={[styles.cardTitle, { color: '#FFF' }]} numberOfLines={2}>{item.title}</Text>
                                    <Text style={[styles.cardDate, { color: getAccentColor() }]}>{item.date || 'Reciente'}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    // Old Layout for Category/Tag
    return (
        <View style={styles.hiddenTemplate} pointerEvents="none">
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }}>
                <View style={containerStyle}>
                    {/* Background Layer - Abstract Dark */}
                     <LinearGradient
                        colors={['#1a1a1a', '#050505']}
                        style={StyleSheet.absoluteFill}
                    />
                    
                    {/* Background Image Blended */}
                    <ImageBackground
                        source={image ? { uri: image } : require('../../assets/images/logotipo.png')}
                        style={[styles.backgroundImage, { opacity: 0.4 }]}
                        blurRadius={60}
                    />
                    
                    {/* Gradient Overlay for Consistency */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', '#000000']}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.contentContainer}>
                        {/* Top Bar */}
                        <View style={styles.topBar}>
                            <View style={[styles.pillBadge, { 
                                borderColor: 'rgba(255,255,255,0.3)',
                                backgroundColor: 'rgba(0,0,0,0.5)'
                            }]}>
                                <MaterialCommunityIcons name={getIcon()} size={24} color="#FFF" />
                                <Text style={[styles.pillText, { color: '#FFF' }]}>{getLabel()}</Text>
                            </View>
                            
                            {/* Brand Logo - Using Asset */}
                             <View style={styles.brandContainer}>
                                <Image 
                                    source={require('../../assets/images/logotipo.png')} 
                                    style={styles.brandLogo} 
                                    resizeMode="contain"
                                />
                            </View>
                        </View>

                        {/* Main Content Area */}
                        <View style={styles.mainWrapper}>
                            {/* Header Section */}
                            <View style={styles.headerSection}>
                                <Text style={[
                                    styles.mainTitle,
                                    { color: '#FFF' },
                                    (title.length > 40) && { fontSize: 64, lineHeight: 72 },
                                    (title.length > 80) && { fontSize: 56, lineHeight: 64 }
                                ]}>
                                    {title}
                                </Text>

                                {/* Author Block (Outside Card) - Should not be needed for Category/Tag usually but kept for safety */}
                                {(type as string) === 'ARTICLE' && author && renderAuthorBlock()}

                                {description && !items && aspectRatio === '16:9' && (
                                    <Text style={[styles.description, { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={4}>
                                        {cleanText(description)}
                                    </Text>
                                )}
                            </View>

                            {/* Middle Content (Card) */}
                            <View style={styles.middleSection}>
                                {renderHeroWithList()}
                            </View>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <View style={styles.footerLeft}>
                                <View style={styles.storeIcons}>
                                     {/* Larger Store Icons */}
                                    <View style={styles.storeIconCircle}>
                                        <MaterialCommunityIcons name="apple" size={32} color="#000" />
                                    </View>
                                    <View style={styles.storeIconCircle}>
                                        <MaterialCommunityIcons name="google-play" size={28} color="#000" />
                                    </View>
                                </View>
                                <Text style={[styles.downloadText, { color: '#FFF' }]}>Descarga Gratis</Text>
                            </View>
                            
                            <View style={[styles.urlBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                                <MaterialCommunityIcons name="web" size={24} color="#FFF" style={{ marginRight: 10 }} />
                                <Text style={[styles.urlText, { color: '#FFF' }]}>vtrading.app</Text>
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
        left: -4000,
        top: 0,
        zIndex: -1,
        opacity: 0, 
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
    },
    contentContainer: {
        flex: 1,
        padding: 64,
        justifyContent: 'space-between',
    },

    // Modern Styles
    categoryBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    categoryBadgeText: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    modernTitle: {
        fontSize: 56, // Adjusted for new layout
        lineHeight: 64,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 24,
        letterSpacing: -1,
    },
    modernDescription: {
        fontSize: 30,
        lineHeight: 42,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.85)',
        marginTop: 32,
        textAlign: 'justify',
    },

    // Top Bar
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        height: 100,
    },
    pillBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 100,
        borderWidth: 2,
    },
    pillText: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    brandContainer: {
        height: 80,
        justifyContent: 'center',
    },
    brandLogo: {
        width: 300,
        height: 80,
        tintColor: '#FFF', // Make logo white for dark theme consistency
    },

    // Main Layout
    mainWrapper: {
        flex: 1,
        justifyContent: 'center',
        gap: 60,
    },
    headerSection: {
        marginBottom: 20,
    },
    mainTitle: {
        fontSize: 80,
        lineHeight: 88,
        fontWeight: '900',
        marginBottom: 32,
        letterSpacing: -1.5,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    description: {
        fontSize: 32, // Smaller than before
        lineHeight: 46, // Increased line height for better readability
        fontWeight: '400',
        marginTop: 20, // Add separation from author block
        textAlign: 'justify', // Justify text as requested
        letterSpacing: 0.5, // Slight spacing for clarity
    },
    
    // Author Row
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 24,
    },
    authorMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginTop: 8,
    },
    socialIcons: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        opacity: 0.8,
    },
    avatarImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
    },
    avatarLetter: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    authorName: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    authorLabel: {
        fontSize: 24,
        fontWeight: '500',
        marginTop: 4,
    },

    // Middle Content
    middleSection: {
        marginBottom: 20,
    },
    listContainer: {
        width: '100%',
        gap: 32,
    },
    heroCard: {
        width: '100%',
        aspectRatio: 16 / 9,
        overflow: 'hidden',
        borderWidth: 0, // Flat design as requested
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
        padding: 48,
    },
    heroBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 16,
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    heroBadgeText: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    heroTitle: {
        color: '#FFF',
        fontSize: 44,
        fontWeight: 'bold',
        lineHeight: 52,
        marginBottom: 16,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    cardMeta: {
        flexDirection: 'row',
    },
    cardMetaText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 24,
        fontWeight: '500',
    },

    // Compact List
    compactList: {
        gap: 24,
    },
    card: {
        flexDirection: 'row',
        borderRadius: 24,
        overflow: 'hidden',
        height: 160,
        alignItems: 'center',
        borderWidth: 1,
    },
    cardImage: {
        width: 160,
        height: 160,
    },
    cardContent: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 40,
        marginBottom: 8,
    },
    cardDate: {
        fontSize: 20,
        fontWeight: '600',
        textTransform: 'uppercase',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 0, // Removed border/padding for cleaner look
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
    },
    storeIcons: {
        flexDirection: 'row',
        gap: 16, // Added explicit gap for separation
    },
    storeIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    downloadText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    urlBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 100,
    },
    urlText: {
        fontSize: 26,
        fontWeight: 'bold',
    },
});

export default ShareableDetail;
