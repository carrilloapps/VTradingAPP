import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, TextInput, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/firebase/AnalyticsService';
import { AppConfig } from '../../constants/AppConfig';
import AuthSkeleton from '../../components/auth/AuthSkeleton';
import CustomButton from '../../components/ui/CustomButton';
import UnifiedHeader from '../../components/ui/UnifiedHeader';
import { useAppTheme } from '../../theme/theme';

const RegisterScreen = ({ navigation }: any) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { signUp, googleSignIn, isLoading } = useAuth();

  const themeStyles = React.useMemo(() => ({
    container: {
      backgroundColor: theme.colors.background,
    },
    footerText: {
      color: theme.colors.onSurface,
    },
    legalText: {
      color: theme.colors.onSurfaceVariant,
    },
    dividerLine: {
      backgroundColor: theme.colors.outline,
    },
    dividerText: {
      marginHorizontal: theme.spacing.s,
      color: theme.colors.onSurfaceVariant,
    },
    logo: {
      // marginBottom moved to logoRow
    },
    logoRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: theme.spacing.s,
    },
    title: {
      color: theme.colors.primary,
      fontWeight: 'bold' as const,
    },
    titleRow: {
      // Removed flex direction as it now only contains title
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: 0,
      marginBottom: theme.spacing.s,
    },
    badge: {
      backgroundColor: theme.colors.elevation.level2,
      borderColor: theme.colors.warning,
      marginLeft: theme.spacing.m,
      paddingHorizontal: theme.spacing.s,
      paddingVertical: 2,
      borderRadius: 12,
      borderWidth: 1,
    },
    badgeText: {
      color: theme.colors.warning,
      fontSize: 10,
      fontWeight: 'bold' as const,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center' as const,
      marginBottom: theme.spacing.m,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isLoading || isSubmitting;

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

  const openExternalUrl = (url: string, title?: string) => {
    // @ts-ignore
    navigation.navigate('WebView', { url, title: title || 'Navegador' });
  };

  const handleRegister = async () => {
    if (validate()) {
      setIsSubmitting(true);
      try {
        await analyticsService.logEvent('sign_up_attempt', { method: 'password' });
        await signUp(email, password);
        await analyticsService.logEvent('sign_up_success', { method: 'password' });
      } catch {
        await analyticsService.logEvent('sign_up_error', { method: 'password' });
        // Error handled in context
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleRegister = async () => {
    setIsSubmitting(true);
    try {
      await analyticsService.logEvent('sign_up_attempt', { method: 'google' });
      await googleSignIn();
      await analyticsService.logEvent('sign_up_success', { method: 'google' });
    } catch {
      await analyticsService.logEvent('sign_up_error', { method: 'google' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBusy) {
    return <AuthSkeleton mode="register" />;
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
        onBackPress={() => navigation.goBack()}
        style={{ backgroundColor: theme.colors.background }}
        showNotification={false}
        showAd={false}
        hideDivider
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
              paddingTop: theme.spacing.s,
              paddingBottom: insets.bottom + theme.spacing.m,
              paddingHorizontal: theme.spacing.xl
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContent}>
            <View style={themeStyles.logoRow}>
              <Image 
                source={require('../../assets/images/logo.png')} 
                style={[styles.logo, themeStyles.logo]} 
              />
              <View
                style={themeStyles.badge}
                accessibilityLabel="BETA"
              >
                <Text variant="labelSmall" style={themeStyles.badgeText}>
                  BETA
                </Text>
              </View>
            </View>
            <View style={themeStyles.titleRow}>
              <Text variant="headlineSmall" style={themeStyles.title}>
                Crear cuenta
              </Text>
            </View>
            <Text variant="bodyMedium" style={themeStyles.subtitle}>
              Regístrate para comenzar a operar
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
                accessibilityHint="Ingresa tu correo para registrarte"
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
                accessibilityHint="Crea una contraseña segura"
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

            <View>
              <TextInput
                label="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry={confirmSecureTextEntry}
                accessibilityLabel="Confirmar contraseña"
                accessibilityHint="Repite tu contraseña"
                error={!!confirmPasswordError}
                left={<TextInput.Icon icon="lock-check" accessibilityLabel="Icono de verificación" />}
                right={
                  <TextInput.Icon 
                    icon={confirmSecureTextEntry ? "eye" : "eye-off"} 
                    onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
                    accessibilityLabel={confirmSecureTextEntry ? "Mostrar contraseña" : "Ocultar contraseña"}
                  />
                }
                style={styles.input}
                disabled={isBusy}
              />
              <HelperText type="error" visible={!!confirmPasswordError}>
                {confirmPasswordError}
              </HelperText>
            </View>

            <CustomButton
              label="Registrarse"
              onPress={handleRegister}
              loading={isBusy}
              disabled={isBusy}
              fullWidth
              style={{ marginTop: theme.spacing.s }}
            />

            <View style={[styles.divider, { marginVertical: theme.spacing.s }]}>
              <View style={[styles.line, themeStyles.dividerLine]} />
              <Text style={themeStyles.dividerText}>O regístrate con</Text>
              <View style={[styles.line, themeStyles.dividerLine]} />
            </View>

            <CustomButton
              label="Google"
              onPress={handleGoogleRegister}
              variant="outlined"
              icon="google"
              loading={isBusy}
              disabled={isBusy}
              fullWidth
            />
          </View>

          <View style={[styles.footer, { marginTop: theme.spacing.m }]}>
            <View style={styles.loginContainer}>
              <Text style={themeStyles.footerText}>¿Ya tienes una cuenta?</Text>
              <CustomButton
                label="Inicia sesión"
                variant="link"
                onPress={() => navigation.goBack()}
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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
  },
  headerContent: {
    alignItems: 'center',
    // marginBottom handled in themeStyles
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: 'transparent',
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
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legal: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});

export default RegisterScreen;
