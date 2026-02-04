# Troubleshooting y Resolución de Problemas

## 🔍 Problemas Comunes y Soluciones

### Problema 1: UUID no se genera al completar onboarding

**Síntomas:**

- Usuario completa onboarding pero UUID no aparece en Firebase Analytics
- `anonymousIdentityService.getAnonymousId()` retorna `null` o lanza error

**Diagnóstico:**

```typescript
// Verificar en OnboardingScreen.tsx
import { anonymousIdentityService } from '@/services/AnonymousIdentityService';
import { SafeLogger } from '@/utils/SafeLogger';

const finishOnboarding = async () => {
  try {
    const anonymousId = anonymousIdentityService.getAnonymousId();
    SafeLogger.info('[Onboarding] UUID generado:', anonymousId);

    if (!anonymousId || !anonymousId.startsWith('anon_')) {
      SafeLogger.error('[Onboarding] UUID inválido:', anonymousId);
    }
  } catch (error) {
    SafeLogger.error('[Onboarding] Error generando UUID:', error);
  }
};
```

**Soluciones:**

1. **Verificar MMKV inicializado:**

```typescript
// src/services/StorageService.ts
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
console.log('MMKV initialized:', storage !== null);
```

2. **Verificar permisos de storage (Android):**

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

3. **Fallback temporal si storage falla:**

```typescript
// src/services/AnonymousIdentityService.ts
getAnonymousId(): string {
  try {
    const existingId = storageService.getString(this.STORAGE_KEY);
    if (existingId) return existingId;

    const newId = this.generateAnonymousId();
    storageService.setString(this.STORAGE_KEY, newId);
    return newId;
  } catch (error) {
    // Generar UUID en memoria (no persistente)
    SafeLogger.error('[AnonymousIdentity] Storage failed, using temp UUID');
    return this.generateAnonymousId();
  }
}
```

---

### Problema 2: Evento `user_account_linked` no aparece en Firebase

**Síntomas:**

- Usuario se registra exitosamente
- UUID previo existe en MMKV
- Pero evento no aparece en Firebase Analytics

**Diagnóstico:**

```bash
# 1. Habilitar Firebase Debug Mode
adb shell setprop debug.firebase.analytics.app com.vtradingapp

# 2. Abrir Firebase Console → Analytics → DebugView

# 3. Registrarse en la app

# 4. Verificar si aparece evento user_account_linked
```

**Causas comunes:**

1. **Analytics deshabilitado:**

```typescript
// Verificar en App.tsx
import analytics from '@react-native-firebase/analytics';

useEffect(() => {
  const checkAnalytics = async () => {
    const enabled = await analytics().isAnalyticsCollectionEnabled();
    SafeLogger.info('[Analytics] Enabled:', enabled);

    if (!enabled) {
      await analytics().setAnalyticsCollectionEnabled(true);
    }
  };
  checkAnalytics();
}, []);
```

2. **Parámetros del evento mal formados:**

```typescript
// src/stores/authStore.ts

// INCORRECTO ❌
analyticsService.logEvent('user_account_linked', {
  previous_anonymous_id: previousAnonymousId,
  firebase_uid: user.uid,
  timestamp: new Date(), // ← ERROR: no es serializable
});

// CORRECTO ✅
analyticsService.logEvent('user_account_linked', {
  previous_anonymous_id: previousAnonymousId!,
  firebase_uid: user.uid,
  timestamp: Date.now(), // ← Unix timestamp (number)
});
```

3. **Firebase no inicializado:**

```typescript
// src/services/AnalyticsService.ts

class AnalyticsService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      await analytics().setAnalyticsCollectionEnabled(true);
      this.initialized = true;
      SafeLogger.info('[Analytics] Initialized');
    } catch (error) {
      SafeLogger.error('[Analytics] Init failed:', error);
    }
  }

  logEvent(name: string, params?: any) {
    if (!this.initialized) {
      SafeLogger.warn('[Analytics] Not initialized, queueing event:', name);
    }
    analytics().logEvent(name, params);
  }
}
```

---

### Problema 3: User Property `original_anonymous_id` no se guarda

**Síntomas:**

