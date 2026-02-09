# Integración con Servicios de Analytics

## 📊 Servicios Integrados

VTradingAPP utiliza múltiples servicios de analytics y monitoreo:

1. **Firebase Analytics** - Analytics principal con BigQuery export
2. **Firebase Crashlytics** - Crash reporting y error tracking
3. **Microsoft Clarity** - Session recordings y heatmaps
4. **Sentry** - Error monitoring avanzado y performance tracking

---

## 🔥 Firebase Analytics

### Configuración Inicial

**Firebase Console:**

```
1. Ir a: Firebase Console → Tu Proyecto → Analytics
2. Habilitar Google Analytics
3. Configurar User Properties personalizadas:
   - original_anonymous_id (Text)
   - account_linked_at (Text)
   - conversion_method (Text)
```

### User Properties

Las User Properties permiten vincular el UUID anónimo con el Firebase UID:

```typescript
// src/stores/authStore.ts

analyticsService.setUserProperty('original_anonymous_id', 'anon_1738692841_x7k2m9_d4f8b');

analyticsService.setUserProperty('account_linked_at', '2026-02-04T15:30:00Z');

analyticsService.setUserProperty(
  'conversion_method',
  'email', // o 'google', 'apple'
);
```

**¿Por qué User Properties?**

- ✅ Persisten con el usuario para siempre
- ✅ Se exportan a BigQuery automáticamente
- ✅ Se pueden usar en audiences y funnels
- ✅ Aparecen en Firebase Console para cada usuario

### Custom Events

#### Evento: `user_account_linked`

Este es el evento más importante para análisis de conversión:

```typescript
analyticsService.logEvent('user_account_linked', {
  method: 'email', // Método de autenticación
  previous_anonymous_id: 'anon_1738692841_...', // UUID previo
  firebase_uid: 'firebase_ABC123XYZ789def456', // Firebase UID nuevo
  is_new_user: true, // true si registro, false si login
  timestamp: 1738692841000, // Timestamp de conversión
});
```

**Parámetros del evento:**

| Parámetro               | Tipo    | Descripción                                             |
| ----------------------- | ------- | ------------------------------------------------------- |
| `method`                | string  | Método de login: `email`, `google`, `apple`             |
| `previous_anonymous_id` | string  | UUID anónimo previo                                     |
| `firebase_uid`          | string  | Firebase UID asignado                                   |
| `is_new_user`           | boolean | `true` si es registro nuevo, `false` si login existente |
| `timestamp`             | number  | Unix timestamp de la conversión                         |

#### Evento: `onboarding_completed`

```typescript
analyticsService.logEvent('onboarding_completed', {
  user_id: 'anon_1738692841_x7k2m9_d4f8b',
  completed_at: 1738692841000,
});
```

### Consultas en Firebase Console

#### Ver usuarios con migración exitosa

```
1. Firebase Console → Analytics → Events
2. Buscar evento: user_account_linked
3. Ver parámetros: previous_anonymous_id, firebase_uid
```

#### Ver User Properties de un usuario específico

```
1. Firebase Console → Analytics → DebugView (para testing)
2. O Analytics → Users → User Properties
3. Buscar usuario por Firebase UID
4. Verificar: original_anonymous_id, account_linked_at
```

### BigQuery Export

Para análisis avanzado, habilitar BigQuery Export:

```
1. Firebase Console → Project Settings → Integrations
2. Click en BigQuery → Link
3. Seleccionar: "Include advertising identifiers"
4. Confirmar

Nota: Export se activa en ~24 horas
```

**Query Ejemplo - Análisis de Conversión:**

```sql
-- Tasa de conversión: usuarios anónimos que se registran

WITH anonymous_sessions AS (
  SELECT DISTINCT
    user_pseudo_id as uuid,
    MIN(event_timestamp) as first_seen,
    MAX(event_timestamp) as last_seen_anon
  FROM `your-project.analytics_XXXXXX.events_*`
  WHERE user_pseudo_id LIKE 'anon_%'
  GROUP BY user_pseudo_id
),

conversions AS (
  SELECT
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'previous_anonymous_id') as uuid,
    user_id as firebase_uid,
    event_timestamp as conversion_time,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'method') as method,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'is_new_user') as is_new_user
  FROM `your-project.analytics_XXXXXX.events_*`
  WHERE event_name = 'user_account_linked'
)

SELECT
  COUNT(DISTINCT a.uuid) as total_anonymous_users,
  COUNT(DISTINCT c.firebase_uid) as converted_users,
  ROUND(COUNT(DISTINCT c.firebase_uid) / COUNT(DISTINCT a.uuid) * 100, 2) as conversion_rate_pct,
  AVG(TIMESTAMP_DIFF(TIMESTAMP_MICROS(c.conversion_time), TIMESTAMP_MICROS(a.first_seen), HOUR)) as avg_hours_to_convert,
  COUNTIF(c.method = 'email') as email_conversions,
  COUNTIF(c.method = 'google') as google_conversions
FROM anonymous_sessions a
LEFT JOIN conversions c ON a.uuid = c.uuid
```

