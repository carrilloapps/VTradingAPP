import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/theme';

interface DiscoverErrorViewProps {
  message?: string;
  onRetry: () => void;
}

const DiscoverErrorView = ({
  message = 'Error al cargar contenido',
  onRetry,
}: DiscoverErrorViewProps) => {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={64}
        color={theme.colors.error}
      />
      <Text
        variant="titleMedium"
        style={[styles.text, { color: theme.colors.onSurfaceVariant }]}
      >
        {message}
      </Text>
      <Button
        mode="contained-tonal"
        onPress={onRetry}
        icon="refresh"
        style={styles.button}
      >
        Reintentar
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  text: {
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
  },
});

export default DiscoverErrorView;
