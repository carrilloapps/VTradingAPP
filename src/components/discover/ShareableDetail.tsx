import React from 'react';
import { View, StyleSheet, Image, ImageBackground, DimensionValue } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ViewShot from 'react-native-view-shot';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '../../theme/theme';
import XIcon from '../common/XIcon';
import FacebookIcon from '../common/FacebookIcon';

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Configuration constants for easy fine-tuning
const BACKGROUND_BLUR = 15;
const BACKGROUND_OPACITY = 0.6;

export interface ShareableItem {
    title: string;
    image?: string;
    date?: string;
    author?: string;
    authorAvatar?: string;
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
    image,
    description,
    items,
    aspectRatio = '1:1',
    author,
    categoryName,
    metaLabel,
}) => {
    const theme = useAppTheme();

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
            case 'CATEGORY': return 'CATEGORÍA';
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
    const isVertical = aspectRatio === '16:9';

    // Dynamic sizing based on aspect ratio (Synchronized with ShareGraphic)
    const logoWidth = isVertical ? 450 : 350;
    const logoHeight = isVertical ? 120 : 90;
    const pillIconSize = isVertical ? 38 : 32;
    const pillFontSize = isVertical ? 32 : 26;
    const mainTitleSize = isVertical ? 100 : 70; // FIXED: Prominent title size
    const mainTitleLineHeight = isVertical ? 110 : 80;
    const categoryBadgeFontSize = isVertical ? 32 : 26;
    const footerTextSize = 32;
    const urlTextSize = 36;

    // Styles that depend on theme and dimensions
    const containerStyle = [
        styles.container,
        {
            width,
            height,
            backgroundColor: theme.colors.background, // Deep dark background
        }
    ];

    const authorBlockStyle = (avatarSize: number) => [
        styles.avatarImage,
        { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }
    ];

    const avatarPlaceholderStyle = (avatarSize: number) => [
        styles.avatarPlaceholder,
        {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: theme.colors.primaryContainer,
            borderColor: theme.colors.primary
        }
    ];

    const avatarLetterStyle = (isVert: boolean) => [
        styles.avatarLetter,
        { fontSize: isVert ? 60 : 40, color: theme.colors.onPrimaryContainer }
    ];

    const authorNameStyle = (nameSize: number) => [
        styles.authorName,
        { fontSize: nameSize, color: theme.colors.onBackground }
    ];

    const authorMetaRowStyle = (isVert: boolean) => [
        styles.authorMetaRow,
        { marginTop: isVert ? 0 : 8 }
    ];

    const authorLabelStyle = (roleSize: number) => [
        styles.authorLabel,
        { fontSize: roleSize, color: hexToRgba(theme.colors.onBackground, 0.6) }
    ];

    const socialIconsStyle = (socialGap: number) => [
        styles.socialIcons,
        { gap: socialGap }
    ];

    // Helper to render author block
    const renderAuthorBlock = () => {
        if (!author) return null;

        const socials = (typeof author.socials === 'object' && author.socials !== null) ? author.socials : {} as any;
        const showSocials = !!author.socials;

        // Dynamic Sizes for Vertical Mode
        const avatarSize = isVertical ? 140 : 110;
        const nameSize = isVertical ? 48 : 40;
        const roleSize = isVertical ? 34 : 30;
        const socialIconSize = isVertical ? 54 : 30;
        const socialGap = isVertical ? 24 : 16;

        const iconColor = hexToRgba(theme.colors.onBackground, 0.6);

        return (
            <View style={styles.authorRow}>
                {author.avatar ? (
                    <Image source={{ uri: author.avatar }} style={authorBlockStyle(avatarSize)} />
                ) : (
                    <View style={avatarPlaceholderStyle(avatarSize)}>
                        <Text style={avatarLetterStyle(isVertical)}>{author.name[0]}</Text>
                    </View>
                )}
                <View style={styles.authorInfo}>
                    <Text style={authorNameStyle(nameSize)}>{author.name}</Text>
                    <View style={authorMetaRowStyle(isVertical)}>
                        {author.role && <Text style={authorLabelStyle(roleSize)}>{author.role}</Text>}
                        {showSocials && (
                            <View style={socialIconsStyle(socialGap)}>
                                {socials.twitter && <XIcon size={socialIconSize} color={iconColor} />}
                                {socials.facebook && <FacebookIcon size={socialIconSize} color={iconColor} />}
                                {socials.instagram && <MaterialCommunityIcons name="instagram" size={socialIconSize} color={iconColor} />}
                                {socials.linkedin && <MaterialCommunityIcons name="linkedin" size={socialIconSize} color={iconColor} />}
                                {socials.youtube && <MaterialCommunityIcons name="youtube" size={socialIconSize} color={iconColor} />}
                                {socials.tiktok && <MaterialCommunityIcons name="music-note-eighth" size={socialIconSize} color={iconColor} />}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    // Removal of unused _isDark from line 64
    // Modern Article Layout
    if (type === 'ARTICLE') {

        const topImageWrapperStyle = [styles.topImageWrapper, { height: (isVertical ? '40%' : '50%') as DimensionValue }];
        const placeholderWrapperStyle = [styles.placeholderWrapper, { backgroundColor: theme.colors.elevation.level1 }];
        const topGradientOverlayStyle = [styles.topGradientOverlay, { height: isVertical ? 240 : 160 }];
        const topBarOverlayStyle = [styles.topBarOverlay, { marginTop: isVertical ? 60 : 40, paddingHorizontal: 64 }];
        const pillBadgeStyle = [styles.pillBadge, {
            borderColor: hexToRgba(theme.colors.onBackground, 0.2),
            backgroundColor: hexToRgba(theme.colors.background, 0.6),
            paddingHorizontal: isVertical ? 40 : 32,
            paddingVertical: isVertical ? 20 : 16,
        }];
        const pillTextStyle = [styles.pillText, { color: theme.colors.onBackground, fontSize: pillFontSize }];
        const brandLogoStyle = [styles.brandLogo, { tintColor: theme.colors.onBackground, width: logoWidth, height: logoHeight }];
        const categoryBadgeStyle = [styles.categoryBadge, { backgroundColor: theme.colors.primaryContainer, paddingHorizontal: isVertical ? 40 : 32, paddingVertical: isVertical ? 20 : 16 }];
        const categoryBadgeTextStyle = [styles.categoryBadgeText, { color: theme.colors.onPrimaryContainer, fontSize: categoryBadgeFontSize }];
        const modernTitleStyle = [
            styles.modernTitle,
            { color: theme.colors.onBackground, fontSize: isVertical ? 90 : 65, lineHeight: isVertical ? 100 : 75 },
            (title.length > 40) && { fontSize: isVertical ? 75 : 55, lineHeight: (isVertical ? 85 : 65) as number },
            (title.length > 80) && { fontSize: isVertical ? 65 : 45, lineHeight: (isVertical ? 75 : 55) as number }
        ];
        const descriptionStyle = [styles.modernDescription, { color: hexToRgba(theme.colors.onBackground, 0.85), fontSize: isVertical ? 38 : 28, lineHeight: isVertical ? 54 : 40 }];
        const storeIconsStyle = (gap: number) => [styles.storeIcons, { gap }];
        const storeIconCircleStyle = (size: number) => [styles.storeIconCircle, { backgroundColor: theme.colors.onBackground, width: size, height: size, borderRadius: size / 2 }];
        const downloadTextStyle = [styles.downloadText, { color: theme.colors.onBackground, fontSize: footerTextSize }];
        const urlBadgeStyle = [styles.urlBadge, { backgroundColor: hexToRgba(theme.colors.onBackground, 0.1), paddingHorizontal: isVertical ? 40 : 32, paddingVertical: isVertical ? 20 : 16 }];
        const urlTextStyle = [styles.urlText, { color: theme.colors.onBackground, fontSize: urlTextSize }];

        const storeIconSize = isVertical ? 90 : 80;
        const storeGap = isVertical ? 24 : 16;

        return (
            <View style={styles.hiddenTemplate} pointerEvents="none">
                <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }}>
                    <View style={containerStyle}>
                        {/* Top Image Section (45% for Vertical, 55% for Square) */}
                        <View style={topImageWrapperStyle}>
                            {image ? (
                                <Image source={{ uri: image }} style={styles.fullImage} resizeMode="cover" />
                            ) : (
                                <View style={placeholderWrapperStyle}>
                                    <MaterialCommunityIcons name="image-off-outline" size={isVertical ? 150 : 100} color={theme.colors.onSurfaceVariant} />
                                </View>
                            )}

                            {/* Top Gradient Overlay for Logo Visibility */}
                            <LinearGradient
                                colors={[hexToRgba(theme.colors.background, 0.8), 'transparent']}
                                style={topGradientOverlayStyle}
                            />

                            {/* Gradient Fade to Bottom */}
                            <LinearGradient
                                colors={['transparent', hexToRgba(theme.colors.background, 0.2), theme.colors.background]}
                                style={styles.bottomGradientFade}
                            />

                            {/* Top Bar Overlay */}
                            <View style={topBarOverlayStyle}>
                                <View style={pillBadgeStyle}>
                                    <MaterialCommunityIcons name={getIcon()} size={pillIconSize} color={theme.colors.onBackground} />
                                    <Text style={pillTextStyle}>{getLabel()}</Text>
                                </View>

                                <View style={styles.brandContainer}>
                                    <Image
                                        source={require('../../assets/images/logotipo.png')}
                                        style={brandLogoStyle}
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Content Section (55%) */}
                        <View style={styles.articleContentWrapper}>
                            <View>
                                {/* Category Badge */}
                                <View style={categoryBadgeStyle}>
                                    <Text style={categoryBadgeTextStyle}>
                                        {categoryName ? categoryName.toUpperCase() : 'ARTÍCULO'}
                                    </Text>
                                </View>


                                {/* Title */}
                                <Text style={modernTitleStyle} numberOfLines={4}>
                                    {title}
                                </Text>

                                {/* Author */}
                                {renderAuthorBlock()}

                                {/* Description */}
                                {description && aspectRatio === '16:9' && (
                                    <Text style={descriptionStyle} numberOfLines={7}>
                                        {cleanText(description)}
                                    </Text>
                                )}
                            </View>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <View style={styles.footerLeft}>
                                    <View style={storeIconsStyle(storeGap)}>
                                        <View style={storeIconCircleStyle(storeIconSize)}>
                                            <MaterialCommunityIcons name="apple" size={48} color={theme.colors.background} />
                                        </View>
                                        <View style={storeIconCircleStyle(storeIconSize)}>
                                            <MaterialCommunityIcons name="google-play" size={isVertical ? 40 : 28} color={theme.colors.background} />
                                        </View>
                                    </View>
                                    <Text style={downloadTextStyle}>Descarga gratis</Text>
                                </View>

                                <View style={urlBadgeStyle}>
                                    <MaterialCommunityIcons name="web" size={isVertical ? 36 : 24} color={theme.colors.onBackground} style={styles.urlIcon} />
                                    <Text style={urlTextStyle}>vtrading.app</Text>
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
        const listItems = items.slice(1, aspectRatio === '16:9' ? 4 : 0);

        const heroCardStyle = [styles.heroCard, {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outline,
        }];
        const heroImagePlaceholderStyle = [styles.heroImage, { backgroundColor: theme.colors.surfaceVariant }];
        const heroBadgeStyle = [styles.heroBadge, { backgroundColor: getAccentColor() }];
        const heroBadgeTextStyle = [styles.heroBadgeText, { color: theme.colors.onPrimary, fontSize: isVertical ? 24 : 20 }];
        const heroTitleTextStyle = [styles.heroTitle, { fontSize: isVertical ? 56 : 44, lineHeight: isVertical ? 64 : 52 }];
        const cardMetaTextStyle = [styles.cardMetaText, { fontSize: isVertical ? 30 : 24 }];

        const compactCardStyle = (cardHeight: number) => [styles.card, {
            backgroundColor: hexToRgba(theme.colors.onBackground, 0.05),
            borderColor: hexToRgba(theme.colors.onBackground, 0.1),
            height: cardHeight,
        }];
        const compactCardImageStyle = (size: number) => [styles.cardImage, { width: size, height: size }];
        const compactCardTitleStyle = [styles.cardTitle, { color: theme.colors.onBackground, fontSize: isVertical ? 38 : 32, lineHeight: isVertical ? 46 : 40 }];
        const listItemAvatarStyle = (size: number) => [styles.listItemAvatar, { width: size, height: size, borderRadius: size / 2 }];
        const listItemAvatarPlaceholderStyle = (size: number) => [styles.listItemAvatarPlaceholder, { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.colors.primaryContainer }];
        const listItemAvatarLetterStyle = (fontSize: number) => [styles.listItemAvatarLetter, { fontSize, color: theme.colors.onPrimaryContainer }];
        const listItemAuthorStyle = [styles.listItemAuthor, { color: hexToRgba(theme.colors.onBackground, 0.9), fontSize: isVertical ? 24 : 20 }];
        const cardDateTextStyle = [styles.cardDate, { color: hexToRgba(theme.colors.onBackground, 0.7), fontSize: isVertical ? 22 : 18 }];

        const compactItemHeight = isVertical ? 180 : 160;
        const compactItemImageSize = isVertical ? 180 : 160;
        const avatarSize = isVertical ? 48 : 40;
        const avatarFontSize = isVertical ? 24 : 20;

        return (
            <View style={styles.listContainer}>
                {/* Hero Card */}
                <Surface style={heroCardStyle} elevation={5}>
                    {heroItem.image ? (
                        <Image source={{ uri: heroItem.image }} style={styles.heroImage} resizeMode="cover" />
                    ) : (
                        <View style={heroImagePlaceholderStyle}>
                            <MaterialCommunityIcons name="image-off-outline" size={isVertical ? 80 : 60} color={theme.colors.onSurfaceVariant} />
                        </View>
                    )}

                    <LinearGradient
                        colors={['transparent', hexToRgba(theme.colors.scrim, 0.9)]}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.heroContent}>
                        <View style={heroBadgeStyle}>
                            <Text style={heroBadgeTextStyle}>DESTACADO</Text>
                        </View>
                        <Text style={heroTitleTextStyle} numberOfLines={2}>{heroItem.title}</Text>
                        <View style={styles.cardMeta}>
                            {heroItem.author && <Text style={cardMetaTextStyle}>Por {heroItem.author}</Text>}
                        </View>
                    </View>
                </Surface>

                {/* List Items */}
                {listItems.length > 0 && (
                    <View style={styles.compactList}>
                        {listItems.map((item, index) => (
                            <View key={index} style={compactCardStyle(compactItemHeight)}>
                                {item.image && (
                                    <Image source={{ uri: item.image }} style={compactCardImageStyle(compactItemImageSize)} resizeMode="cover" />
                                )}
                                <View style={styles.cardContent}>
                                    <Text style={compactCardTitleStyle} numberOfLines={2}>{item.title}</Text>
                                    <View style={styles.listItemMeta}>
                                        {/* Author Avatar */}
                                        {item.authorAvatar ? (
                                            <Image source={{ uri: item.authorAvatar }} style={listItemAvatarStyle(avatarSize)} />
                                        ) : (
                                            <View style={listItemAvatarPlaceholderStyle(avatarSize)}>
                                                <Text style={listItemAvatarLetterStyle(avatarFontSize)}>{(item.author || 'V')[0]}</Text>
                                            </View>
                                        )}

                                        {/* Author Name */}
                                        <Text style={listItemAuthorStyle}>
                                            {item.author}
                                        </Text>

                                        {/* Separator */}
                                        <MaterialCommunityIcons name="circle-small" size={isVertical ? 32 : 24} color={hexToRgba(theme.colors.onBackground, 0.5)} />

                                        {/* Date */}
                                        <Text style={cardDateTextStyle}>
                                            {item.date || 'Reciente'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    // Old Layout for Category/Tag

    const backgroundGradientColors = [theme.colors.background, theme.colors.background];
    const topPillBadgeStyle = [styles.pillBadge, {
        borderColor: hexToRgba(theme.colors.onBackground, 0.3),
        backgroundColor: hexToRgba(theme.colors.background, 0.5),
        paddingHorizontal: isVertical ? 40 : 32,
        paddingVertical: isVertical ? 20 : 16,
    }];
    const topPillTextStyle = [styles.pillText, { color: theme.colors.onBackground, fontSize: pillFontSize }];
    const topBrandLogoStyle = [styles.brandLogo, { tintColor: theme.colors.onBackground, width: logoWidth, height: logoHeight }];
    const mainTitleStyleScaled = [
        styles.mainTitle,
        { color: theme.colors.onBackground, fontSize: mainTitleSize, lineHeight: mainTitleLineHeight },
        (title.length > 40) && { fontSize: isVertical ? 85 : 60, lineHeight: (isVertical ? 95 : 68) as number },
        (title.length > 80) && { fontSize: isVertical ? 75 : 50, lineHeight: (isVertical ? 85 : 58) as number }
    ];

    const oldDescriptionStyle = [styles.description, { color: hexToRgba(theme.colors.onBackground, 0.8), fontSize: isVertical ? 42 : 32, lineHeight: isVertical ? 60 : 44 }];
    const oldStoreIconsStyle = [styles.storeIcons, { gap: isVertical ? 24 : 16 }];
    const oldStoreIconCircleStyle = (size: number) => [styles.storeIconCircle, { backgroundColor: theme.colors.onBackground, width: size, height: size, borderRadius: size / 2 }];
    const oldDownloadTextStyle = [styles.downloadText, { color: theme.colors.onBackground, fontSize: footerTextSize }];
    const oldUrlBadgeStyle = [styles.urlBadge, { backgroundColor: hexToRgba(theme.colors.onBackground, 0.15), paddingHorizontal: isVertical ? 40 : 32, paddingVertical: isVertical ? 20 : 16 }];
    const oldUrlTextStyle = [styles.urlText, { color: theme.colors.onBackground, fontSize: urlTextSize }];

    const storeIconSize = isVertical ? 90 : 80;

    return (
        <View style={styles.hiddenTemplate} pointerEvents="none">
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }}>
                <View style={containerStyle}>
                    {/* Background Layer - Abstract Dark */}
                    <LinearGradient
                        colors={backgroundGradientColors}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* Background Image Blended */}
                    <ImageBackground
                        source={image ? { uri: image } : require('../../assets/images/logotipo.png')}
                        style={styles.backgroundImage}
                        blurRadius={BACKGROUND_BLUR}
                    />

                    {/* Gradient Overlay for Consistency - Richer depth */}
                    <LinearGradient
                        colors={[
                            'transparent',
                            hexToRgba(theme.colors.background, 0.5),
                            hexToRgba(theme.colors.background, 0.9),
                            theme.colors.background
                        ]}
                        locations={[0, 0.3, 0.6, 1.0]}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.contentContainer}>
                        {/* Top Bar */}
                        <View style={styles.topBar}>
                            <View style={topPillBadgeStyle}>
                                <MaterialCommunityIcons name={getIcon()} size={pillIconSize} color={theme.colors.onBackground} />
                                <Text style={topPillTextStyle}>{getLabel()}</Text>
                            </View>

                            {/* Brand Logo - Using Asset */}
                            <View style={styles.brandContainer}>
                                <Image
                                    source={require('../../assets/images/logotipo.png')}
                                    style={topBrandLogoStyle}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>

                        {/* Main Content Area */}
                        <View style={[styles.mainWrapper, isVertical && styles.mainWrapperVertical]}>
                            {/* Header Section */}
                            <View style={styles.headerSection}>
                                <Text style={mainTitleStyleScaled}>
                                    {title}
                                </Text>

                                {/* Author Block (Outside Card) - Should not be needed for Category/Tag usually but kept for safety */}
                                {(type as string) === 'ARTICLE' && author && renderAuthorBlock()}

                                {description && !items && aspectRatio === '16:9' && (
                                    <Text style={oldDescriptionStyle} numberOfLines={4}>
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
                                <View style={oldStoreIconsStyle}>
                                    {/* Larger Store Icons */}
                                    <View style={oldStoreIconCircleStyle(storeIconSize)}>
                                        <MaterialCommunityIcons name="apple" size={48} color={theme.colors.background} />
                                    </View>
                                    <View style={oldStoreIconCircleStyle(storeIconSize)}>
                                        <MaterialCommunityIcons name="google-play" size={48} color={theme.colors.background} />
                                    </View>
                                </View>
                                <Text style={oldDownloadTextStyle}>Descarga gratis</Text>
                            </View>

                            <View style={oldUrlBadgeStyle}>
                                <MaterialCommunityIcons name="web" size={isVertical ? 36 : 24} color={theme.colors.onBackground} style={styles.urlIcon} />
                                <Text style={oldUrlTextStyle}>vtrading.app</Text>
                            </View>
                        </View>

                    </View>
                </View>
            </ViewShot>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // Dynamic width/height/bgcolor
    },
    authorInfo: {
        flex: 1,
    },
    topImageWrapper: {
        width: '100%',
        overflow: 'hidden',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    placeholderWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topGradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    bottomGradientFade: {
        ...StyleSheet.absoluteFillObject,
        top: '50%',
    },
    topBarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    articleContentWrapper: {
        flex: 1,
        paddingHorizontal: 64,
        paddingBottom: 64,
        justifyContent: 'space-between',
    },
    listItemMeta: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    listItemAvatar: {
        // dynamic sizes
    },
    listItemAvatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    listItemAvatarLetter: {
        fontWeight: 'bold',
    },
    listItemAuthor: {
        fontWeight: '600',
    },
    urlIcon: {
        marginRight: 10,
    },
    hiddenTemplate: {
        position: 'absolute',
        left: -4000,
        top: 0,
        zIndex: -1,
        opacity: 0,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: BACKGROUND_OPACITY,
    },
    contentContainer: {
        flex: 1,
        padding: 64,
        justifyContent: 'space-between',
    },

    // Modern Styles
    categoryBadge: {
        borderRadius: 100,
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    categoryBadgeText: {
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    modernTitle: {
        fontWeight: '900',
        marginBottom: 24,
        letterSpacing: -1,
    },
    modernDescription: {
        fontWeight: '400',
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
        borderRadius: 100,
        borderWidth: 2,
    },
    pillText: {
        fontWeight: 'bold',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    brandContainer: {
        height: 80,
        justifyContent: 'center',
    },
    brandLogo: {
        // dynamic sizes
    },

    // Main Layout
    mainWrapper: {
        flex: 1,
        justifyContent: 'center',
        gap: 40,
    },
    mainWrapperVertical: {
        gap: 60,
    },
    headerSection: {
        marginBottom: 0,
    },
    mainTitle: {
        fontWeight: '900',
        marginBottom: 24,
        letterSpacing: -1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    description: {
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
    },
    socialIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarImage: {
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
    },
    avatarLetter: {
        fontWeight: 'bold',
    },
    authorName: {
        fontWeight: 'bold',
    },
    authorLabel: {
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
        borderRadius: 40,
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
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    heroTitle: {
        color: '#FFF',
        fontWeight: 'bold',
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
        alignItems: 'center',
        borderWidth: 1,
    },
    cardImage: {
        // dynamic sizes
    },
    cardContent: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'center',
    },
    cardTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardDate: {
        fontWeight: '600',
        textTransform: 'uppercase',
        flex: 1,
    },
    cardAuthor: {
        fontWeight: '500',
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
    },
    storeIconCircle: {
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    downloadText: {
        fontWeight: 'bold',
    },
    urlBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 100,
    },
    urlText: {
        fontWeight: 'bold',
    },
});

export default ShareableDetail;
