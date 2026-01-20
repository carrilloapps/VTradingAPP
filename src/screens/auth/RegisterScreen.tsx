import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { analyticsService } from '../../services/firebase/AnalyticsService';

const RegisterScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signUp, googleSignIn, isLoading } = useAuth();

  const themeStyles = React.useMemo(() => ({
    container: {
      backgroundColor: theme.colors.background,
    },
    title: {
      color: theme.colors.primary,
      fontWeight: 'bold' as const,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 10,
    },
    footerText: {
      color: theme.colors.onSurface,
    },
    loginText: {
      color: theme.colors.primary,
      fontWeight: 'bold' as const,
      marginLeft: 5,
    },
    dividerLine: {
      backgroundColor: theme.colors.outline,
    },
    dividerText: {
      marginHorizontal: 10,
      color: theme.colors.onSurfaceVariant,
    },
  }), [theme]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    analyticsService.logScreenView('Register');
  }, []);

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
        await analyticsService.logEvent('sign_up_attempt', { method: 'password' });
        await signUp(email, password);
        await analyticsService.logEvent('sign_up_success', { method: 'password' });
      } catch {
        await analyticsService.logEvent('sign_up_error', { method: 'password' });
        // Error handled in context
      }
    }
  };

  const handleGoogleRegister = async () => {
    try {
      await analyticsService.logEvent('sign_up_attempt', { method: 'google' });
      await googleSignIn();
      await analyticsService.logEvent('sign_up_success', { method: 'google' });
    } catch {
      await analyticsService.logEvent('sign_up_error', { method: 'google' });
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={[
        styles.container, 
        themeStyles.container,
        { 
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20
        }
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar 
        backgroundColor="transparent" 
        translucent 
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
      />
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        accessibilityHint="Regresa a la pantalla anterior"
      >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text variant="headlineMedium" style={themeStyles.title}>
          Crear Cuenta
        </Text>
        <Text variant="bodyLarge" style={themeStyles.subtitle}>
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
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          accessibilityLabel="Correo electrónico"
          accessibilityHint="Ingresa tu correo para registrarte"
          error={!!emailError}
          left={<TextInput.Icon icon="email" accessibilityLabel="Icono de correo" />}
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
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          accessibilityLabel="Contraseña"
          accessibilityHint="Crea una contraseña segura"
          error={!!passwordError}
          left={<TextInput.Icon icon="lock" accessibilityLabel="Icono de contraseña" />}
          right={
            <TextInput.Icon 
              icon={secureTextEntry ? "eye" : "eye-off"} 
              onPress={() => setSecureTextEntry(!secureTextEntry)}
              accessibilityLabel={secureTextEntry ? 'Mostrar contraseña' : 'Ocultar contraseña'}
              accessibilityHint="Alterna la visibilidad de la contraseña"
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
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          accessibilityLabel="Confirmar contraseña"
          accessibilityHint="Repite la contraseña para confirmar"
          error={!!confirmPasswordError}
          left={<TextInput.Icon icon="lock-check" accessibilityLabel="Icono de confirmar contraseña" />}
          right={
            <TextInput.Icon 
              icon={confirmSecureTextEntry ? "eye" : "eye-off"} 
              onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
              accessibilityLabel={confirmSecureTextEntry ? 'Mostrar contraseña' : 'Ocultar contraseña'}
              accessibilityHint="Alterna la visibilidad de la contraseña"
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
          accessibilityLabel="Registrarse"
          accessibilityHint="Crea tu cuenta con correo y contraseña"
        >
          Registrarse
        </Button>

        <View style={styles.divider}>
          <View style={[styles.line, themeStyles.dividerLine]} />
          <Text style={themeStyles.dividerText}>O</Text>
          <View style={[styles.line, themeStyles.dividerLine]} />
        </View>

        <Button
          mode="outlined"
          onPress={handleGoogleRegister}
          loading={isLoading}
          disabled={isLoading}
          icon="google"
          style={styles.button}
          accessibilityLabel="Registrarse con Google"
          accessibilityHint="Crea tu cuenta usando Google"
        >
          Registrarse con Google
        </Button>
      </View>

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={themeStyles.footerText}>
          ¿Ya tienes una cuenta?
        </Text>
        <TouchableOpacity
          onPress={() => {
            analyticsService.logEvent('navigate_login');
            navigation.navigate('Login');
          }}
          accessibilityRole="button"
          accessibilityLabel="Inicia sesión"
          accessibilityHint="Abre la pantalla de inicio de sesión"
        >
          <Text variant="bodyMedium" style={themeStyles.loginText}>
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
});

export default RegisterScreen;
