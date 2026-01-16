import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const DetailsScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium">Pantalla de Detalles</Text>
      <Text style={styles.text}>
        Aquí puedes ver más información detallada. La navegación funciona correctamente.
      </Text>
      <Button mode="outlined" onPress={() => navigation.goBack()}>
        Volver
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default DetailsScreen;