---

## 🔥 Firebase Crashlytics

### Configuración

Crashlytics ya está configurado en el proyecto. Los cambios necesarios están en `authStore.setUser()`.

### Custom Attributes

```typescript
// src/stores/authStore.ts

import { setAttributes, setUserId } from '@/utils/crashlyticsUtils';

// Al hacer login (después de capturar UUID previo)
setAttributes(crashlytics, {
  original_anonymous_id: previousAnonymousId!,
  conversion_method: loginMethod,
  user_name: user.displayName || '',
  user_email: user.email || '',
  provider: user.providerData[0]?.providerId || '',
});

setUserId(crashlytics, user.uid);
```

### Verificar en Console

```
1. Firebase Console → Crashlytics → Crashes
2. Seleccionar un crash
3. Ver sección "Keys" → Buscar:
   - original_anonymous_id
   - user_email
   - conversion_method
```

**Beneficio:**  
Si un usuario tuvo crashes cuando era anónimo y luego se registra, podemos vincular esos crashes históricos mediante `original_anonymous_id`.

---

## 📊 Microsoft Clarity

### Configuración

Clarity se configura al inicializar la app en `App.tsx`:

```typescript
import Clarity from '@microsoft/clarity-react-native';

useEffect(() => {
  // Inicializar Clarity
  Clarity.initialize('tu-project-id');

  // Configurar userId (UUID anónimo o Firebase UID)
  const user = useAuthStore.getState().user;
  if (user) {
    Clarity.setCustomUserId(user.uid);
  } else {
    const anonymousId = anonymousIdentityService.getAnonymousId();
    Clarity.setCustomUserId(anonymousId);
  }
}, []);
```

### Custom Tags

Clarity permite tags personalizados para vincular sesiones:

```typescript
// src/stores/authStore.ts

// Al hacer login con migración
Clarity.setCustomTag('prev_anon_id', previousAnonymousId!);
Clarity.setCustomTag('conversion_method', loginMethod);
```

### Buscar Sesiones en Clarity

```
1. Clarity Dashboard → Sessions
2. Usar filtro "User ID": firebase_ABC123XYZ789def456
3. Ver Custom Tags para ver: prev_anon_id
```

**Limitación:**  
Clarity no permite vincular automáticamente sesiones por tags. Debes buscar manualmente usando el tag `prev_anon_id`.

---

## 🐛 Sentry

### Configuración

Sentry se inicializa en `App.tsx`:

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'tu-dsn',
  tracesSampleRate: 1.0,
  enableAutoSessionTracking: true,
});
```

### User Context

```typescript
// src/stores/authStore.ts

// Al hacer login con migración
Sentry.setUser({
  id: user.uid,
  email: user.email || undefined,
  username: user.displayName || undefined,
  anonymous_id_legacy: previousAnonymousId!,
});
```

**Campos del User Context:**

| Campo                 | Descripción                        |
| --------------------- | ---------------------------------- |
| `id`                  | Firebase UID (nuevo userId)        |
| `email`               | Email del usuario                  |
| `username`            | Display name                       |
| `anonymous_id_legacy` | UUID anónimo previo (custom field) |

### Verificar en Sentry

```
1. Sentry Dashboard → Issues
2. Seleccionar un issue
3. Ver sección "User" → Buscar:
   - id: firebase_ABC123XYZ789def456
   - anonymous_id_legacy: anon_1738692841_...
```

### Buscar Errores Históricos

```javascript
// Query en Sentry
user.anonymous_id_legacy:"anon_1738692841_x7k2m9_d4f8b"

// Ver todos los errores que tuvo ese UUID antes de registrarse
```

---

## 📈 Dashboard de Métricas Sugerido

### Firebase Analytics Dashboard

Crear un dashboard personalizado con estas métricas:

#### Widget 1: Conversión de Usuarios Anónimos

```
Métrica: user_account_linked (Event count)
Periodo: Últimos 30 días
Segmentación: Por method (email, google)
```

#### Widget 2: Usuarios Activos por Tipo

```
Métrica: Active Users
Segmentación:
  - Con user property: original_anonymous_id (converted)
  - Sin user property: original_anonymous_id (never converted)
```

#### Widget 3: Tiempo Promedio a Conversión

```
Métrica: Custom calculation
  - user_account_linked.timestamp - first_open.timestamp
Visualización: Histogram
```

#### Widget 4: Tasa de Conversión por Método

```
Métrica: Conversion rate
Segmentación: method (email vs google)
```

---

## 🔍 Debugging Analytics

### Verificar Eventos en Tiempo Real

#### Firebase Analytics

```bash
# 1. Habilitar Debug Mode en dispositivo
adb shell setprop debug.firebase.analytics.app com.vtradingapp

# 2. Ver eventos en Firebase Console
Firebase Console → Analytics → DebugView

# 3. Realizar acción en app (ej. registro)

