# Analytics y Privacidad - VTrading

Este documento detalla la infraestructura de observabilidad, análisis de datos y políticas de privacidad implementadas en VTrading, consolidando la información de paquetes, implementación y uso de datos.

## 1. Stack Tecnológico
    
VTrading utiliza un enfoque multi-nivel para asegurar la calidad del servicio y entender el comportamiento del usuario respetando su privacidad.

### 1.1 Paquetes de Análisis y Observabilidad
| Paquete | Versión | Propósito | Implementación |
| :--- | :--- | :--- | :--- |
| `@react-native-firebase/analytics` | `~23.8.3` | Seguimiento de eventos y comportamiento. | `AnalyticsService.ts` |
| `@microsoft/react-native-clarity` | `~4.5.3` | Grabación de sesiones y mapas de calor (UX). | `AnalyticsService.ts` |
| `@sentry/react-native` | `~7.9.0` | Monitoreo de errores y rendimiento técnico. | `ObservabilityService.ts` |
| `@react-native-firebase/crashlytics` | `~23.8.3` | Reporte de fallos fatales en tiempo real. | `ObservabilityService.ts` |
| `@react-native-firebase/perf` | `~23.8.3` | Métricas de red y trazas de ejecución. | `PerformanceService.ts` |
| `react-native-google-mobile-ads` | `^16.0.2` | Entrega de anuncios y monetización. | Configuración nativa |

### 1.2 Paquetes de Privacidad y Seguridad
| Paquete | Versión | Propósito | Implementación |
| :--- | :--- | :--- | :--- |
| `@react-native-firebase/app-check` | `~23.8.3` | Protección de APIs contra bots y abuso. | `AppCheckService.ts` |
| `react-native-device-info` | `~15.0.1` | Telemetría técnica y datos del dispositivo. | Varios |
| `react-native-config` | `~1.6.1` | Gestión segura de llaves y secretos. | `AppConfig.ts` |
| `react-native-mmkv` | `~4.1.2` | Almacenamiento local persistente (Caché). | `StorageService.ts` |

---

## 2. Arquitectura de Implementación

### 2.1 Observabilidad Centralizada (`ObservabilityService.ts`)
El servicio de observabilidad coordina **Sentry** y **Crashlytics**.
- **Sanitización**: Antes de enviar cualquier log o error, los datos pasan por `SafeLogger` para enmascarar llaves sensibles.
- **Filtrado Inteligente**: Se ignoran errores de red transitorios (ej. "Network request failed") para evitar ruido excesivo en los dashboards.

### 2.2 Análisis Dual y Espejado (`AnalyticsService.ts`)
Implementamos una estrategia de espejo donde cada evento significativo se envía a múltiples destinos:
- **Firebase Analytics**: Para KPIs de negocio y embudos de conversión.
- **Clarity**: Los eventos de GA se replican en Clarity como "Custom Events" para permitir filtrar grabaciones de sesión por acciones específicas.
- **Sentry Breadcrumbs**: Los eventos se añaden como migas de pan para facilitar la depuración de errores siguiendo los pasos previos del usuario.

### 2.3 Seguridad de Datos en Tránsito (`AppCheckService.ts`)
La comunicación con el backend está protegida por **App Check**:
- **Android**: Implementa **Play Integrity**.
- **iOS**: Implementa **App Attest** con fallback automático a Device Check.
- **ApiClient**: Inyecta automáticamente el token `X-Firebase-AppCheck` en las cabeceras de las peticiones.

### 2.4 Publicidad y Tracking (Android ID)
La aplicación utiliza `react-native-google-mobile-ads` para la gestión de anuncios.
- **Permisos**: Se requiere el permiso `android.permission.INTERNET` y `com.google.android.gms.permission.AD_ID` en Android para el identificador de publicidad.
- **Uso**: El ID de publicidad se utiliza exclusivamente para la personalización de anuncios (si el usuario lo permite) y la atribución de conversiones en Analytics.

---

## 3. Diccionario Detallado de Eventos (Existentes)

Los eventos se definen en la constante `ANALYTICS_EVENTS` para asegurar consistencia:

| Categoría | Evento | Parámetros Comunes |
| :--- | :--- | :--- |
| **Navegación** | `screen_view` | `screen_name`, `screen_class` |
| **Sesión** | `v_session_start` / `v_session_end` | `duration_ms`, `duration_minutes` |
| **Autenticación** | `login`, `sign_up`, `login_attempt` | `method` (Google, Email) |
| **Monedas** | `calculator_add_currency`, `calculator_set_base` | `currency`, `symbol` |
| **Alertas** | `create_alert`, `toggle_alert`, `delete_alert` | `symbol`, `action` |
| **Interacción** | `button_click`, `card_tap`, `filter_applied` | `screen_name`, `item_id` |
| **Notificaciones** | `notification_received_foreground`, `notification_opened` | `message_id`, `topic` |
| **Técnico** | `api_call`, `data_refresh`, `error` | `endpoint`, `success`, `errorCode` |

---

## 4. Política de Tratamiento y Privacidad

### 4.1 Protección de Datos Sensibles (`SafeLogger.ts`)
VTradingAPP utiliza una lista negra de campos sensibles para evitar filtraciones accidentales a los logs de la consola y servicios externos.
- **Claves Enmascaradas**: `password`, `secret`, `apiKey`, `accessToken`, `idToken`, `email`, `phone`.
- **Formato de Máscara**: Los valores se transforman en `ABCD...WXYZ` (solo los primeros y últimos 4 caracteres son visibles) o `****`.

### 4.2 Medidas de Cumplimiento (GDPR/CCPA)
- **Anonimización Forzada**: Se utiliza `setAnalyticsCollectionEnabled(false)` si el usuario no ha dado consentimiento o deshabilita la opción.
- **Anonymize IP**: Configuración activa en la inicialización de Firebase.
- **Tratamiento de Clarity**: El SDK está configurado para enmascarar automáticamente cualquier campo de entrada detectado, protegiendo lo que el usuario escribe.

### 4.3 Almacenamiento Seguro
- Los datos de sesión y caché se guardan en **MMKV**, que reside en el almacenamiento privado de la aplicación, inaccesible por otras aplicaciones del dispositivo.

### 4.4 Enlaces Legales y Recursos
Para más detalle sobre el tratamiento de datos y términos legales, consulte:
- [Política de Privacidad](https://vtrading.app/privacy)
- [Términos de Uso](https://vtrading.app/terms)
- [Política de Cookies](https://vtrading.app/cookies)
- [Licencias de Código Abierto](https://vtrading.app/licenses)

---

## 5. Guía de Uso para Desarrolladores

### Registrar un Evento
```typescript
import { analyticsService, ANALYTICS_EVENTS } from '../services/firebase/AnalyticsService';

// Registro simple
analyticsService.logEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
  button_name: 'refresh_rates',
  screen: 'HomeScreen'
});
```

### Reportar Error con Contexto Seguro
```typescript
import { observabilityService } from '../services/ObservabilityService';

try {
  // Operación de red...
} catch (error) {
  observabilityService.captureError(error, { 
    context: 'AuthService.login',
    email: 'user@example.com' // SafeLogger lo enmascarará automáticamente
  });
}
```
