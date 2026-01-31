# Implementación de Autenticación

Este documento describe la implementación del sistema de autenticación en VTradingAPP.

## Arquitectura

El sistema de autenticación se basa en **Firebase Authentication** y utiliza **Context API** de React para la gestión del estado global.

### Componentes Principales

1.  **AuthService (`src/services/firebase/AuthService.ts`)**:

    - Encapsula la lógica de Firebase Auth.
    - Soporta: Email/Password, Google Sign-In, Anónimo.
    - Manejo centralizado de errores.

2.  **AuthContext (`src/context/AuthContext.tsx`)**:

    - Provee el estado del usuario (`user`) y estado de carga (`isLoading`) a toda la aplicación.
    - Expone métodos: `signIn`, `signUp`, `signOut`, `googleSignIn`, `resetPassword`, `signInAnonymously`.
    - Integra el sistema de Toast para notificaciones.

3.  **ToastContext (`src/context/ToastContext.tsx`)**:

    - Sistema de notificaciones global utilizando `Snackbar` de `react-native-paper`.
    - Tipos: `success`, `error`, `info`, `warning`.

4.  **Navegación (`src/navigation/AppNavigator.tsx`)**:
    - **Rutas Protegidas**: Se muestra `MainTabNavigator` solo si hay un usuario autenticado.
    - **Flujo de Auth**: Se muestra `AuthNavigator` (Login, Register, ForgotPassword) si no hay usuario.
    - **Splash**: Se muestra mientras se verifica el estado de autenticación inicial.

## Pantallas Implementadas

- **LoginScreen**: Formulario de inicio de sesión, botón de Google, acceso a registro y recuperación, e ingreso como invitado.
- **RegisterScreen**: Formulario de registro con validación de contraseña y confirmación.
- **ForgotPasswordScreen**: Flujo para enviar correo de restablecimiento de contraseña.

## Dependencias

- `@react-native-firebase/auth`: Core de autenticación.
- `@react-native-google-signin/google-signin`: Autenticación con Google.
- `react-native-paper`: Componentes UI (TextInput, Button, Snackbar).

## Configuración Requerida

### Google Sign-In

Para que Google Sign-In funcione, debe configurar el `webClientId` en `src/services/firebase/AuthService.ts`. Obtenga este ID desde la consola de Firebase.

```typescript
GoogleSignin.configure({
  webClientId: 'SU_WEB_CLIENT_ID',
});
```

### Android

Asegúrese de agregar la huella SHA-1 de su clave de firma en la consola de Firebase para permitir la autenticación con Google.

## Pruebas

Se han incluido pruebas unitarias para `AuthContext` en `__tests__/context/AuthContext.test.tsx`.
Ejecutar con: `npm test`
