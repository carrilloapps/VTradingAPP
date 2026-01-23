import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, TextInput, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/firebase/AnalyticsService';
import AuthSkeleton from '../../components/auth/AuthSkeleton';
import CustomButton from '../../components/ui/CustomButton';
import UnifiedHeader from '../../components/ui/UnifiedHeader';
import { useAppTheme } from '../../theme/theme';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { resetPassword, isLoading } = useAuth();

  const themeStyles = React.useMemo(() => ({
    container: {
      backgroundColor: theme.colors.background,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.l,
      textAlign: 'center' as const,
    },
    footerText: {
      color: theme.colors.onSurface,
    },
    loginText: {
      color: theme.colors.primary,
      fontWeight: 'bold' as const,
      marginLeft: theme.spacing.xs,
    },
    logo: {
      // marginBottom moved to logoRow
    },
    logoRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: theme.spacing.m,
    },
    title: {
      color: theme.colors.primary,
      fontWeight: 'bold' as const,
    },
    titleRow: {
      // Removed flex direction as it now only contains title
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: theme.spacing.s,
      marginBottom: theme.spacing.m,
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
  }), [theme]);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const isBusy = isLoading || isSubmitting;

  useEffect(() => {
    analyticsService.logScreenView('ForgotPassword');
  }, []);

  const validate = () => {
    if (!email || !email.includes('@')) {
      setEmailError('Ingresa un correo válido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (validate()) {
      setIsSubmitting(true);
      setSuccessMessage('');
      try {
        await analyticsService.logEvent('password_reset_attempt');
        await resetPassword(email);
        setSuccessMessage('Se ha enviado un correo para restablecer tu contraseña.');
        await analyticsService.logEvent('password_reset_success');
      } catch (error) {
        // Error is handled in context, but we can clear success message
        await analyticsService.logEvent('password_reset_error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isBusy) {
    return <AuthSkeleton mode="forgot-password" />;
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
              paddingTop: theme.spacing.m,
              paddingBottom: insets.bottom + theme.spacing.xl,
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
                Recuperar contraseña
              </Text>
            </View>
            <Text variant="bodyMedium" style={themeStyles.description}>
              Ingresa tu correo electrónico y te enviaremos un enlace para que puedas crear una nueva contraseña.
            </Text>
          </View>

          <View style={[styles.form, { gap: theme.spacing.m }]}>
            <View>
              <TextInput
                label="Correo electrónico"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (successMessage) setSuccessMessage('');
                }}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                accessibilityLabel="Correo electrónico"
                accessibilityHint="Ingresa el correo asociado a tu cuenta"
                error={!!emailError}
                left={<TextInput.Icon icon="email" accessibilityLabel="Icono de correo" />}
                style={styles.input}
                disabled={isBusy}
              />
              <HelperText type="error" visible={!!emailError}>
                {emailError}
              </HelperText>
              {successMessage ? (
                <HelperText type="info" visible={!!successMessage} style={{ color: theme.colors.primary }}>
                  {successMessage}
                </HelperText>
              ) : null}
            </View>

            <CustomButton
              label="Enviar enlace"
              onPress={handleResetPassword}
              loading={isBusy}
              disabled={isBusy}
              fullWidth
              style={{ marginTop: theme.spacing.s }}
            />
          </View>

          <View style={[styles.footer, { marginTop: theme.spacing.xl }]}>
            <Text variant="bodyMedium" style={themeStyles.footerText}>
              ¿Recordaste tu contraseña?
            </Text>
            <CustomButton
              label="Inicia sesión"
              variant="link"
              onPress={() => navigation.goBack()}
              style={{ marginLeft: -theme.spacing.s }}
            />
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
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: 'transparent',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ForgotPasswordScreen;
