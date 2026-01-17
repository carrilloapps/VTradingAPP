import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email || !email.includes('@')) {
      setEmailError('Ingresa un correo válido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleReset = async () => {
    if (validate()) {
      setLoading(true);
      try {
        await resetPassword(email);
        navigation.goBack();
      } catch (e) {
        // Error handled in context
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20
        }
      ]}
    >
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={styles.backButton}
      >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
          Recuperar Contraseña
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 10 }}>
          Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!emailError}
          left={<TextInput.Icon icon="email" />}
          style={styles.input}
        />
        <HelperText type="error" visible={!!emailError}>
          {emailError}
        </HelperText>

        <Button 
          mode="contained" 
          onPress={handleReset} 
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Enviar Enlace
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 5,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
});

export default ForgotPasswordScreen;