# 4. Verificar evento user_account_linked aparece con parámetros correctos
```

#### Clarity

```bash
# 1. Instalar app en modo desarrollo
npm run android

# 2. Navegar a Clarity Dashboard → Recordings

# 3. Buscar sesión actual por userId

# 4. Verificar que Custom Tags aparecen correctamente
```

#### Sentry

```typescript
// Forzar error de prueba para verificar User Context
import * as Sentry from '@sentry/react-native';

// En cualquier pantalla después de login
Sentry.captureException(new Error('Test error after login'));

// Verificar en Sentry Dashboard que aparece:
// - User id: firebase_ABC...
// - anonymous_id_legacy: anon_1738...
```

---

## 📊 Reportes Recomendados

### Reporte Semanal de Conversión

```sql
-- BigQuery Query

SELECT
  DATE(TIMESTAMP_MICROS(event_timestamp)) as conversion_date,
  COUNT(DISTINCT user_id) as conversions,
  COUNTIF((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'is_new_user') = 1) as new_registrations,
  COUNTIF((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'is_new_user') = 0) as existing_logins,
  COUNTIF((SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'method') = 'email') as email_conversions,
  COUNTIF((SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'method') = 'google') as google_conversions
FROM `your-project.analytics_XXXXXX.events_*`
WHERE event_name = 'user_account_linked'
  AND _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
                       AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY conversion_date
ORDER BY conversion_date DESC
```

### Reporte de Usuarios Nunca Convertidos

```sql
-- Usuarios que nunca se registraron después de 30+ días

SELECT
  user_pseudo_id as anonymous_id,
  MIN(event_timestamp) as first_seen,
  MAX(event_timestamp) as last_seen,
  COUNT(DISTINCT event_name) as events_count,
  TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), TIMESTAMP_MICROS(MAX(event_timestamp)), DAY) as days_since_last_activity
FROM `your-project.analytics_XXXXXX.events_*`
WHERE user_pseudo_id LIKE 'anon_%'
  AND user_pseudo_id NOT IN (
    SELECT DISTINCT (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'previous_anonymous_id')
    FROM `your-project.analytics_XXXXXX.events_*`
    WHERE event_name = 'user_account_linked'
  )
GROUP BY user_pseudo_id
HAVING TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), TIMESTAMP_MICROS(MAX(event_timestamp)), DAY) >= 30
ORDER BY last_seen DESC
LIMIT 1000
```

---

## ⚙️ Configuración de Privacidad

### GDPR / CCPA Compliance

Si el usuario rechaza analytics:

```typescript
// src/services/AnalyticsService.ts

import analytics from '@react-native-firebase/analytics';

export const disableAnalytics = async () => {
  await analytics().setAnalyticsCollectionEnabled(false);

  // Limpiar userId
  await analytics().setUserId(null);

  // Clarity
  Clarity.setCustomUserId('');

  // Sentry
  Sentry.setUser(null);
};

export const enableAnalytics = async () => {
  await analytics().setAnalyticsCollectionEnabled(true);

  // Re-establecer userId
  const user = useAuthStore.getState().user;
  if (user) {
    await analytics().setUserId(user.uid);
  } else {
    const anonymousId = anonymousIdentityService.getAnonymousId();
    await analytics().setUserId(anonymousId);
  }
};
```

### Solicitud de Eliminación de Datos

```typescript
// src/services/DataDeletionService.ts

export const requestDataDeletion = async (userId: string) => {
  // 1. Eliminar UUID de MMKV
  storageService.deleteKey('anonymous_user_id');
  storageService.deleteKey('uuid_to_firebase_map');

  // 2. Eliminar cuenta de Firebase Auth
  const auth = getAuth();
  await auth.currentUser?.delete();

  // 3. Limpiar analytics
  await analytics().setUserId(null);
  Sentry.setUser(null);

  // 4. Enviar solicitud al backend para eliminar:
  // - User Properties en Firebase
  // - Datos en BigQuery (requiere proceso manual)
  // - Sesiones de Clarity (requiere soporte de Clarity)

  SafeLogger.info('[DataDeletion] User data deletion requested');
};
```

---

## 🎓 Mejores Prácticas

### DO ✅

- ✅ Siempre verificar que `user_account_linked` se dispara en Firebase DebugView antes de producción
- ✅ Documentar todos los custom events y parameters en Firebase Console
- ✅ Configurar BigQuery Export para análisis avanzado
- ✅ Crear dashboards automáticos para monitorear conversión
- ✅ Revisar Sentry semanalmente para errores no esperados

### DON'T ❌

- ❌ No enviar PII (emails, nombres) como parámetros de eventos
- ❌ No confiar solo en Clarity para vincular sesiones (usar Firebase Analytics principalmente)
- ❌ No olvidar User Properties - son clave para mantener el historial vinculado
- ❌ No ignorar errores de Crashlytics sin verificar `original_anonymous_id`
- ❌ No configurar analytics sin consentimiento del usuario (GDPR)

---

_Última actualización: 4 de Febrero, 2026_
