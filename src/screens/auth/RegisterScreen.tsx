import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const RegisterScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signUp, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validate = () => {
    let isValid = true;
    
    // Email Validation
    if (!email || !email.includes('@')) {
      setEmailError('Ingresa un correo válido');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Password Validation
    if (!password || password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      isValid = false;
    } else {
      setPasswordError('');
    }

    // Confirm Password Validation
    if (password !== confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (validate()) {
      try {
        await signUp(email, password);
        // Navigation might be handled by AuthState change, but if not:
        // navigation.navigate('Login'); // Or auto-login logic
      } catch (e) {
        // Error handled in context
      }
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20
        }
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={styles.backButton}
      >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
          Crear Cuenta
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 10 }}>
          Regístrate para comenzar a operar
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

        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={secureTextEntry}
          error={!!passwordError}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon 
              icon={secureTextEntry ? "eye" : "eye-off"} 
              onPress={() => setSecureTextEntry(!secureTextEntry)} 
            />
          }
          style={styles.input}
        />
        <HelperText type="error" visible={!!passwordError}>
          {passwordError}
        </HelperText>

        <TextInput
          label="Confirmar Contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          secureTextEntry={confirmSecureTextEntry}
          error={!!confirmPasswordError}
          left={<TextInput.Icon icon="lock-check" />}
          right={
            <TextInput.Icon 
              icon={confirmSecureTextEntry ? "eye" : "eye-off"} 
              onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)} 
            />
          }
          style={styles.input}
        />
        <HelperText type="error" visible={!!confirmPasswordError}>
          {confirmPasswordError}
        </HelperText>

        <Button 
          mode="contained" 
          onPress={handleRegister} 
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
        >
          Registrarse
        </Button>
      </View>

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
          ¿Ya tienes una cuenta?
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold', marginLeft: 5 }}>
            Inicia Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
});

export default RegisterScreen;
