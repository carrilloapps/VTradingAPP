# Flujo de Migración UUID → Firebase UID

## 📋 Descripción General

Este documento describe en detalle el proceso de migración automática que vincula el UUID anónimo de un usuario con su Firebase UID cuando se registra o hace login.

---

## 🎯 Objetivos del Flujo

1. **Capturar UUID previo** antes de actualizar al Firebase UID
2. **Vincular ambos identificadores** mediante User Properties y Attributes
3. **Mantener historial completo** de analytics pre y post autenticación
4. **Enviar evento de conversión** para métricas de negocio
5. **Actualizar todos los servicios** con el nuevo userId

---

## 🔄 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESTADO: USUARIO ANÓNIMO                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MMKV Storage:                                                  │
│  └─ anonymous_user_id: "anon_1738692841_x7k2m9_d4f8b"          │
│                                                                  │
│  Analytics Services:                                            │
│  ├─ Firebase Analytics userId: "anon_1738692841_x7k2m9_d4f8b"  │
│  ├─ Crashlytics userId:        "anon_1738692841_x7k2m9_d4f8b"  │
│  ├─ Clarity userId:            "anon_1738692841_x7k2m9_d4f8b"  │
│  └─ Sentry userId:             "anon_1738692841_x7k2m9_d4f8b"  │
│                                                                  │
│  AuthStore State:                                               │
│  ├─ user: null                                                  │
│  └─ isLoading: false                                            │
│                                                                  │
│  UI State:                                                      │
│  ├─ isPremium: false                                            │
│  └─ UserProfileCard: muestra "FREE" + botón "Registrarse"      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Usuario decide registrarse
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   TRIGGER: Usuario hace click                    │
│                   "Iniciar Sesión / Registrarse"                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│             PASO 1: Navegación a LoginScreen                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SettingsScreen.handleRegister()                                │
│  └─> navigation.navigate('Auth')                                │
│                                                                  │
│  ✅ Usuario ve formulario de login/registro                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│             PASO 2: Usuario completa formulario                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RegisterScreen:                                                │
│  ├─ Email: "jose@example.com"                                   │
│  └─ Password: "******"                                          │
│                                                                  │
│  O LoginScreen (Google):                                        │
│  └─ Click "Continuar con Google"                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│        PASO 3: Llamada a authStore.signUp() o signIn()          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  authStore.signUp(email, password, showToast)                   │
│  └─> authService.signUpWithEmail(email, password)               │
│       └─> Firebase Auth: createUserWithEmailAndPassword()       │
│            └─> Retorna: FirebaseAuthTypes.UserCredential        │
│                                                                  │
│  ✅ Firebase genera UID: "firebase_ABC123XYZ789def456"          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│        PASO 4: Firebase onAuthStateChanged se dispara           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  authService.onAuthStateChanged(user => {                       │
│    useAuthStore.getState().setUser(user);                       │
│  });                                                             │
│                                                                  │
│  ✅ Se llama automáticamente a authStore.setUser(user)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│      ⚡ PASO 5: MIGRACIÓN AUTOMÁTICA (authStore.setUser)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  setUser: user => {                                             │
│    if (user) {                                                  │
│                                                                  │
│      // 5.1 CAPTURAR UUID PREVIO                                │
│      const previousAnonymousId =                                │
│        storageService.getString('anonymous_user_id');           │
│      // "anon_1738692841_x7k2m9_d4f8b"                          │
│                                                                  │
│      // 5.2 VERIFICAR SI ES MIGRACIÓN                           │
│      const hasAnonymousHistory =                                │
│        previousAnonymousId?.startsWith('anon_');                │
│      // true                                                    │
│                                                                  │
│      if (hasAnonymousHistory) {                                 │
│        // 🎯 PROCESO DE VINCULACIÓN                             │
│      }                                                           │
│                                                                  │
│      // 5.3 ACTUALIZAR userId EN SERVICIOS                      │
│      analyticsService.setUserId(user.uid);                      │
│      crashlytics.setUserId(user.uid);                           │
│      clarity.setUserId(user.uid);                               │
│      sentry.setUserId(user.uid);                                │
│    }                                                             │
│    set({ user });                                               │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│   PASO 6: Vinculación en Firebase Analytics (User Property)     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  analyticsService.setUserProperty(                              │
│    'original_anonymous_id',                                     │
│    'anon_1738692841_x7k2m9_d4f8b'                              │
│  );                                                              │
│                                                                  │
│  analyticsService.setUserProperty(                              │
│    'account_linked_at',                                         │
│    '2026-02-04T15:30:00Z'                                       │
│  );                                                              │
│                                                                  │
│  ✅ Firebase guarda metadata de vinculación                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│      PASO 7: Evento de Conversión en Firebase Analytics         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  analyticsService.logEvent('user_account_linked', {             │
│    method: 'email',                    // o 'google', 'apple'   │
│    previous_anonymous_id: 'anon_1738692841_x7k2m9_d4f8b',      │
│    firebase_uid: 'firebase_ABC123XYZ789def456',                 │
│    is_new_user: true,                  // true si registro      │
│  });                                                             │
│                                                                  │
│  ✅ Evento registrado para análisis de conversión               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│      PASO 8: Vinculación en Crashlytics (Custom Attributes)     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  crashlytics.setAttribute(                                      │
│    'original_anonymous_id',                                     │
│    'anon_1738692841_x7k2m9_d4f8b'                              │
│  );                                                              │
│                                                                  │
│  crashlytics.setAttribute('user_email', 'jose@example.com');    │
│  crashlytics.setAttribute('user_name', 'José Carrillo');        │
│  crashlytics.setAttribute('provider', 'password');              │
│                                                                  │
│  ✅ Crashlytics puede vincular crashes pre y post login         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          PASO 9: Vinculación en Clarity (Custom Tag)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Clarity.setCustomTag(                                          │
│    'prev_anon_id',                                              │
│    'anon_1738692841_x7k2m9_d4f8b'                              │
│  );                                                              │
│                                                                  │
│  ⚠️ Clarity solo mantiene userId actual, pero tag permite buscar│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          PASO 10: Vinculación en Sentry (User Context)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Sentry.setUser({                                               │
│    id: 'firebase_ABC123XYZ789def456',                           │
│    email: 'jose@example.com',                                   │
│    username: 'José Carrillo',                                   │
│    anonymous_id_legacy: 'anon_1738692841_x7k2m9_d4f8b',        │
│  });                                                             │
│                                                                  │
│  ✅ Sentry vincula errores pasados con usuario registrado       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│    PASO 11: Guardar mapeo local en MMKV (opcional pero útil)    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  storageService.setString('uuid_to_firebase_map', JSON.stringify({
│    uuid: 'anon_1738692841_x7k2m9_d4f8b',                        │
│    firebaseUid: 'firebase_ABC123XYZ789def456',                  │
│    linkedAt: 1738692841000,                                     │
│    loginMethod: 'password',                                     │
│  }));                                                            │
│                                                                  │
│  ✅ Útil para debugging y consultas locales                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 ESTADO FINAL: USUARIO AUTENTICADO                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MMKV Storage:                                                  │
│  ├─ anonymous_user_id: "anon_1738692841_x7k2m9_d4f8b" (mantiene)│
│  └─ uuid_to_firebase_map: { uuid, firebaseUid, ... }           │
│                                                                  │
│  Analytics Services:                                            │
│  ├─ Firebase Analytics userId: "firebase_ABC123XYZ789def456"   │
│  │  └─ User Property: original_anonymous_id = "anon_1738..."   │
│  ├─ Crashlytics userId: "firebase_ABC123XYZ789def456"          │
│  │  └─ Attribute: original_anonymous_id = "anon_1738..."       │
│  ├─ Clarity userId: "firebase_ABC123XYZ789def456"              │
│  │  └─ Tag: prev_anon_id = "anon_1738..."                      │
│  └─ Sentry userId: "firebase_ABC123XYZ789def456"               │
│     └─ Context: anonymous_id_legacy = "anon_1738..."           │
│                                                                  │
│  AuthStore State:                                               │
│  ├─ user: FirebaseUser {                                        │
│  │    uid: "firebase_ABC123XYZ789def456",                       │
│  │    email: "jose@example.com",                                │
│  │    displayName: null                                         │
│  │  }                                                            │
│  └─ isLoading: false                                            │
│                                                                  │
│  UI State:                                                      │
│  ├─ isPremium: true (user && !user.isAnonymous)                │
│  └─ UserProfileCard: muestra "PRO" + email + avatar            │
│                                                                  │
│  ✅ MIGRACIÓN COMPLETADA CON ÉXITO                              │
│  ✅ Historial completo vinculado                                │
│  ✅ Usuario puede usar features premium                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Implementación en Código

### authStore.ts - Función setUser Completa

```typescript
// src/stores/authStore.ts

setUser: user => {
  const crashlytics = getCrashlytics();

  if (user) {
    // ═══════════════════════════════════════════════════════════
    // FASE 1: CAPTURAR ESTADO PREVIO
    // ═══════════════════════════════════════════════════════════

    const previousAnonymousId = storageService.getString('anonymous_user_id');
    const hasAnonymousHistory = previousAnonymousId?.startsWith('anon_');

    SafeLogger.info('[Auth] Setting user:', {
      uid: user.uid,
      email: user.email,
      hasAnonymousHistory,
      previousAnonymousId: previousAnonymousId?.substring(0, 20) + '...',
    });

    // ═══════════════════════════════════════════════════════════
    // FASE 2: MIGRACIÓN (si existe UUID previo)
    // ═══════════════════════════════════════════════════════════

    if (hasAnonymousHistory) {
      SafeLogger.info('[Auth] Migrating anonymous user to authenticated');

      // 2.1 Metadata del login
      const loginMethod = user.providerData[0]?.providerId || 'unknown';
      const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;

      // 2.2 Firebase Analytics - User Properties
      analyticsService.setUserProperty(
        'original_anonymous_id',
        previousAnonymousId!
      );
      analyticsService.setUserProperty(
        'account_linked_at',
        new Date().toISOString()
      );
      analyticsService.setUserProperty(
        'conversion_method',
        loginMethod.replace('.com', '')
      );

      // 2.3 Firebase Analytics - Evento de conversión
      analyticsService.logEvent('user_account_linked', {
        method: loginMethod.replace('.com', ''),
        previous_anonymous_id: previousAnonymousId!,
        firebase_uid: user.uid,
        is_new_user: isNewUser,
        timestamp: Date.now(),
      });

      SafeLogger.info('[Auth] Conversion event logged:', {
        method: loginMethod,
        isNewUser,
      });

      // 2.4 Crashlytics - Custom Attributes
      setAttributes(crashlytics, {
        original_anonymous_id: previousAnonymousId!,
        conversion_method: loginMethod,
      });

      // 2.5 Clarity - Custom Tag
      Clarity.setCustomTag('prev_anon_id', previousAnonymousId!);

      // 2.6 Sentry - User Context
      Sentry.setUser({
        id: user.uid,
        email: user.email || undefined,
        username: user.displayName || undefined,
        anonymous_id_legacy: previousAnonymousId!,
      });

      // 2.7 Guardar mapeo local
      try {
        const mapping = {
          uuid: previousAnonymousId,
          firebaseUid: user.uid,
          linkedAt: Date.now(),
          loginMethod,
          isNewUser,
        };
        storageService.setString(
          'uuid_to_firebase_map',
          JSON.stringify(mapping)
        );

        SafeLogger.info('[Auth] Migration mapping saved to MMKV');
      } catch (error) {
        SafeLogger.error('[Auth] Failed to save mapping:', error);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // FASE 3: ACTUALIZAR userId EN TODOS LOS SERVICIOS
    // ═══════════════════════════════════════════════════════════

    // Firebase Analytics
    analyticsService.setUserId(user.uid);

    // Crashlytics
    setUserId(crashlytics, user.uid);
    setAttributes(crashlytics, {
      user_name: user.displayName || '',
      user_email: user.email || '',
      provider: user.providerData[0]?.providerId || '',
    });

    // Clarity
    Clarity.setCustomUserId(user.uid);

    // Sentry (si no se hizo en migración)
    if (!hasAnonymousHistory) {
      Sentry.setUser({
        id: user.uid,
        email: user.email || undefined,
        username: user.displayName || undefined,
      });
    }

    SafeLogger.info('[Auth] User ID updated in all services');

  } else {
    // ═══════════════════════════════════════════════════════════
    // LOGOUT: Limpiar y regenerar UUID
    // ═══════════════════════════════════════════════════════════

    SafeLogger.info('[Auth] Clearing user (logout)');

    // Limpiar servicios
    setUserId(crashlytics, '');
    setAttributes(crashlytics, { user_name: '', user_email: '' });
    analyticsService.setUserId(null);
    Sentry.setUser(null);

    // Regenerar UUID anónimo
    const newAnonymousId = anonymousIdentityService.resetAnonymousId();
    analyticsService.setUserId(newAnonymousId);
    Clarity.setCustomUserId(newAnonymousId);

    SafeLogger.info('[Auth] New anonymous session started:', newAnonymousId);
  }

  set({ user });
},
```

---

## 📊 Verificación del Flujo

### Cómo Verificar que la Migración Funcionó

#### 1. Firebase Analytics Console

```
Ruta: Analytics → Users → User Properties

Buscar usuario por Firebase UID:
  userId: firebase_ABC123XYZ789def456

Verificar User Properties:
  ✅ original_anonymous_id: "anon_1738692841_x7k2m9_d4f8b"
  ✅ account_linked_at: "2026-02-04T15:30:00Z"
  ✅ conversion_method: "email" (o "google")
```

#### 2. Firebase Analytics - Eventos

```
Ruta: Analytics → Events → user_account_linked

Verificar evento registrado:
  event_name: user_account_linked
  user_id: firebase_ABC123XYZ789def456
  params:
    ✅ method: "email"
    ✅ previous_anonymous_id: "anon_1738692841_x7k2m9_d4f8b"
    ✅ firebase_uid: "firebase_ABC123XYZ789def456"
    ✅ is_new_user: true
```

#### 3. Firebase Crashlytics Console

```
Ruta: Crashlytics → Crashes → Select User

Buscar usuario:
  User ID: firebase_ABC123XYZ789def456

Verificar Custom Keys:
  ✅ original_anonymous_id: "anon_1738692841_x7k2m9_d4f8b"
  ✅ user_email: "jose@example.com"
  ✅ conversion_method: "email"
```

#### 4. Clarity Dashboard

```
Buscar sesión por userId:
  firebase_ABC123XYZ789def456

Verificar Custom Tags:
  ✅ prev_anon_id: "anon_1738692841_x7k2m9_d4f8b"
```

#### 5. Sentry Dashboard

```
Buscar eventos del usuario:
  User ID: firebase_ABC123XYZ789def456

Verificar User Context:
  ✅ id: "firebase_ABC123XYZ789def456"
  ✅ email: "jose@example.com"
  ✅ anonymous_id_legacy: "anon_1738692841_x7k2m9_d4f8b"
```

#### 6. MMKV Local (Debugging)

```typescript
// En consola de desarrollo
import { storageService } from '@/services/StorageService';

// Ver UUID anónimo (se mantiene)
console.log(storageService.getString('anonymous_user_id'));
// "anon_1738692841_x7k2m9_d4f8b"

// Ver mapeo UUID → Firebase UID
const mapping = JSON.parse(storageService.getString('uuid_to_firebase_map') || '{}');
console.log(mapping);
// {
//   uuid: "anon_1738692841_x7k2m9_d4f8b",
//   firebaseUid: "firebase_ABC123XYZ789def456",
//   linkedAt: 1738692841000,
//   loginMethod: "password",
//   isNewUser: true
// }
```

---

## 🧪 Testing del Flujo

### Test E2E Completo

```typescript
// __tests__/e2e/auth-migration.test.ts

describe('Auth Migration Flow', () => {
  it('debe vincular UUID anónimo con Firebase UID al registrarse', async () => {
    // 1. Usuario inicia como anónimo
    const { getByText, getByTestId } = render(<App />);

    await waitFor(() => {
      expect(getByText('Bienvenido/a')).toBeTruthy();
    });

    // Completar onboarding
    fireEvent.press(getByText('Siguiente'));
    // ... completar onboarding

    // 2. Verificar UUID anónimo generado
    const anonymousId = anonymousIdentityService.getAnonymousId();
    expect(anonymousId).toMatch(/^anon_/);

    // 3. Navegar a Settings
    fireEvent.press(getByTestId('settings-tab'));

    // 4. Click en "Registrarse"
    fireEvent.press(getByText('Registrarse gratis'));

    // 5. Completar formulario de registro
    fireEvent.changeText(
      getByTestId('email-input'),
      'test@example.com'
    );
    fireEvent.changeText(
      getByTestId('password-input'),
      'password123'
    );
    fireEvent.press(getByText('Crear cuenta'));

    // 6. Esperar auth exitoso
    await waitFor(() => {
      const user = useAuthStore.getState().user;
      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
    }, { timeout: 5000 });

    // 7. Verificar migración
    const user = useAuthStore.getState().user!;

    // Verificar que analytics tiene el Firebase UID
    expect(analyticsService.setUserId).toHaveBeenCalledWith(user.uid);

    // Verificar que se guardó User Property
    expect(analyticsService.setUserProperty).toHaveBeenCalledWith(
      'original_anonymous_id',
      anonymousId
    );

    // Verificar evento de conversión
    expect(analyticsService.logEvent).toHaveBeenCalledWith(
      'user_account_linked',
      expect.objectContaining({
        previous_anonymous_id: anonymousId,
        firebase_uid: user.uid,
      })
    );

    // Verificar mapeo en MMKV
    const mapping = JSON.parse(
      storageService.getString('uuid_to_firebase_map') || '{}'
    );
    expect(mapping.uuid).toBe(anonymousId);
    expect(mapping.firebaseUid).toBe(user.uid);
  });
});
```

---

## ⚠️ Casos Edge y Manejo de Errores

### Caso 1: Registro falla después de capturar UUID

```typescript
// El UUID no se debe limpiar si el registro falla
try {
  await authService.signUpWithEmail(email, password);
} catch (error) {
  // UUID se mantiene sin cambios
  // Usuario puede reintentar sin perder historial
  SafeLogger.error('[Auth] Registration failed, UUID preserved');
}
```

### Caso 2: Usuario ya tenía cuenta (Login, no registro)

```typescript
// La migración funciona igual
// is_new_user será false en el evento

const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
// false - usuario existente

analyticsService.logEvent('user_account_linked', {
  // ...
  is_new_user: false, // ← Indica que es login, no registro
});
```

### Caso 3: Usuario hace logout y vuelve a hacer login

```typescript
// Al hacer logout:
setUser(null);
// → Genera nuevo UUID: "anon_xyz789..."

// Si hace login de nuevo:
// → Se vincula el NUEVO UUID con el MISMO Firebase UID
// → Firebase UID se mantiene, pero UUID es diferente
```

### Caso 4: Usuario hace login en múltiples dispositivos

```typescript
// Dispositivo 1:
// UUID: "anon_aaa111" → Firebase UID: "firebase_XXX"

// Dispositivo 2:
// UUID: "anon_bbb222" → Firebase UID: "firebase_XXX" (mismo)

// BigQuery puede unir ambos:
SELECT *
FROM analytics_events
WHERE user_id = 'firebase_XXX'
   OR user_pseudo_id IN ('anon_aaa111', 'anon_bbb222')
```

---

## 📈 Análisis de Conversión

### Query BigQuery Ejemplo

```sql
-- Análisis de conversión: cuántos usuarios anónimos se registran

WITH anonymous_users AS (
  SELECT DISTINCT
    user_pseudo_id as uuid,
    MIN(event_timestamp) as first_seen
  FROM `project.dataset.events_*`
  WHERE user_pseudo_id LIKE 'anon_%'
  GROUP BY user_pseudo_id
),

conversions AS (
  SELECT
    event_params.value.string_value as uuid,
    user_id as firebase_uid,
    event_timestamp as conversion_time,
    event_params.value.string_value as method
  FROM `project.dataset.events_*`,
    UNNEST(event_params) as event_params
  WHERE event_name = 'user_account_linked'
    AND event_params.key = 'previous_anonymous_id'
)

SELECT
  COUNT(DISTINCT a.uuid) as total_anonymous_users,
  COUNT(DISTINCT c.firebase_uid) as converted_users,
  ROUND(COUNT(DISTINCT c.firebase_uid) / COUNT(DISTINCT a.uuid) * 100, 2) as conversion_rate,
  AVG(TIMESTAMP_DIFF(c.conversion_time, a.first_seen, HOUR)) as avg_hours_to_convert
FROM anonymous_users a
LEFT JOIN conversions c ON a.uuid = c.uuid
```

---

## 🎓 Conclusión

El flujo de migración es:

1. ✅ **Automático** - No requiere intervención del usuario
2. ✅ **Transparente** - Usuario no nota la transición
3. ✅ **Completo** - Vincula todos los servicios de analytics
4. ✅ **Robusto** - Maneja errores y casos edge
5. ✅ **Auditable** - Logs completos para debugging

---

_Última actualización: 4 de Febrero, 2026_
