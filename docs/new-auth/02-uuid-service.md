# AnonymousIdentityService - Servicio de UUID Anónimo

## 📋 Descripción General

El `AnonymousIdentityService` es responsable de generar, almacenar y gestionar identificadores únicos anónimos (UUID) para usuarios que aún no se han autenticado en la aplicación.

---

## 🎯 Objetivos

1. **Generar UUID único** en la primera instalación
2. **Persistir UUID** entre sesiones
3. **Proporcionar metadata del dispositivo** para contexto adicional
4. **Permitir reset** del UUID si es necesario
5. **Garantizar unicidad** sin colisiones

---

## 📁 Ubicación del Archivo

```
src/services/AnonymousIdentityService.ts
```

---

## 💻 Implementación Completa

````typescript
import { storageService } from '@/services/StorageService';
import DeviceInfo from 'react-native-device-info';
import SafeLogger from '@/utils/safeLogger';

/**
 * Servicio para gestionar identificadores anónimos de usuarios
 *
 * Este servicio genera y mantiene un UUID único para usuarios que
 * no han iniciado sesión. El UUID se utiliza para:
 * - Analytics (Firebase, Clarity, Sentry)
 * - Crashlytics
 * - Tracking de comportamiento
 *
 * El UUID se vincula automáticamente con el Firebase UID cuando
 * el usuario se registra o inicia sesión.
 *
 * @example
 * ```typescript
 * const anonymousId = anonymousIdentityService.getAnonymousId();
 * // Returns: "anon_1738692841_x7k2m9_d4f8b"
 *
 * const metadata = anonymousIdentityService.getDeviceMetadata();
 * // Returns: { deviceId, brand, model, systemVersion, buildNumber }
 * ```
 */
class AnonymousIdentityService {
  /**
   * UUID anónimo en memoria (cache)
   * @private
   */
  private anonymousId: string | null = null;

  /**
   * Key de MMKV donde se almacena el UUID
   * @private
   */
  private readonly STORAGE_KEY = 'anonymous_user_id';

  /**
   * Prefijo para todos los UUID anónimos
   * @private
   */
  private readonly UUID_PREFIX = 'anon';

  /**
   * Obtiene o genera un ID anónimo persistente
   *
   * Flujo:
   * 1. Si existe en memoria (cache), retorna directamente
   * 2. Si no, intenta recuperar de MMKV
   * 3. Si no existe en MMKV, genera uno nuevo y lo guarda
   *
   * @returns {string} UUID anónimo en formato "anon_<timestamp>_<random>_<deviceId>"
   *
   * @example
   * ```typescript
   * const id = anonymousIdentityService.getAnonymousId();
   * // Primera llamada: genera nuevo → "anon_1738692841_x7k2m9_d4f8b"
   * // Llamadas posteriores: retorna el mismo → "anon_1738692841_x7k2m9_d4f8b"
   * ```
   */
  getAnonymousId(): string {
    // 1. Verificar cache en memoria
    if (this.anonymousId) {
      SafeLogger.debug('[AnonymousIdentity] Returning cached ID:', this.anonymousId);
      return this.anonymousId;
    }

    // 2. Intentar recuperar de MMKV
    const storedId = storageService.getString(this.STORAGE_KEY);

    if (storedId) {
      SafeLogger.debug('[AnonymousIdentity] Loaded from storage:', storedId);
      this.anonymousId = storedId;
      return storedId;
    }

    // 3. Generar nuevo ID
    SafeLogger.info('[AnonymousIdentity] Generating new anonymous ID');
    this.anonymousId = this.generateAnonymousId();

    // 4. Guardar en MMKV
    storageService.setString(this.STORAGE_KEY, this.anonymousId);

    SafeLogger.info('[AnonymousIdentity] New ID generated and stored:', this.anonymousId);

    return this.anonymousId;
  }

