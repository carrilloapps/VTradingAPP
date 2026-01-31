import React, { useState, useEffect } from 'react';
import { Avatar, useTheme } from 'react-native-paper';
import { md5 } from '../../../utils/md5';

interface HeaderAvatarProps {
    avatarUrl?: string | null;
    email?: string | null;
    userName?: string;
}

const HeaderAvatar: React.FC<HeaderAvatarProps> = ({ avatarUrl, email, userName }) => {
    const theme = useTheme();
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [avatarUrl, email]);

    const getInitials = (name: string) => {
        return name
            .trim()
            .split(/\s+/)
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    const avatarStyle = {
        borderColor: theme.colors.outline,
        backgroundColor: 'transparent',
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
    };

    // 1. Photo URL
    if (avatarUrl) {
        return (
            <Avatar.Image
                size={44}
                source={{ uri: avatarUrl }}
                accessibilityLabel={`Foto de perfil de ${userName || 'Usuario'}`}
                style={avatarStyle}
            />
        );
    }

    // 2. Gravatar
    if (email && !imageError) {
        const hash = md5(email.trim().toLowerCase());
        const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404`;
        return (
            <Avatar.Image
                size={44}
                source={{ uri: gravatarUrl }}
                onError={() => setImageError(true)}
                accessibilityLabel={`Foto de perfil de ${userName || 'Usuario'}`}
                style={avatarStyle}
            />
        );
    }

    // 3. Initials
    return (
        <Avatar.Text
            size={44}
            label={getInitials(userName || 'User')}
            style={[avatarStyle, { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.outline }]}
            color={theme.colors.onPrimaryContainer}
            accessibilityLabel={`Iniciales de perfil de ${userName || 'Usuario'}`}
        />
    );
};

export default React.memo(HeaderAvatar);
