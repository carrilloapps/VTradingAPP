import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import CustomButton from './CustomButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  icon?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Ocurrió un error inesperado',
  onRetry,
  icon = 'alert-circle-outline',
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon}
        size={64}
        color={theme.colors.error}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
        {message}
      </Text>
      {onRetry && (
        <View style={styles.buttonContainer}>
          <CustomButton
            variant="primary"
            label="Reintentar"
            onPress={onRetry}
            icon="reload"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  icon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  text: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
  },
  buttonContainer: {
    minWidth: 160,
  },
});

export default React.memo(ErrorState);
