import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Switch, List, RadioButton, useTheme, Divider } from 'react-native-paper';
import { useThemeContext } from '../theme/ThemeContext';

const SettingsScreen = () => {
  const { themeMode, setThemeMode, isDark, toggleTheme } = useThemeContext();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <List.Section title="Apariencia">
        <List.Item
          title="Modo Oscuro"
          description="Activar modo oscuro manualmente"
          left={props => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
            />
          )}
        />
        
        <Divider />
        
        <List.Subheader>Preferencia de Tema</List.Subheader>
        <RadioButton.Group 
          onValueChange={value => setThemeMode(value as 'light' | 'dark' | 'system')} 
          value={themeMode}
        >
          <RadioButton.Item label="Sistema (Automático)" value="system" />
          <RadioButton.Item label="Claro" value="light" />
          <RadioButton.Item label="Oscuro" value="dark" />
        </RadioButton.Group>
      </List.Section>
      
      <View style={styles.infoContainer}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Tema actual: {isDark ? 'Oscuro' : 'Claro'}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Modo seleccionado: {themeMode}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  infoContainer: {
    padding: 20,
    alignItems: 'center',
  }
});

export default SettingsScreen;
