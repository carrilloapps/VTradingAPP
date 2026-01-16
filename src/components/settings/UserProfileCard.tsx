import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const UserProfileCard = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.elevation.level1,
      borderColor: theme.colors.outline,
    }]}>
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuALTzyfTM9qPKu6BdyQLQNwMkOSIqdb6oVmrMR1r6PNOjWlqlMm0nkUadRLDreyhE_-yyJBhrKB-HvXMIDSS8QlkKoIqTX1DJv5z5HzhXjQv1b1kUkAVNuASS4JiucZZ-JDB3nT-Wk8JueTeQOHf-nuQB5jznnAGxS-J_RH0UZOjLfzqwWhKzDSGletm57YEbUZHLc33w5mKrhw1XAp9p93bNT3QwMJfVi38Z6E27RpYWBzaHOZH6fLRbRZzF1GI7bUkBHG8Vdz9Mc" }} 
          style={[styles.avatar, { borderColor: theme.colors.primary + '33' }]} // 20% opacity primary
        />
        <View style={[styles.badge, { 
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.surface 
        }]}>
          <Text style={styles.badgeText}>PRO</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
          Alejandro Rodriguez
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          alejandro@example.com
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.editButton}
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
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 2,
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
  }
});

export default UserProfileCard;
