import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { analyticsService } from '../../services/firebase/AnalyticsService';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();

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
    contentContainer: {
      paddingTop: insets.top + 20,
      paddingBottom: insets.bottom + 20
    }
  }), [theme, insets]);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleReset = async () => {
    if (validate()) {
      setLoading(true);
      try {
        await analyticsService.logEvent('password_reset_attempt');
        await resetPassword(email);
        await analyticsService.logEvent('password_reset_success');
        navigation.goBack();
      } catch {
        await analyticsService.logEvent('password_reset_error');
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
        themeStyles.container,
        themeStyles.contentContainer
      ]}
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
          Recuperar Contraseña
        </Text>
        <Text variant="bodyLarge" style={themeStyles.subtitle}>
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
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          accessibilityLabel="Correo electrónico"
          accessibilityHint="Ingresa tu correo para restablecer tu contraseña"
          error={!!emailError}
          left={<TextInput.Icon icon="email" accessibilityLabel="Icono de correo" />}
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
          accessibilityLabel="Enviar enlace de recuperación"
          accessibilityHint="Envía el enlace para restablecer tu contraseña"
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
