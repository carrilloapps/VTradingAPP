# Integración de Firebase

Este documento detalla la integración de los servicios de Firebase en la aplicación VTradingAPP.

## Servicios Integrados

### 1. Cloud Messaging (FCM)

Se ha implementado el servicio de mensajería en la nube para notificaciones push.

- **Configuración**: Se utilizan los archivos `google-services.json` (Android) y `GoogleService-Info.plist` (iOS).
- **Servicio**: `src/services/firebase/FCMService.ts` encapsula la lógica.
- **Funcionalidades**:
    - Solicitud de permisos (iOS y Android 13+).
    - Obtención del token FCM.
    - Manejo de mensajes en primer plano (`onMessage`).
    - Manejo de mensajes en segundo plano/quit (`setBackgroundMessageHandler` en `index.js`).
    - Manejo de apertura de notificaciones (`onNotificationOpenedApp`, `getInitialNotification`).

### 2. Authentication

Se ha configurado la autenticación de Firebase.

- **Servicio**: `src/services/firebase/AuthService.ts`.
- **Funcionalidades**:
    - Registro e inicio de sesión con correo y contraseña.
    - Cierre de sesión.
    - Listener de estado de autenticación (`onAuthStateChanged`).
    - Recuperación de contraseña.

### 4. Analytics

Se ha integrado el seguimiento de eventos y navegación.

- **Servicio**: `src/services/firebase/AnalyticsService.ts`.
- **Integración**: `AppNavigator.tsx` registra automáticamente las vistas de pantalla.
- **Uso**: `analyticsService.logEvent('event_name', { param: 'value' })`.

### 5. App Check

Protección de la API `https://vt.isapp.dev/`.

- **Servicio**: `src/services/firebase/AppCheckService.ts`.
- **ApiClient**: `src/services/ApiClient.ts` incluye el token en el header `X-Firebase-AppCheck`.
- **Configuración**: Debug provider habilitado en desarrollo.

### 6. Remote Config

Gestión de configuración remota.

- **Servicio**: `src/services/firebase/RemoteConfigService.ts`.
- **Valores por defecto**: Definidos en el servicio.
- **Uso**: `remoteConfigService.getString('key')`.

### 7. Performance Monitoring

Monitoreo de rendimiento de red y trazas personalizadas.

- **Servicio**: `src/services/firebase/PerformanceService.ts`.
- **Integración**: Automática para red nativa. Trazas manuales en `CurrencyService.ts`.

### 8. App Distribution

Verificación de actualizaciones para testers.

- **Servicio**: `src/services/firebase/AppDistributionService.ts`.
- **Uso**: Se verifica al iniciar la app si hay nuevas versiones (solo release).

## Configuración Técnica

### Android

- **build.gradle (Project)**:
    - `com.google.gms:google-services`
    - `com.google.firebase:firebase-perf-plugin`
- **build.gradle (App)**:
    - `com.google.gms.google-services`
    - `com.google.firebase.firebase-perf`
- **Dependencias**:
    - `@react-native-firebase/app`
    - `@react-native-firebase/messaging`
    - `@react-native-firebase/auth`
    - `@react-native-firebase/in-app-messaging`
    - `@react-native-firebase/analytics`
    - `@react-native-firebase/app-check`
    - `@react-native-firebase/remote-config`
    - `@react-native-firebase/perf`
    - `@react-native-firebase/app-distribution`

### iOS

- Se requiere ejecutar `pod install` en la carpeta `ios` para vincular las dependencias nativas.
- Asegúrese de que `GoogleService-Info.plist` esté incluido en el proyecto de Xcode.

## Uso en la Aplicación

La inicialización de los servicios ocurre en `App.tsx`:

```typescript
useEffect(() => {
  const initializeFirebase = async () => {
    await appCheckService.initialize();
    await remoteConfigService.initialize();
    await inAppMessagingService.initialize();
    await appDistributionService.checkForUpdate();
    
    const hasPermission = await fcmService.requestUserPermission();
    if (hasPermission) {
      await fcmService.getFCMToken();
    }
  };
  initializeFirebase();
  // ... listeners
}, []);
```

El handler de segundo plano se registra en `index.js`.

## Pruebas

Se han incluido pruebas unitarias para `FCMService` en `__tests__/services/FCMService.test.ts`.

Para ejecutar las pruebas:

```bash
npm test __tests__/services/FCMService.test.ts
```
