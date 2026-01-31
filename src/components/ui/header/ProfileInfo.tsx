import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import HeaderAvatar from './HeaderAvatar';

interface ProfileInfoProps {
  onProfilePress?: () => void;
  userName?: string;
  avatarUrl?: string | null;
  email?: string | null;
  isPremium?: boolean;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  onProfilePress,
  userName,
  avatarUrl,
  email,
  isPremium,
}) => {
  const theme = useTheme();
  const colors = theme.colors as any;

  return (
    <TouchableOpacity
      onPress={onProfilePress}
      style={styles.userInfo}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Perfil de ${userName || 'Usuario'}. ${isPremium ? 'Plan Premium' : 'Plan Gratuito'}`}
      accessibilityHint="Navegar al perfil de usuario"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.avatarContainer}>
        <HeaderAvatar avatarUrl={avatarUrl} email={email} userName={userName} />
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: colors.success,
              borderColor: theme.colors.background,
            },
          ]}
        />
      </View>

      <View style={styles.textContainer}>
        <Text
          style={[
            styles.subtitle,
            {
              color: isPremium ? colors.warning : theme.colors.onSurfaceVariant,
            },
            isPremium ? styles.boldText : styles.normalText,
          ]}
        >
          {isPremium ? 'PLAN PREMIUM' : 'PLAN GRATUITO'}
        </Text>
        <Text
          variant="titleMedium"
          style={[styles.greeting, { color: theme.colors.onSurface }]}
        >
          Hola, {userName}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  textContainer: {
    flexDirection: 'column',
  },
  subtitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  greeting: {
    fontWeight: 'bold',
  },
  boldText: {
    fontWeight: 'bold',
  },
  normalText: {
    fontWeight: 'normal',
  },
});

export default React.memo(ProfileInfo);