- Evento `user_account_linked` aparece correctamente
- Pero User Property no se ve en Firebase Console → Analytics → Users

**Diagnóstico:**

```typescript
// Verificar que setUserProperty se llama ANTES de setUserId
// src/stores/authStore.ts

setUser: user => {
  if (user && hasAnonymousHistory) {
    // 1. PRIMERO: User Properties
    analyticsService.setUserProperty(
      'original_anonymous_id',
      previousAnonymousId!
    );

    // 2. DESPUÉS: Evento
    analyticsService.logEvent('user_account_linked', { ... });

    // 3. FINALMENTE: userId
    analyticsService.setUserId(user.uid);
  }
}
```

**Soluciones:**

1. **Verificar límite de User Properties:**

```
Firebase permite máximo 25 User Properties por proyecto.
Si ya tienes 25, elimina algunas en Firebase Console.
```

2. **Verificar nombre de User Property:**

```
- No usar espacios: "original anonymous id" ❌
- Usar guiones bajos: "original_anonymous_id" ✅
- Máximo 24 caracteres
- Solo letras, números, guiones bajos
```

3. **Esperar propagación (puede tardar 24 horas):**

```
Firebase Analytics tiene delay de hasta 24 horas.
Para testing inmediato, usar DebugView.
```

---

### Problema 4: Migración se ejecuta múltiples veces

**Síntomas:**

- Evento `user_account_linked` se registra 2-3 veces
- Logs muestran "Migration executed" varias veces

**Causa:**
`onAuthStateChanged` se dispara múltiples veces en React Native.

**Solución:**

```typescript
// src/stores/authStore.ts

interface AuthStore {
  user: FirebaseAuthTypes.User | null;
  migrationExecuted: boolean; // ← NUEVO FLAG
  setUser: (user: FirebaseAuthTypes.User | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  migrationExecuted: false,

  setUser: user => {
    if (user) {
      const previousAnonymousId = storageService.getString('anonymous_user_id');
      const hasAnonymousHistory = previousAnonymousId?.startsWith('anon_');

      // ⚡ VERIFICAR SI YA SE MIGRÓ
      const alreadyMigrated = get().migrationExecuted;

      if (hasAnonymousHistory && !alreadyMigrated) {
        SafeLogger.info('[Auth] Executing migration (first time)');

        // ... proceso de migración ...

        // Marcar como migrado
        set({ migrationExecuted: true });
      } else if (alreadyMigrated) {
        SafeLogger.info('[Auth] Migration already executed, skipping');
      }

      // Actualizar userId (siempre)
      analyticsService.setUserId(user.uid);
    } else {
      // Reset flag al hacer logout
      set({ migrationExecuted: false });
    }

    set({ user });
  },
}));
```

---

### Problema 5: UUID se regenera cada vez que se abre la app

**Síntomas:**

- Usuario completa onboarding
- Cierra y vuelve a abrir la app
- UUID es diferente cada vez

**Causa:**
Storage no persiste entre sesiones.

**Diagnóstico:**

```typescript
// Agregar en App.tsx
import { anonymousIdentityService } from '@/services/AnonymousIdentityService';

useEffect(() => {
  const testPersistence = () => {
    const id1 = anonymousIdentityService.getAnonymousId();
    console.log('[Persistence Test] UUID 1:', id1);

    // Simular cierre de app (esperar 1 segundo)
    setTimeout(() => {
      const id2 = anonymousIdentityService.getAnonymousId();
      console.log('[Persistence Test] UUID 2:', id2);

      if (id1 !== id2) {
        console.error('[Persistence Test] ❌ UUID NO persiste');
      } else {
        console.log('[Persistence Test] ✅ UUID persiste correctamente');
      }
    }, 1000);
  };

  testPersistence();
}, []);
```

**Soluciones:**

1. **Verificar configuración MMKV:**

```typescript
// src/services/StorageService.ts
import { MMKV } from 'react-native-mmkv';

// INCORRECTO ❌
const storage = new MMKV({ id: 'temp-storage' }); // Se borra al cerrar app

// CORRECTO ✅
const storage = new MMKV({ id: 'vtrading-storage' }); // Persiste
```

2. **Verificar que no se llama `resetAnonymousId()` accidentalmente:**

