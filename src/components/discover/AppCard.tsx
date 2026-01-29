import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Text, useTheme, Surface, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export interface RecommendedApp {
  id: number;
  name: string;
  icon: string;
  color: string;
  url?: string;
}

interface AppCardProps {
  app: RecommendedApp;
  onPress?: (app: RecommendedApp) => void;
}

const AppCard: React.FC<AppCardProps> = ({ app, onPress }) => {
  const theme = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress(app);
    } else if (app.url) {
      Linking.openURL(app.url);
    }
  };

  return (
    <TouchableRipple 
      onPress={handlePress}
      style={{ borderRadius: theme.roundness * 6 }}
      borderless
      accessibilityRole="button"
      accessibilityLabel={`App ${app.name}`}
    >
      <Surface 
        elevation={0}
        style={[styles.container, { 
          backgroundColor: theme.colors.elevation.level1, 
          borderColor: theme.colors.outline,
          borderRadius: theme.roundness * 6
        }]}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={app.icon}
            size={32}
            color={app.color}
          />
        </View>
        <Text
          variant="labelSmall"
          style={[styles.name, { color: theme.colors.onSurface }]}
          numberOfLines={2}
        >
          {app.name}
        </Text>
      </Surface>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 1,
    padding: 8, // Reduced from 16
    borderWidth: 1,
    elevation: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 32, // Reduced from 48
    height: 32,
    marginBottom: 4, // Reduced from 8
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 9, // Reduced from 10
  },
});

export default AppCard;
