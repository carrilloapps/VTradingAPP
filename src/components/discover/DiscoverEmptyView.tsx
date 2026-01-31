import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/theme';

interface DiscoverEmptyViewProps {
  message?: string;
  icon?: string;
}

const DiscoverEmptyView = ({
  message = 'No se encontraron artículos',
  icon = 'newspaper-variant-outline',
}: DiscoverEmptyViewProps) => {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon}
        size={64}
        color={theme.colors.outline}
      />
      <Text
        variant="titleMedium"
        style={[styles.text, { color: theme.colors.outline }]}
      >
        {message}
      </Text>
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
  },
});

export default DiscoverEmptyView;