```bash
# Buscar usos de resetAnonymousId
grep -r "resetAnonymousId" src/

# Solo debe aparecer en:
# - AnonymousIdentityService.ts (definición)
# - authStore.ts (en logout)
# - Tests
```

---

### Problema 6: Crashlytics no muestra `original_anonymous_id`

**Síntomas:**

- Usuario migra correctamente
- Firebase Analytics muestra User Property
- Pero Crashlytics no muestra el atributo en crashes

**Solución:**

```typescript
// src/stores/authStore.ts
import { getCrashlytics, setAttributes } from '@/utils/crashlyticsUtils';

setUser: user => {
  const crashlytics = getCrashlytics();

  if (user && hasAnonymousHistory) {
    // IMPORTANTE: usar setAttributes, no setAttribute (singular)
    setAttributes(crashlytics, {
      original_anonymous_id: previousAnonymousId!,
      conversion_method: loginMethod,
    });
  }
};
```

**Verificar en Firebase Console:**

```
1. Firebase Console → Crashlytics
2. Forzar un crash de prueba:
   throw new Error('Test crash after migration');
3. Esperar ~5 minutos
4. Ver crash en console → Keys → Buscar "original_anonymous_id"
```

---

### Problema 7: `is_new_user` siempre es `true`

**Síntomas:**

- Usuario hace login con cuenta existente
- Pero evento muestra `is_new_user: true` en vez de `false`

**Causa:**
Lógica incorrecta para detectar nuevo usuario.

**Solución:**

```typescript
// src/stores/authStore.ts

// INCORRECTO ❌
const isNewUser = !user.email; // ← Siempre false si tiene email

// CORRECTO ✅
const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;

// Explicación:
// - Si creationTime === lastSignInTime → primer login = registro
// - Si creationTime !== lastSignInTime → login subsecuente
```

---

### Problema 8: Clarity no vincula sesiones pre y post login

**Síntomas:**

- Usuario usa app como anónimo
- Se registra
- Pero sesiones en Clarity no se vinculan

**Limitación conocida:**
Clarity no soporta vinculación automática de sesiones por userId.

**Workaround:**

```typescript
// 1. Guardar sessionId anónimo antes de login
import Clarity from '@microsoft/clarity-react-native';

const anonymousSessionId = await Clarity.getCurrentSessionId();
storageService.setString('anon_clarity_session', anonymousSessionId);

// 2. Al hacer login, agregar como custom tag
Clarity.setCustomTag('prev_session_id', anonymousSessionId);
```

**Búsqueda manual en Clarity:**

```
1. Clarity Dashboard → Search
2. Buscar por User ID: firebase_ABC123XYZ789def456
3. Ver Custom Tags → prev_session_id
4. Buscar sesión anterior por ese session ID
```

---

## 🔧 Herramientas de Debugging

### Script de Verificación

**Archivo:** `scripts/verify-migration.ts`

```typescript
import { storageService } from '@/services/StorageService';
import { anonymousIdentityService } from '@/services/AnonymousIdentityService';

export const verifyMigration = () => {
  console.log('═══════════════════════════════════════');
  console.log('VERIFICACIÓN DE MIGRACIÓN');
  console.log('═══════════════════════════════════════\n');

  // 1. UUID Anónimo
  const anonymousId = storageService.getString('anonymous_user_id');
  console.log('1. UUID Anónimo:', anonymousId);
  console.log('   Formato válido:', anonymousIdentityService.isAnonymousId(anonymousId));

  // 2. Mapeo UUID → Firebase
  const mappingStr = storageService.getString('uuid_to_firebase_map');
  if (mappingStr) {
    const mapping = JSON.parse(mappingStr);
    console.log('\n2. Mapeo guardado:');
    console.log('   UUID:', mapping.uuid);
    console.log('   Firebase UID:', mapping.firebaseUid);
    console.log('   Fecha:', new Date(mapping.linkedAt).toISOString());
    console.log('   Método:', mapping.loginMethod);
  } else {
    console.log('\n2. Mapeo: No existe (usuario no se ha registrado)');
  }

  // 3. Usuario actual
  const user = useAuthStore.getState().user;
  console.log('\n3. Usuario actual:');
  if (user) {
    console.log('   UID:', user.uid);
    console.log('   Email:', user.email);
    console.log('   Premium:', !user.isAnonymous);
  } else {
    console.log('   No autenticado');
  }

  console.log('\n═══════════════════════════════════════');
};
```