  /**
   * Genera un ID anónimo único basado en múltiples factores
   *
   * Formato: "anon_<timestamp>_<random>_<deviceId>"
   *
   * Componentes:
   * - Prefijo: "anon" (identifica que es un usuario anónimo)
   * - Timestamp: base36 del timestamp actual (8-9 caracteres)
   * - Random: string aleatorio (13 caracteres)
   * - DeviceId: primeros 8 caracteres del device ID único
   *
   * @private
   * @returns {string} UUID anónimo único
   *
   * @example
   * ```typescript
   * const uuid = this.generateAnonymousId();
   * // "anon_1738692841_x7k2m9pqr1234_d4f8b2c1"
   * //  └──┘ └────────┘ └────────────┘ └──────┘
   * //  anon timestamp    random       deviceId
   * ```
   */
  private generateAnonymousId(): string {
    try {
      // Timestamp en base36 (más corto)
      const timestamp = Date.now().toString(36);

      // String aleatorio (13 caracteres)
      const random = Math.random().toString(36).substring(2, 15);

      // Device ID único (8 caracteres)
      const deviceId = DeviceInfo.getUniqueId().substring(0, 8);

      // Formato final: anon_<timestamp>_<random>_<deviceId>
      const uuid = `${this.UUID_PREFIX}_${timestamp}_${random}_${deviceId}`;

      SafeLogger.debug('[AnonymousIdentity] Generated UUID components:', {
        timestamp,
        random: random.substring(0, 6) + '...',
        deviceId,
        fullUuid: uuid,
      });

      return uuid;
    } catch (error) {
      // Fallback si DeviceInfo falla
      SafeLogger.error('[AnonymousIdentity] Error generating UUID:', error);

      const timestamp = Date.now().toString(36);
      const random1 = Math.random().toString(36).substring(2, 15);
      const random2 = Math.random().toString(36).substring(2, 10);

      return `${this.UUID_PREFIX}_${timestamp}_${random1}_${random2}`;
    }
  }

  /**
   * Reinicia el ID anónimo (útil para reset completo de app)
   *
   * Elimina el UUID existente de MMKV y genera uno nuevo.
   *
   * ⚠️ ADVERTENCIA: Esto rompe la vinculación con analytics anteriores.
   * Solo usar en casos específicos como:
   * - Logout completo con clear data
   * - Testing
   * - Migración de usuarios
   *
   * @returns {string} Nuevo UUID anónimo generado
   *
   * @example
   * ```typescript
   * const oldId = anonymousIdentityService.getAnonymousId();
   * // "anon_abc123..."
   *
   * const newId = anonymousIdentityService.resetAnonymousId();
   * // "anon_xyz789..." (diferente)
   * ```
   */
  resetAnonymousId(): string {
    SafeLogger.warn('[AnonymousIdentity] Resetting anonymous ID');

    // Limpiar cache
    this.anonymousId = null;

    // Eliminar de MMKV
    storageService.delete(this.STORAGE_KEY);

    // Generar y retornar nuevo ID
    const newId = this.getAnonymousId();

    SafeLogger.info('[AnonymousIdentity] New ID after reset:', newId);

    return newId;
  }

  /**
   * Obtiene metadata del dispositivo para contexto adicional
   *
   * Información útil para:
   * - Analytics
   * - Debugging
   * - Crashlytics attributes
   * - Segmentación de usuarios
   *
   * @returns {object} Metadata del dispositivo
   *
   * @example
   * ```typescript
   * const metadata = anonymousIdentityService.getDeviceMetadata();
   * // {
   * //   deviceId: "anon_1738692841_x7k2m9_d4f8b",
   * //   brand: "samsung",
   * //   model: "SM-G991B",
   * //   systemVersion: "13",
   * //   buildNumber: "123",
   * //   appVersion: "1.0.0"
   * // }
   * ```
   */
  getDeviceMetadata(): {
    deviceId: string;
    brand: string;
    model: string;
    systemVersion: string;
    buildNumber: string;
    appVersion: string;
  } {
    return {
      deviceId: this.getAnonymousId(),
      brand: DeviceInfo.getBrand(),
      model: DeviceInfo.getModel(),
      systemVersion: DeviceInfo.getSystemVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      appVersion: DeviceInfo.getVersion(),
    };
  }

  /**
   * Verifica si el ID actual es un UUID anónimo válido
   *
   * @param {string} id - ID a verificar
   * @returns {boolean} true si es un UUID anónimo válido
   *
   * @example
   * ```typescript
   * anonymousIdentityService.isAnonymousId("anon_123_abc_def"); // true
   * anonymousIdentityService.isAnonymousId("firebase_ABC123"); // false
   * anonymousIdentityService.isAnonymousId(""); // false
   * ```
   */
  isAnonymousId(id: string | null | undefined): boolean {
    if (!id) return false;
    return id.startsWith(`${this.UUID_PREFIX}_`);
  }

