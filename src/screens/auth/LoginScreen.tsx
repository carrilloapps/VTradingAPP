import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const LoginScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, googleSignIn, signInAnonymously, isLoading } = useAuth();

  const themeStyles = React.useMemo(() => ({
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
        await signIn(email, password);
      } catch {
        // Error handled in context
      }
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
      <View style={styles.header}>
        <MaterialIcons name="candlestick-chart" size={60} color={theme.colors.primary} />
        <Text variant="headlineMedium" style={themeStyles.title}>
          VTradingAPP
        </Text>
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

        <TouchableOpacity 
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotPassword}
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
          onPress={googleSignIn} 
          loading={isLoading}
          disabled={isLoading}
          icon="google"
          style={styles.button}
        >
          Continuar con Google
        </Button>

        <Button 
          mode="text" 
          onPress={signInAnonymously} 
          disabled={isLoading}
          style={styles.button}
        >
          Ingresar como Invitado
        </Button>
      </View>

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={themeStyles.footerText}>
          ¿No tienes una cuenta?
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
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
});

export default LoginScreen;
