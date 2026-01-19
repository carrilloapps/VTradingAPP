import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, Avatar } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { md5 } from '../../utils/md5';

interface UserProfileCardProps {
  user: FirebaseAuthTypes.User | null;
  onEdit?: () => void;
}

const UserProfileCard = ({ user, onEdit }: UserProfileCardProps) => {
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);

  const displayName = user?.displayName || (user?.isAnonymous ? 'Invitado' : 'Usuario');
  const email = user?.email || (user?.isAnonymous ? 'Sesión anónima' : 'Sin correo');
  const isPro = !user?.isAnonymous; // Mock logic for PRO badge

  // Reset error state when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.email, user?.photoURL]);

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderAvatar = () => {
    // 1. If user has a photoURL (e.g. Google Sign In), use it.
    if (user?.photoURL) {
      return (
        <Avatar.Image 
          size={64} 
          source={{ uri: user.photoURL }} 
          style={{ backgroundColor: 'transparent' }}
        />
      );
    }

    // 2. If user has email, try Gravatar (unless it errored previously)
    if (user?.email && !imageError) {
      const hash = md5(user.email.trim().toLowerCase());
      const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404`;
      return (
        <Avatar.Image 
          size={64} 
          source={{ uri: gravatarUrl }} 
          onError={() => setImageError(true)}
          style={{ backgroundColor: 'transparent' }}
        />
      );
    }

    // 3. Fallback: Initials
    return (
      <Avatar.Text 
        size={64} 
        label={getInitials(displayName)} 
        style={{ backgroundColor: theme.colors.primaryContainer }}
        color={theme.colors.onPrimaryContainer}
      />
    );
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.elevation.level1,
      borderColor: theme.colors.outline,
    }]}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatarWrapper, { borderColor: theme.colors.primary + '33' }]}>
          {renderAvatar()}
        </View>
        {isPro && (
          <View style={[styles.badge, { 
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.surface 
          }]}>
            <Text style={styles.badgeText}>PRO</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text variant="titleMedium" style={[styles.userName, { color: theme.colors.onSurface }]}>
          {displayName}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {email}
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.editButton}
        onPress={onEdit}
      >
        <MaterialIcons name="edit" size={20} color={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24, 
    borderWidth: 1,
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarWrapper: {
    borderRadius: 32,
    borderWidth: 2,
    padding: 2, // Optional: gap between border and avatar
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 2,
    zIndex: 1,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  editButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  userName: {
    fontWeight: 'bold',
  },
});

export default UserProfileCard;
