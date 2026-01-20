import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/firebase/AnalyticsService';
import DeviceInfo from 'react-native-device-info';
import { useAppTheme } from '../../theme/theme';

const LoginScreen = ({ navigation }: any) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { signIn, googleSignIn, signInAnonymously, isLoading } = useAuth();

  useEffect(() => {
    analyticsService.logScreenView('Login');
  }, []);

  const appName = DeviceInfo.getApplicationName();

  const themeStyles = useMemo(() => ({
    container: {
      backgroundColor: theme.colors.background,
    },
    title: {
      color: theme.colors.primary,
      marginTop: 10,
      fontWeight: 'bold' as const,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
    },
    linkText: {
      color: theme.colors.primary,
    },
    dividerLine: {
      backgroundColor: theme.colors.outline,
    },
    dividerText: {
      marginHorizontal: 10,
      color: theme.colors.onSurfaceVariant,
    },
    footerText: {
      color: theme.colors.onSurface,
    },
    registerText: {
      color: theme.colors.primary,
      fontWeight: 'bold' as const,
      marginLeft: 5,
    },
    badge: {
      backgroundColor: theme.colors.elevation.level2,
      borderColor: theme.colors.warning,
    },
    badgeText: {
      color: theme.colors.warning,
    },
  }), [theme]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let isValid = true;
    if (!email || !email.includes('@')) {
      setEmailError('Ingresa un correo válido');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Ingresa tu contraseña');
      isValid = false;
    } else {
      setPasswordError('');
    }
    return isValid;
  };

  const handleLogin = async () => {
    if (validate()) {
      try {
        await analyticsService.logEvent('login_attempt', { method: 'password' });
        await signIn(email, password);
        await analyticsService.logEvent('login_success', { method: 'password' });
      } catch {
        await analyticsService.logEvent('login_error', { method: 'password' });
        // Error handled in context
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await analyticsService.logEvent('login_attempt', { method: 'google' });
      await googleSignIn();
      await analyticsService.logEvent('login_success', { method: 'google' });
    } catch {
      await analyticsService.logEvent('login_error', { method: 'google' });
    }
  };

  const handleGuestLogin = async () => {
    try {
      await analyticsService.logEvent('login_attempt', { method: 'anonymous' });
      await signInAnonymously();
      await analyticsService.logEvent('login_success', { method: 'anonymous' });
    } catch {
      await analyticsService.logEvent('login_error', { method: 'anonymous' });
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
      <View style={styles.header}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        <View style={styles.titleRow}>
          <Text variant="headlineMedium" style={themeStyles.title}>
            {appName}
          </Text>
          <View
            style={[styles.badge, themeStyles.badge]}
            accessibilityLabel="BETA"
          >
            <Text variant="labelSmall" style={[styles.badgeText, themeStyles.badgeText]}>
              BETA
            </Text>
          </View>
        </View>
        <Text variant="bodyLarge" style={themeStyles.subtitle}>
          Inicia sesión para continuar
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
          accessibilityHint="Ingresa tu correo para iniciar sesión"
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
          autoComplete="password"
          textContentType="password"
          accessibilityLabel="Contraseña"
          accessibilityHint="Ingresa tu contraseña para iniciar sesión"
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

        <TouchableOpacity 
          onPress={() => {
            analyticsService.logEvent('navigate_forgot_password');
            navigation.navigate('ForgotPassword');
          }}
          style={styles.forgotPassword}
          accessibilityRole="button"
          accessibilityLabel="¿Olvidaste tu contraseña?"
          accessibilityHint="Abre la pantalla para recuperar tu contraseña"
        >
          <Text variant="bodyMedium" style={themeStyles.linkText}>
            ¿Olvidaste tu contraseña?
          </Text>
        </TouchableOpacity>

        <Button 
          mode="contained" 
          onPress={handleLogin} 
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
          accessibilityLabel="Iniciar sesión"
          accessibilityHint="Inicia sesión con correo y contraseña"
        >
          Iniciar Sesión
        </Button>

        <View style={styles.divider}>
          <View style={[styles.line, themeStyles.dividerLine]} />
          <Text style={themeStyles.dividerText}>O</Text>
          <View style={[styles.line, themeStyles.dividerLine]} />
        </View>

        <Button 
          mode="outlined" 
          onPress={handleGoogleLogin} 
          loading={isLoading}
          disabled={isLoading}
          icon="google"
          style={styles.button}
          accessibilityLabel="Continuar con Google"
          accessibilityHint="Inicia sesión con tu cuenta de Google"
        >
          Continuar con Google
        </Button>

        <Button 
          mode="text" 
          onPress={handleGuestLogin} 
          disabled={isLoading}
          style={styles.button}
          accessibilityLabel="Ingresar como invitado"
          accessibilityHint="Accede sin crear una cuenta"
        >
          Ingresar como Invitado
        </Button>
      </View>

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={themeStyles.footerText}>
          ¿No tienes una cuenta?
        </Text>
        <TouchableOpacity
          onPress={() => {
            analyticsService.logEvent('navigate_register');
            navigation.navigate('Register');
          }}
          accessibilityRole="button"
          accessibilityLabel="Regístrate"
          accessibilityHint="Abre la pantalla de registro"
        >
          <Text variant="bodyMedium" style={themeStyles.registerText}>
            Regístrate
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 70,
    height: 45,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  button: {
    marginBottom: 15,
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
    marginTop: 20,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'center',
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default LoginScreen;
