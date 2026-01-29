import React from 'react';
import { View, StyleSheet, Image, ImageBackground } from 'react-native';
import { Text, Surface, useTheme, Icon } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ViewShot from 'react-native-view-shot';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ShareableDetailProps {
    viewShotRef: React.RefObject<any>;
    title: string;
    type: 'CATEGORY' | 'TAG';
    count: number;
    image?: string | null;
    description?: string;
    aspectRatio?: '1:1' | '16:9';
}

const ShareableDetail: React.FC<ShareableDetailProps> = ({
    viewShotRef,
    title,
    type,
    count,
    image,
    description,
    aspectRatio = '1:1',
}) => {
    const theme = useTheme();

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
                        blurRadius={10}
                    >
                        <LinearGradient
                            colors={['rgba(0,0,0,0.5)', '#0A0A0A']}
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
                                    name={type === 'CATEGORY' ? 'view-grid-outline' : 'tag-outline'}
                                    size={16}
                                    color={type === 'CATEGORY' ? '#6DDBAC' : '#B3CCBE'}
                                />
                                <Text style={styles.typeText}>{type === 'CATEGORY' ? 'CATEGORÍA' : 'ETIQUETA'}</Text>
                            </View>

                            <Text style={styles.title} numberOfLines={3}>{title}</Text>

                            {description && (
                                <Text style={styles.description} numberOfLines={3}>
                                    {description}
                                </Text>
                            )}

                            <View style={styles.metaBox}>
                                <Text style={styles.countValue}>{count}</Text>
                                <Text style={styles.countLabel}>{type === 'CATEGORY' ? 'Artículos Disponibles' : 'Artículos Relacionados'}</Text>
                            </View>
                        </View>


                        {/* Footer */}
                        <View style={styles.footer}>
                            <Image
                                source={require('../../assets/images/logotipo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <Text style={styles.footerUrl}>vtrading.app</Text>
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
    },
    countValue: {
        fontSize: 32,
        color: '#6DDBAC', // Primary brand color
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
});

export default ShareableDetail;