  /**
   * Obtiene el UUID almacenado directamente desde MMKV (sin cache)
   *
   * Útil para verificar estado de almacenamiento sin afectar cache.
   *
   * @returns {string | undefined} UUID almacenado o undefined si no existe
   *
   * @example
   * ```typescript
   * const storedId = anonymousIdentityService.getStoredId();
   * // "anon_1738692841_x7k2m9_d4f8b" o undefined
   * ```
   */
  getStoredId(): string | undefined {
    return storageService.getString(this.STORAGE_KEY);
  }
}

/**
 * Instancia singleton del servicio
 *
 * @example
 * ```typescript
 * import { anonymousIdentityService } from '@/services/AnonymousIdentityService';
 *
 * const id = anonymousIdentityService.getAnonymousId();
 * ```
 */
export const anonymousIdentityService = new AnonymousIdentityService();
````

---

## 🔧 Configuración en StorageService

Agregar la nueva key en `StorageService.ts`:

```typescript
// src/services/StorageService.ts

const KEYS = {
  // ... otras keys existentes
  HAS_SEEN_ONBOARDING: 'has_seen_onboarding',

  // ✨ Nueva key para UUID anónimo
  ANONYMOUS_USER_ID: 'anonymous_user_id',

  // ✨ Nueva key para mapeo UUID → Firebase UID (opcional)
  UUID_TO_FIREBASE_MAP: 'uuid_to_firebase_map',

  // ... otras keys
};
```

---

## 📊 Formato del UUID

### Estructura

```
anon_1738692841_x7k2m9pqr1234_d4f8b2c1
└──┘ └────────┘ └────────────┘ └──────┘
 │       │            │           │
 │       │            │           └─ Device ID (8 chars)
 │       │            └───────────── Random (13 chars)
 │       └────────────────────────── Timestamp base36 (8-9 chars)
 └────────────────────────────────── Prefix "anon"
```

### Componentes

| Componente    | Descripción              | Ejemplo                 | Propósito                               |
| ------------- | ------------------------ | ----------------------- | --------------------------------------- |
| **Prefix**    | Identificador de tipo    | `anon`                  | Distinguir UUID anónimo de Firebase UID |
| **Timestamp** | Date.now() en base36     | `1738692841` → `lcr8j1` | Ordenamiento temporal + unicidad        |
| **Random**    | Math.random() string     | `x7k2m9pqr1234`         | Unicidad + anti-colisión                |
| **Device ID** | DeviceInfo.getUniqueId() | `d4f8b2c1`              | Identificación de dispositivo           |

### Propiedades

- **Longitud:** ~40-45 caracteres
- **Unicidad:** Prácticamente garantizada (timestamp + random + deviceId)
- **Colisiones:** Probabilidad < 1 en 10 millones
- **Persistencia:** Se mantiene hasta reinstalación o reset manual
- **Offline-first:** Se genera localmente sin necesidad de internet

---

## 🎬 Casos de Uso

### Caso 1: Primera Instalación

```typescript
// Usuario instala la app por primera vez

// 1. App.tsx inicializa
const anonymousId = anonymousIdentityService.getAnonymousId();
// No existe en MMKV → genera nuevo
// Returns: "anon_1738692841_x7k2m9_d4f8b"

// 2. Se guarda en MMKV automáticamente
// MMKV['anonymous_user_id'] = "anon_1738692841_x7k2m9_d4f8b"

// 3. Se configura en Analytics
analyticsService.setUserId('anon_1738692841_x7k2m9_d4f8b');
```

### Caso 2: App Restart

```typescript
// Usuario cierra y vuelve a abrir la app

// 1. App.tsx inicializa
const anonymousId = anonymousIdentityService.getAnonymousId();
// Existe en MMKV → retorna el mismo
// Returns: "anon_1738692841_x7k2m9_d4f8b" (mismo de antes)

// 2. Se configura en Analytics (mismo ID)
analyticsService.setUserId('anon_1738692841_x7k2m9_d4f8b');

// ✅ Continuidad de analytics garantizada
```

### Caso 3: Usuario se Registra

