# Integración de Firebase

VTradingAPP utiliza Firebase como núcleo de su infraestructura "Serverless" y servicios de observabilidad.

## Índice de Servicios

| Servicio            | Propósito                                    | Documentación Detallada                                |
| :------------------ | :------------------------------------------- | :----------------------------------------------------- |
| **Authentication**  | Registro, Google Sign-In, Anonimato.         | [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md)     |
| **Cloud Messaging** | Notificaciones Push y Alertas Locales.       | [NOTIFICATIONS_GUIDE.md](./NOTIFICATIONS_GUIDE.md)     |
| **Remote Config**   | Feature Flags y Actualización Forzada.       | [REMOTE_CONFIG.md](./REMOTE_CONFIG.md)                 |
| **App Check**       | Protección de la API contra bots/emuladores. | [API_GUIDE.md](./API_GUIDE.md)                         |
| **Analytics**       | Eventos y Comportamiento de Usuario.         | [ANALYTICS_AND_PRIVACY.md](./ANALYTICS_AND_PRIVACY.md) |
| **Performance**     | Monitoreo de latencia y red.                 | [API_GUIDE.md](./API_GUIDE.md)                         |
| **Crashlytics**     | Reporte automático de errores.               | [STANDARDS_AND_QUALITY.md](./STANDARDS_AND_QUALITY.md) |

---

## Configuración Global

### Archivo `firebase.json`

Ubicado en la raíz, controla la inicialización automática de cada módulo:

```json
{
  "react-native": {
    "perf_auto_collection_enabled": true,
    "analytics_auto_collection_enabled": true,
    "messaging_auto_init_enabled": true,
    "crashlytics_auto_collection_enabled": true
  }
}
```

### Regla de Desarrollo: API Modular (v22+)

No utilice las APIs antiguas basadas en namespace (ej: `auth()`). Use siempre el enfoque modular:

```typescript
import { getAuth, signInAnonymously } from '@react-native-firebase/auth';
const auth = getAuth();
await signInAnonymously(auth);
```
