import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { analyticsService, ANALYTICS_EVENTS } from '@/services/firebase/AnalyticsService';
import AuthLoading from '@/components/auth/AuthLoading';
import CustomButton from '@/components/ui/CustomButton';
import UnifiedHeader from '@/components/ui/UnifiedHeader';
import { useAppTheme } from '@/theme';
import AuthLogo from '@/components/ui/AuthLogo';
import { observabilityService } from '@/services/ObservabilityService';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { resetPassword, isLoading } = useAuthStore();
  const showToast = useToastStore(state => state.showToast);

  const themeStyles = React.useMemo(
    () => ({
      container: {
        backgroundColor: theme.colors.background,
      },
      description: {
        color: theme.colors.onSurfaceVariant,
        marginBottom: theme.spacing.m,
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
    }),
    [theme],
  );

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
        await analyticsService.logEvent(ANALYTICS_EVENTS.PASSWORD_RESET_ATTEMPT);
        await resetPassword(email, showToast);
        setSuccessMessage('Se ha enviado un correo para restablecer tu contraseña.');
        // Reset exitoso ya se trackea en authStore
      } catch (e) {
        observabilityService.captureError(e, {
          context: 'ForgotPasswordScreen.handleResetPassword',
          action: 'password_reset',
          email,
        });
        // Error is handled in authStore, but we can clear success message
        // Error ya se trackea en authStore
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isBusy) {
    return <AuthLoading />;
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            themeStyles.container,
            {
              paddingTop: theme.spacing.m,
              paddingBottom: insets.bottom + theme.spacing.xl,
              paddingHorizontal: theme.spacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContent}>
            <AuthLogo size={80} containerStyle={{ marginBottom: theme.spacing.s }} />
            <View style={themeStyles.titleRow}>
              <Text variant="headlineSmall" style={themeStyles.title}>
                Recuperar contraseña
              </Text>
            </View>
            <Text variant="bodyMedium" style={themeStyles.description}>
              Ingresa tu correo electrónico y te enviaremos un enlace para que puedas crear una
              nueva contraseña.
            </Text>
          </View>

          <View style={[styles.form, { gap: theme.spacing.xs }]}>
            <View>
              <TextInput
                label="Correo electrónico"
                value={email}
                onChangeText={text => {
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
                <HelperText
                  type="info"
                  visible={!!successMessage}
                  style={{ color: theme.colors.primary }}
                >
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
              testID="forgot-password-submit"
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
  flex1: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
  },
  headerContent: {
    alignItems: 'center',
    // marginBottom handled in themeStyles
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