**Uso:**

```typescript
// En cualquier pantalla para debugging
import { verifyMigration } from '@/scripts/verify-migration';

// Agregar botón temporal
<Button onPress={verifyMigration}>
  🔍 Verificar Migración
</Button>
```

---

### Logger Personalizado

```typescript
// src/utils/MigrationLogger.ts

class MigrationLogger {
  private logs: Array<{ timestamp: number; message: string; data?: any }> = [];

  log(message: string, data?: any) {
    const entry = {
      timestamp: Date.now(),
      message,
      data,
    };

    this.logs.push(entry);
    console.log(`[Migration] ${message}`, data || '');
  }

  export() {
    return JSON.stringify(this.logs, null, 2);
  }

  clear() {
    this.logs = [];
  }
}

export const migrationLogger = new MigrationLogger();
```

**Uso en authStore:**

```typescript
// src/stores/authStore.ts
import { migrationLogger } from '@/utils/MigrationLogger';

setUser: user => {
  if (user && hasAnonymousHistory) {
    migrationLogger.log('Starting migration', {
      previousAnonymousId,
      firebaseUid: user.uid,
    });

    // ... proceso de migración ...

    migrationLogger.log('Migration completed');
  }
};
```

---

## 📋 Checklist de Troubleshooting

Cuando encuentres un problema, verifica:

- [ ] **UUID generado correctamente:** Formato `anon_<timestamp>_<random>_<deviceId>`
- [ ] **UUID persiste en MMKV:** No se regenera al reiniciar app
- [ ] **Firebase Analytics habilitado:** `setAnalyticsCollectionEnabled(true)`
- [ ] **Firebase DebugView activo:** `adb shell setprop debug.firebase.analytics.app`
- [ ] **User Properties configuradas:** Ver en Firebase Console → Analytics → Users
- [ ] **Evento `user_account_linked` enviado:** Ver en DebugView o Events
- [ ] **Crashlytics atributos configurados:** Ver en crash report → Keys
- [ ] **Clarity userId actualizado:** Buscar sesión por Firebase UID
- [ ] **Sentry User Context configurado:** Ver en issue → User
- [ ] **Mapeo guardado en MMKV:** `uuid_to_firebase_map` existe
- [ ] **Migración no se ejecuta múltiples veces:** Usar flag `migrationExecuted`

---

## 🚨 Errores Críticos

### Error: "Firebase Analytics not initialized"

```typescript
// Solución: Verificar firebase.json
{
  "react-native": {
    "analytics_auto_collection_enabled": true
  }
}

// Y en AndroidManifest.xml / Info.plist
<meta-data
  android:name="google_analytics_automatic_screen_reporting_enabled"
  android:value="true" />
```

### Error: "MMKV storage quota exceeded"

```typescript
// Solución: Limpiar storage viejo
storageService.clearAll();

// O aumentar quota (solo Android)
// android/app/src/main/java/.../MainApplication.java
MMKV.initialize(this, int(10 * 1024 * 1024)); // 10MB
```

### Error: "Cannot set User Property after setUserId"

```typescript
// Solución: Orden correcto
// 1. User Properties primero
analyticsService.setUserProperty('key', 'value');

// 2. UserId después
analyticsService.setUserId(user.uid);
```

---

## 📞 Soporte

Si ninguna solución funciona:

1. **Revisar logs completos:**

```bash
# Android
adb logcat | grep -E "(Analytics|Crashlytics|Clarity|Sentry|Migration)"

# iOS
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "VTradingAPP"'
```

2. **Exportar logs de migración:**

```typescript
import { migrationLogger } from '@/utils/MigrationLogger';
console.log(migrationLogger.export());
```

3. **Contactar a Firebase Support:**
   - Firebase Console → Help → Contact Support
   - Incluir: Project ID, User UID, timestamps

---

_Última actualización: 4 de Febrero, 2026_
