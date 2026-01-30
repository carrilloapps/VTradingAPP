import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Text, Surface, IconButton, Avatar } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';
import XIcon from '../common/XIcon';
import FacebookIcon from '../common/FacebookIcon';

interface AuthorCardProps {
    author: any;
}

const XIconRender = ({ size, color }: { size: number; color: string }) => (
    <XIcon size={size} color={color} />
);

const FacebookIconRender = ({ size, color }: { size: number; color: string }) => (
    <FacebookIcon size={size} color={color} />
);


const AuthorCard = ({ author }: AuthorCardProps) => {
    const theme = useAppTheme();

    const handleSocialPress = (url?: string) => {
        if (url) Linking.openURL(url).catch(() => Linking.openURL(url));
    };

    if (!author) return null;

    const surfaceStyle = [
        styles.authorCard,
        { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outlineVariant }
    ];

    const statsTextStyle = [
        styles.statsText,
        { color: theme.colors.primary }
    ];

    return (
        <Surface style={surfaceStyle} elevation={0}>
            <View style={styles.authorHeader}>
                <Avatar.Image size={64} source={{ uri: author.avatar }} />
                <View style={styles.authorInfo}>
                    <Text variant="titleLarge" style={styles.authorName}>{author.name}</Text>
                    {author.role && (
                        <Text variant="bodySmall" style={styles.authorRole}>{author.role}</Text>
                    )}
                </View>
            </View>

            <Text variant="bodyMedium" style={styles.authorBio}>
                {author.description || author.yoastSEO?.description}
            </Text>

            {author.count !== undefined && (
                <View style={styles.statsRow}>
                    <Text variant="labelSmall" style={statsTextStyle}>
                        {author.count} ARTÍCULOS PUBLICADOS
                    </Text>
                </View>
            )}

            <View style={styles.socialRow}>
                {author.social?.twitter && (
                    <IconButton
                        icon={XIconRender}
                        mode="contained-tonal"
                        size={20}
                        onPress={() => handleSocialPress(author.social.twitter)}
                        style={styles.socialIcon}
                    />
                )}
                {author.social?.facebook && (
                    <IconButton
                        icon={FacebookIconRender}
                        mode="contained-tonal"
                        size={20}
                        onPress={() => handleSocialPress(author.social.facebook)}
                        style={styles.socialIcon}
                    />
                )}
                {author.social?.instagram && (
                    <IconButton icon="instagram" mode="contained-tonal" size={20} onPress={() => handleSocialPress(author.social.instagram)} style={styles.socialIcon} />
                )}
                {author.social?.linkedin && (
                    <IconButton icon="linkedin" mode="contained-tonal" size={20} onPress={() => handleSocialPress(author.social.linkedin)} style={styles.socialIcon} />
                )}
                {author.social?.youtube && (
                    <IconButton icon="youtube" mode="contained-tonal" size={20} onPress={() => handleSocialPress(author.social.youtube)} style={styles.socialIcon} />
                )}
                {author.social?.tiktok && (
                    <IconButton icon="tiktok" mode="contained-tonal" size={20} onPress={() => handleSocialPress(author.social.tiktok)} style={styles.socialIcon} />
                )}
                {author.social?.website && (
                    <IconButton icon="web" mode="contained-tonal" size={20} onPress={() => handleSocialPress(author.social.website)} style={styles.socialIcon} />
                )}
                {author.social?.github && (
                    <IconButton icon="github" mode="contained-tonal" size={20} onPress={() => handleSocialPress(author.social.github)} style={styles.socialIcon} />
                )}
                {author.social?.pinterest && (
                    <IconButton icon="pinterest" mode="contained-tonal" size={20} onPress={() => handleSocialPress(author.social.pinterest)} style={styles.socialIcon} />
                )}
                {author.social?.soundcloud && (
                    <IconButton icon="soundcloud" mode="contained-tonal" size={20} onPress={() => handleSocialPress(author.social.soundcloud)} style={styles.socialIcon} />
                )}
                {author.social?.tumblr && (
                    <IconButton icon="tumblr" mode="contained-tonal" size={20} onPress={() => handleSocialPress(author.social.tumblr)} style={styles.socialIcon} />
                )}
                {author.social?.wikipedia && (
                    <IconButton icon="wikipedia" mode="contained-tonal" size={20} onPress={() => handleSocialPress(author.social.wikipedia)} style={styles.socialIcon} />
                )}
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    authorCard: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 20,
    },
    authorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    authorInfo: {
        marginLeft: 16,
        flex: 1,
    },
    authorName: {
        fontWeight: 'bold',
    },
    authorRole: {
        opacity: 0.7,
    },
    authorBio: {
        lineHeight: 22,
        opacity: 0.8,
        marginBottom: 12,
    },
    statsRow: {
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsText: {
        fontWeight: 'bold',
    },
    socialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },
    socialIcon: {
        margin: 0,
    },
});

export default React.memo(AuthorCard);
