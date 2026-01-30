import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { md5 } from '../../utils/md5';
import { useAppTheme } from '../../theme/theme';

interface UserProfileCardProps {
  user: FirebaseAuthTypes.User | null;
  onEdit?: () => void;
  onRegister?: () => void;
}

const UserProfileCard = ({ user, onEdit, onRegister }: UserProfileCardProps) => {
  const theme = useAppTheme();
  const [imageError, setImageError] = useState(false);

  const displayName = user?.displayName || (user?.isAnonymous ? 'Invitado' : 'Usuario');
  const email = user?.email || (user?.isAnonymous ? 'Sesión anónima' : 'Sin correo');
  const isPro = !!user && !user.isAnonymous;

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
          style={styles.transparentBg}
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
          style={styles.transparentBg}
        />
      );
    }

    // 3. Fallback: Initials
    return (
      <Avatar.Text
        size={64}
        label={getInitials(displayName)}
        style={[styles.avatarText, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
      />
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, {
        backgroundColor: theme.colors.elevation.level1,
        borderColor: theme.colors.outline,
      }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarWrapper, { borderColor: theme.colors.primary + '33' }]}>
            {renderAvatar()}
          </View>
          <View style={[styles.badge, {
            backgroundColor: isPro ? theme.colors.warning : theme.colors.surfaceVariant,
            borderColor: theme.colors.elevation.level1
          }]}>
            <Text style={[styles.badgeText, {
              color: isPro
                ? (theme.dark ? theme.colors.onPrimary : theme.colors.onPrimaryContainer)
                : theme.colors.onSurfaceVariant
            }]}>
              {isPro ? 'PRO' : 'FREE'}
            </Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text variant="titleMedium" style={[styles.userName, { color: theme.colors.onSurface }]}>
            {displayName}
          </Text>
          <Text variant="bodySmall" style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
            {email}
          </Text>
        </View>

        {isPro && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={onEdit}
          >
            <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {!isPro && (
        <View style={[styles.premiumCard, {
          backgroundColor: theme.colors.primaryContainer,
        }]}>
          <View style={styles.premiumContent}>
            <MaterialCommunityIcons name="diamond" size={24} color={theme.colors.onPrimaryContainer} />
            <View style={styles.premiumTextContainer}>
              <Text variant="titleSmall" style={[styles.premiumTitle, { color: theme.colors.onPrimaryContainer }]}>
                PÁSATE AL PLAN PREMIUM
              </Text>
              <Text variant="bodySmall" style={[styles.premiumSubtitle, { color: theme.colors.onPrimaryContainer }]}>
                Gratis durante el periodo de pruebas. Solo necesitas registrarte presionando el boton "Registrarse gratis".
              </Text>
            </View>
          </View>
          <Button
            mode="contained"
            onPress={onRegister}
            style={[styles.registerButton, { backgroundColor: theme.colors.primary }]}
            textColor={theme.colors.onPrimary}
          >
            Registrarse gratis
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
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
    borderRadius: 100, // Fixed: "100%" string not recommended for borderRadius in some RN versions/linters, use number usually, but if it works it works. 64/2 = 32. 
    // Actually the previous code had "100%". I'll keep it as number 100 (large enough) or 34.
    borderWidth: 2,
    padding: 2,
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
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  transparentBg: {
    backgroundColor: 'transparent',
  },
  userEmail: {
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
  premiumCard: {
    padding: 16,
    borderRadius: 24,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontWeight: 'bold',
  },
  premiumSubtitle: {
    opacity: 0.8,
  },
  registerButton: {
    marginTop: 12,
  },
  avatarText: {
    // bgColor handled inline with theme
  }
});

export default UserProfileCard;
