import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';

interface AuthLoadingProps {
  testID?: string;
}

const AuthLoading: React.FC<AuthLoadingProps> = ({
  testID = 'auth-loading',
}) => {
  const theme = useAppTheme();

  return (
    <View
      testID={testID}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <ActivityIndicator
          animating={true}
          color={theme.colors.primary}
          size="large"
        />
        <Text
          variant="bodyMedium"
          style={[styles.text, { color: theme.colors.onSurfaceVariant }]}
        >
          Cargando...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 16,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
});

export default AuthLoading;
