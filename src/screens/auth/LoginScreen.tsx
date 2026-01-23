import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/firebase/AnalyticsService';
import DeviceInfo from 'react-native-device-info';
import { useAppTheme } from '../../theme/theme';
import { AppConfig } from '../../constants/AppConfig';
import AuthSkeleton from '../../components/auth/AuthSkeleton';
import CustomButton from '../../components/ui/CustomButton';
import UnifiedHeader from '../../components/ui/UnifiedHeader';
import AboutDialog from '../../components/ui/AboutDialog';
import AuthLogo from '../../components/ui/AuthLogo';

const LoginScreen = ({ navigation }: any) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { signIn, googleSignIn, signInAnonymously, isLoading: isAuthLoading } = useAuth();

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
      marginTop: theme.spacing.s,
      fontWeight: 'bold' as const,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
    },
    linkText: {
      color: theme.colors.primary,
    },
    dividerLine: {
      backgroundColor: theme.colors.outline,
    },
    dividerText: {
      marginHorizontal: theme.spacing.s,
      color: theme.colors.onSurfaceVariant,
    },
    footerText: {
      color: theme.colors.onSurface,
    },
    legalText: {
      color: theme.colors.onSurfaceVariant,
    },
    registerText: {
      color: theme.colors.primary,
      fontWeight: 'bold' as const,
      marginLeft: theme.spacing.xs,
    },
    titleRow: {
      // Removed marginBottom as it now only contains title
    },
    forgotPassword: {
      marginBottom: theme.spacing.s,
    },
  }), [theme]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isAuthLoading || isSubmitting;

  const openExternalUrl = (url: string, title?: string) => {
    // @ts-ignore
    navigation.navigate('WebView', { url, title: title || 'Navegador' });
  };

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
      setIsSubmitting(true);
      try {
        await analyticsService.logEvent('login_attempt', { method: 'password' });
        await signIn(email, password);
        await analyticsService.logEvent('login_success', { method: 'password' });
      } catch {
        await analyticsService.logEvent('login_error', { method: 'password' });
        // Error handled in context
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await analyticsService.logEvent('login_attempt', { method: 'google' });
      await googleSignIn();
      await analyticsService.logEvent('login_success', { method: 'google' });
    } catch {
      await analyticsService.logEvent('login_error', { method: 'google' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsSubmitting(true);
    try {
      await analyticsService.logEvent('login_attempt', { method: 'anonymous' });
      await signInAnonymously();
      await analyticsService.logEvent('login_success', { method: 'anonymous' });
    } catch {
      await analyticsService.logEvent('login_error', { method: 'anonymous' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBusy) {
    return <AuthSkeleton mode="login" />;
  }

  return (
    <View style={[styles.screen, themeStyles.container]}>
      <StatusBar 
        backgroundColor="transparent" 
        translucent 
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
      />
      <UnifiedHeader 
        variant="section"
        title=""
        rightActionIcon="info-outline"
        onActionPress={() => setAboutVisible(true)}
        showNotification={false}
        showAd={false}
        hideDivider
        style={{ backgroundColor: theme.colors.background }}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.container, 
            themeStyles.container,
            { 
              paddingTop: theme.spacing.xs,
              paddingBottom: insets.bottom + theme.spacing.xl,
              paddingHorizontal: theme.spacing.xl
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { marginBottom: theme.spacing.l }]}>
            <AuthLogo 
              size={80} 
              containerStyle={{ marginBottom: theme.spacing.m }} 
            />
            <View style={[styles.titleRow, themeStyles.titleRow]}>
              <Text variant="headlineMedium" style={themeStyles.title}>
                {appName}
              </Text>
            </View>
            <Text variant="bodyLarge" style={themeStyles.subtitle}>
              Inicia sesión para continuar
            </Text>
          </View>

          <View style={[styles.form, { gap: theme.spacing.s }]}>
            <View>
              <TextInput
                label="Correo electrónico"
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
                disabled={isBusy}
              />
              <HelperText type="error" visible={!!emailError}>
                {emailError}
              </HelperText>
            </View>

            <View>
              <TextInput
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={secureTextEntry}
                accessibilityLabel="Contraseña"
                accessibilityHint="Ingresa tu contraseña"
                error={!!passwordError}
                left={<TextInput.Icon icon="lock" accessibilityLabel="Icono de candado" />}
                right={
                  <TextInput.Icon 
                    icon={secureTextEntry ? "eye" : "eye-off"} 
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                    accessibilityLabel={secureTextEntry ? "Mostrar contraseña" : "Ocultar contraseña"}
                  />
                }
                style={styles.input}
                disabled={isBusy}
              />
              <HelperText type="error" visible={!!passwordError}>
                {passwordError}
              </HelperText>
            </View>

            <View style={[styles.forgotPassword, themeStyles.forgotPassword]}>
              <CustomButton
                label="¿Olvidaste tu contraseña?"
                variant="link"
                onPress={() => navigation.navigate('ForgotPassword')}
                style={{ alignSelf: 'flex-end' }}
                disabled={isBusy}
              />
            </View>

            <CustomButton
              label="Iniciar Sesión"
              onPress={handleLogin}
              loading={isBusy}
              disabled={isBusy}
              fullWidth
            />

            <View style={[styles.divider, { marginVertical: theme.spacing.s }]}>
              <View style={[styles.line, themeStyles.dividerLine]} />
              <Text style={themeStyles.dividerText}>O continúa con</Text>
              <View style={[styles.line, themeStyles.dividerLine]} />
            </View>

            <CustomButton
              label="Google"
              onPress={handleGoogleLogin}
              variant="outlined"
              icon="google"
              loading={isBusy}
              disabled={isBusy}
              fullWidth
            />

            <CustomButton
              label="Continuar como invitado"
              onPress={handleGuestLogin}
              variant="ghost"
              loading={isBusy}
              disabled={isBusy}
              fullWidth
              style={{ marginTop: theme.spacing.s }}
            />
          </View>

          <View style={[styles.footer, { marginTop: theme.spacing.m }]}>
            <View style={styles.registerContainer}>
              <Text style={themeStyles.footerText}>¿No tienes cuenta?</Text>
              <CustomButton
                label="Regístrate"
                variant="link"
                onPress={() => navigation.navigate('Register')}
                style={{ marginLeft: -theme.spacing.s }}
              />
            </View>
            
            <View style={[styles.legal, { marginTop: theme.spacing.s }]}>
              <Text variant="bodySmall" style={[themeStyles.legalText, { textAlign: 'center' }]}>
                Al continuar aceptas nuestras{' '}
                <Text
                  style={{ color: theme.colors.primary, fontWeight: 'bold' }}
                  onPress={() => openExternalUrl(AppConfig.PRIVACY_POLICY_URL, 'Políticas de privacidad')}
                >
                  Políticas de privacidad
                </Text>
                {' y '}
                <Text
                  style={{ color: theme.colors.primary, fontWeight: 'bold' }}
                  onPress={() => openExternalUrl(AppConfig.TERMS_OF_USE_URL, 'Términos y condiciones')}
                >
                  Términos y condiciones
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AboutDialog 
        visible={aboutVisible} 
        onDismiss={() => setAboutVisible(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    // justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: 'transparent',
  },
  forgotPassword: {
    alignItems: 'flex-end',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 1,
  },
  footer: {
    alignItems: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legal: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});

export default LoginScreen;