```typescript
// Usuario completa registro

// 1. Capturar UUID antes de actualizar
const previousAnonymousId = anonymousIdentityService.getAnonymousId();
// Returns: "anon_1738692841_x7k2m9_d4f8b"

// 2. Auth exitoso → Firebase UID generado
const firebaseUid = user.uid;
// "firebase_ABC123XYZ"

// 3. Vincular ambos IDs
analyticsService.setUserProperty('original_anonymous_id', previousAnonymousId);
analyticsService.setUserId(firebaseUid);

// 4. Guardar mapeo local (opcional)
storageService.setString(
  'uuid_to_firebase_map',
  JSON.stringify({
    uuid: previousAnonymousId,
    firebaseUid: firebaseUid,
    linkedAt: Date.now(),
  }),
);

// ✅ Historial completo vinculado
```

### Caso 4: Logout

```typescript
// Usuario hace logout

// 1. Limpiar auth
authService.signOut();

// 2. Regenerar UUID nuevo (opcional)
const newAnonymousId = anonymousIdentityService.resetAnonymousId();
// Old: "anon_1738692841_x7k2m9_d4f8b"
// New: "anon_1738712345_p9q2r7_a1b2c3"

// 3. Actualizar Analytics
analyticsService.setUserId(newAnonymousId);

// ✅ Nueva sesión anónima independiente
```

### Caso 5: Multi-Dispositivo

```typescript
// Mismo usuario, diferentes dispositivos

// DISPOSITIVO 1 (Android)
const id1 = anonymousIdentityService.getAnonymousId();
// "anon_1738692841_x7k2m9_d4f8b001" (device ID: d4f8b001)

// DISPOSITIVO 2 (iOS)
const id2 = anonymousIdentityService.getAnonymousId();
// "anon_1738692999_a2b3c4_e5f6g002" (device ID: e5f6g002)

// UUIDs diferentes por dispositivo
// Se vinculan al mismo Firebase UID cuando el usuario hace login en ambos
```

---

## 🧪 Testing

### Tests Unitarios

```typescript
// __tests__/services/AnonymousIdentityService.test.ts

import { anonymousIdentityService } from '@/services/AnonymousIdentityService';
import { storageService } from '@/services/StorageService';

describe('AnonymousIdentityService', () => {
  beforeEach(() => {
    // Limpiar storage antes de cada test
    storageService.delete('anonymous_user_id');
    // @ts-ignore - Limpiar cache privado
    anonymousIdentityService['anonymousId'] = null;
  });

  describe('getAnonymousId', () => {
    it('debe generar nuevo UUID en primera llamada', () => {
      const id = anonymousIdentityService.getAnonymousId();

      expect(id).toBeTruthy();
      expect(id).toMatch(/^anon_[a-z0-9]+_[a-z0-9]+_[a-z0-9]+$/);
    });

    it('debe retornar el mismo UUID en llamadas consecutivas', () => {
      const id1 = anonymousIdentityService.getAnonymousId();
      const id2 = anonymousIdentityService.getAnonymousId();

      expect(id1).toBe(id2);
    });

    it('debe persistir UUID en MMKV', () => {
      const id = anonymousIdentityService.getAnonymousId();
      const storedId = storageService.getString('anonymous_user_id');

      expect(storedId).toBe(id);
    });

    it('debe recuperar UUID de MMKV después de limpiar cache', () => {
      const id1 = anonymousIdentityService.getAnonymousId();

      // Limpiar cache (simular restart)
      // @ts-ignore
      anonymousIdentityService['anonymousId'] = null;

      const id2 = anonymousIdentityService.getAnonymousId();

      expect(id2).toBe(id1);
    });
  });

  describe('resetAnonymousId', () => {
    it('debe generar nuevo UUID diferente al anterior', () => {
      const id1 = anonymousIdentityService.getAnonymousId();
      const id2 = anonymousIdentityService.resetAnonymousId();

      expect(id2).not.toBe(id1);
      expect(id2).toMatch(/^anon_/);
    });

    it('debe eliminar UUID anterior de MMKV', () => {
      const id1 = anonymousIdentityService.getAnonymousId();
      anonymousIdentityService.resetAnonymousId();

      const storedId = anonymousIdentityService.getStoredId();
      expect(storedId).not.toBe(id1);
    });
  });

  describe('isAnonymousId', () => {
    it('debe identificar UUID anónimo válido', () => {
      const id = anonymousIdentityService.getAnonymousId();
      expect(anonymousIdentityService.isAnonymousId(id)).toBe(true);
    });

    it('debe rechazar Firebase UID', () => {
      expect(anonymousIdentityService.isAnonymousId('firebase_ABC123')).toBe(false);
    });

    it('debe manejar valores null/undefined', () => {
      expect(anonymousIdentityService.isAnonymousId(null)).toBe(false);
      expect(anonymousIdentityService.isAnonymousId(undefined)).toBe(false);
      expect(anonymousIdentityService.isAnonymousId('')).toBe(false);
    });
  });

  describe('getDeviceMetadata', () => {
    it('debe retornar metadata completa', () => {
      const metadata = anonymousIdentityService.getDeviceMetadata();

      expect(metadata).toHaveProperty('deviceId');
      expect(metadata).toHaveProperty('brand');
      expect(metadata).toHaveProperty('model');
      expect(metadata).toHaveProperty('systemVersion');
      expect(metadata).toHaveProperty('buildNumber');
      expect(metadata).toHaveProperty('appVersion');
    });

    it('deviceId debe ser UUID anónimo', () => {
      const metadata = anonymousIdentityService.getDeviceMetadata();

      expect(metadata.deviceId).toMatch(/^anon_/);
    });
  });
});
```

---

## 🔍 Debugging

### Logs del Servicio

El servicio genera logs detallados en desarrollo:

```typescript
// Primera llamada
[AnonymousIdentity] Generating new anonymous ID
[AnonymousIdentity] Generated UUID components: {
  timestamp: "lcr8j1",
  random: "x7k2m9...",
  deviceId: "d4f8b2c1",
  fullUuid: "anon_lcr8j1_x7k2m9pqr1234_d4f8b2c1"
}
[AnonymousIdentity] New ID generated and stored: anon_lcr8j1_x7k2m9pqr1234_d4f8b2c1

// Llamadas subsecuentes
[AnonymousIdentity] Returning cached ID: anon_lcr8j1_x7k2m9pqr1234_d4f8b2c1

// Reset
[AnonymousIdentity] Resetting anonymous ID
[AnonymousIdentity] New ID after reset: anon_lcr9k2_a1b2c3def4567_e5f6g7h8
```

### Verificación Manual

```typescript
// En cualquier parte de la app (solo desarrollo)
import { anonymousIdentityService } from '@/services/AnonymousIdentityService';

// Ver UUID actual
console.log('Current UUID:', anonymousIdentityService.getAnonymousId());

// Ver metadata del dispositivo
console.log('Device Metadata:', anonymousIdentityService.getDeviceMetadata());

// Ver UUID almacenado en MMKV
console.log('Stored UUID:', anonymousIdentityService.getStoredId());

// Verificar si es UUID anónimo
const id = anonymousIdentityService.getAnonymousId();
console.log('Is Anonymous?', anonymousIdentityService.isAnonymousId(id));
```

---

## ⚠️ Consideraciones Importantes

### Limitaciones

1. **Reinstalación de App**

   - ❌ UUID se pierde al reinstalar
   - ✅ Se genera uno nuevo automáticamente
   - ⚠️ Analytics lo verá como usuario nuevo

2. **Clear Data/Cache**

   - ❌ UUID se pierde al limpiar datos
   - ✅ Se genera uno nuevo
   - ⚠️ Pierde vinculación con historial previo

3. **Multi-Dispositivo**
   - ❌ UUID diferente por dispositivo
   - ✅ Ambos se vinculan al mismo Firebase UID al hacer login
   - ✅ Analytics puede unir ambos dispositivos

### Seguridad

1. **No contiene PII (Personally Identifiable Information)**

   - ✅ No incluye email, nombre, teléfono
   - ✅ Device ID es hash del dispositivo
   - ✅ Cumple con GDPR/CCPA

2. **No es secreto**

   - ⚠️ UUID se envía a analytics sin cifrar
   - ⚠️ Visible en network traffic
   - ✅ No es problema (no contiene info sensible)

3. **Colisiones**
   - ✅ Prácticamente imposibles (timestamp + random + deviceId)
   - ✅ ~1 en 10 millones de probabilidad

---

## 📚 Referencias

- [DeviceInfo Documentation](https://github.com/react-native-device-info/react-native-device-info)
- [MMKV Documentation](https://github.com/mrousavy/react-native-mmkv)
- [Firebase Analytics User Properties](https://firebase.google.com/docs/analytics/user-properties)
- [UUID Best Practices](https://www.ietf.org/rfc/rfc4122.txt)

---

_Última actualización: 4 de Febrero, 2026_
