# Guía de Implementación - Auth Opcional con UUID Migration

## 📋 Pre-requisitos

Antes de comenzar la implementación, verifica:

- ✅ Proyecto React Native funcionando (>=0.70)
- ✅ Firebase configurado (`@react-native-firebase/*`)
- ✅ MMKV instalado (`react-native-mmkv`)
- ✅ Device Info instalado (`react-native-device-info`)
- ✅ TypeScript configurado
- ✅ Jest configurado para testing

---

## 🗂️ Estructura de Archivos

```
src/
├── services/
│   ├── AnonymousIdentityService.ts  ← NUEVO
│   ├── StorageService.ts            (existente)
│   ├── AnalyticsService.ts          (existente)
│   └── firebase/
│       └── AuthService.ts           (existente)
├── stores/
│   └── authStore.ts                 ← MODIFICAR
├── navigation/
│   └── AppNavigator.tsx             ← MODIFICAR
├── screens/
│   ├── OnboardingScreen.tsx         ← MODIFICAR
│   └── auth/
│       ├── LoginScreen.tsx          (sin cambios)
│       └── RegisterScreen.tsx       (sin cambios)
├── components/
│   └── settings/
│       └── UserProfileCard.tsx      ← MODIFICAR (opcional)
└── utils/
    └── SafeLogger.ts                (existente)

__tests__/
└── services/
    └── AnonymousIdentityService.test.ts  ← NUEVO
```

---

## 📝 Paso a Paso de Implementación

### PASO 1: Crear AnonymousIdentityService

**Archivo:** `src/services/AnonymousIdentityService.ts`

```typescript
import DeviceInfo from 'react-native-device-info';
import { storageService } from './StorageService';
import { SafeLogger } from '@/utils/SafeLogger';

/**
 * AnonymousIdentityService
 *
 * Servicio encargado de generar y gestionar identificadores únicos
 * para usuarios que usan la app sin autenticarse.
 *
 * Formato UUID: anon_<timestamp>_<random>_<deviceId>
 * Ejemplo: anon_1738692841_x7k2m9_d4f8b
 */
class AnonymousIdentityService {
  private readonly STORAGE_KEY = 'anonymous_user_id';

  /**
   * Obtiene el UUID anónimo existente o genera uno nuevo
   * @returns UUID en formato anon_<timestamp>_<random>_<deviceId>
   */
  getAnonymousId(): string {
    try {
      // Intentar obtener UUID existente desde MMKV
      const existingId = storageService.getString(this.STORAGE_KEY);

      if (existingId && this.isValidAnonymousId(existingId)) {
        SafeLogger.info('[AnonymousIdentity] Using existing UUID:', existingId);
        return existingId;
      }

      // Si no existe o es inválido, generar nuevo
      SafeLogger.info('[AnonymousIdentity] Generating new UUID');
      const newId = this.generateAnonymousId();

      // Guardar en MMKV
      storageService.setString(this.STORAGE_KEY, newId);

      SafeLogger.info('[AnonymousIdentity] New UUID generated and saved:', newId);
      return newId;
    } catch (error) {
      SafeLogger.error('[AnonymousIdentity] Error getting UUID:', error);

      // Fallback: generar UUID temporal sin persistir
      const tempId = this.generateAnonymousId();
      SafeLogger.warn('[AnonymousIdentity] Using temporary UUID (not persisted):', tempId);
      return tempId;
    }
  }

  /**
   * Resetea el UUID anónimo (útil para testing o logout)
   * @returns Nuevo UUID generado
   */
  resetAnonymousId(): string {
    try {
      SafeLogger.info('[AnonymousIdentity] Resetting UUID');

      // Borrar UUID existente
      storageService.deleteKey(this.STORAGE_KEY);

      // Generar y persistir nuevo UUID
      const newId = this.generateAnonymousId();
      storageService.setString(this.STORAGE_KEY, newId);

      SafeLogger.info('[AnonymousIdentity] UUID reset successful:', newId);
      return newId;
    } catch (error) {
      SafeLogger.error('[AnonymousIdentity] Error resetting UUID:', error);
      return this.generateAnonymousId();
    }
  }

  /**
   * Genera un nuevo UUID anónimo
   * Formato: anon_<timestamp>_<random>_<deviceId>
   */
  private generateAnonymousId(): string {
    const timestamp = Date.now();
    const random = this.generateRandomString(6);
    const deviceId = DeviceInfo.getDeviceId()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 5);

    return `anon_${timestamp}_${random}_${deviceId}`;
  }

  /**
   * Genera una cadena aleatoria de caracteres alfanuméricos
   */
  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * Valida si un string tiene el formato correcto de UUID anónimo
   */
  private isValidAnonymousId(id: string): boolean {
    // Formato esperado: anon_<número>_<6chars>_<alphanum>
    const pattern = /^anon_\d{13}_[a-z0-9]{6}_[a-z0-9]+$/;
    return pattern.test(id);
  }

  /**
   * Verifica si un userId tiene formato de UUID anónimo
   * (útil para detectar migraciones)
   */
  isAnonymousId(userId: string | null | undefined): boolean {
    if (!userId) return false;
    return userId.startsWith('anon_');
  }

  /**
   * Obtiene metadata del dispositivo para contexto adicional
   * (útil para debugging y análisis)
   */
  getDeviceMetadata(): {
    deviceId: string;
    brand: string;
    model: string;
    systemVersion: string;
  } {
    return {
      deviceId: DeviceInfo.getDeviceId(),
      brand: DeviceInfo.getBrand(),
      model: DeviceInfo.getModel(),
      systemVersion: DeviceInfo.getSystemVersion(),
    };
  }
}

// Exportar instancia singleton
export const anonymousIdentityService = new AnonymousIdentityService();
```

---

### PASO 2: Modificar authStore para Migración

**Archivo:** `src/stores/authStore.ts`

**Cambios requeridos:**

1. Importar el nuevo servicio
2. Modificar función `setUser` para manejar migración
3. Actualizar función `signOut` para regenerar UUID

```typescript
// ======= INICIO DE CAMBIOS EN authStore.ts =======

// 1. AGREGAR IMPORTS
import { anonymousIdentityService } from '@/services/AnonymousIdentityService';
import Clarity from '@microsoft/clarity-react-native';
import * as Sentry from '@sentry/react-native';

// ... resto de imports ...

// 2. MODIFICAR setUser COMPLETO
setUser: user => {
  const crashlytics = getCrashlytics();

  if (user) {
    // ════════════════════════════════════════════════════
    // FASE 1: CAPTURAR UUID PREVIO
    // ════════════════════════════════════════════════════

    const previousAnonymousId = storageService.getString('anonymous_user_id');
    const hasAnonymousHistory = previousAnonymousId?.startsWith('anon_');

    SafeLogger.info('[Auth] Setting user:', {
      uid: user.uid,
      email: user.email,
      hasAnonymousHistory,
      previousAnonymousId: previousAnonymousId?.substring(0, 25) + '...',
    });

    // ════════════════════════════════════════════════════
    // FASE 2: PROCESO DE MIGRACIÓN
    // ════════════════════════════════════════════════════

    if (hasAnonymousHistory) {
      SafeLogger.info('[Auth] 🔄 Initiating UUID → Firebase UID migration');

      const loginMethod = user.providerData[0]?.providerId || 'unknown';
      const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;

      // 2.1 Firebase Analytics - User Properties
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

      // 2.2 Firebase Analytics - Evento de Conversión
      analyticsService.logEvent('user_account_linked', {
        method: loginMethod.replace('.com', ''),
        previous_anonymous_id: previousAnonymousId!,
        firebase_uid: user.uid,
        is_new_user: isNewUser,
        timestamp: Date.now(),
      });

      SafeLogger.info('[Auth] ✅ Conversion event logged:', {
        method: loginMethod,
        isNewUser,
      });

      // 2.3 Crashlytics - Atributos personalizados
      setAttributes(crashlytics, {
        original_anonymous_id: previousAnonymousId!,
        conversion_method: loginMethod,
      });

      // 2.4 Clarity - Tag personalizado
      Clarity.setCustomTag('prev_anon_id', previousAnonymousId!);

      // 2.5 Sentry - Contexto de usuario
      Sentry.setUser({
        id: user.uid,
        email: user.email || undefined,
        username: user.displayName || undefined,
        anonymous_id_legacy: previousAnonymousId!,
      });

      // 2.6 Guardar mapeo en MMKV (para debugging)
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

        SafeLogger.info('[Auth] 💾 Migration mapping saved');
      } catch (error) {
        SafeLogger.error('[Auth] Failed to save mapping:', error);
      }
    }

    // ════════════════════════════════════════════════════
    // FASE 3: ACTUALIZAR userId EN TODOS LOS SERVICIOS
    // ════════════════════════════════════════════════════

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

    SafeLogger.info('[Auth] ✅ User ID updated in all analytics services');

  } else {
    // ════════════════════════════════════════════════════
    // LOGOUT: Limpiar servicios y regenerar UUID
    // ════════════════════════════════════════════════════

    SafeLogger.info('[Auth] 🚪 User logout - clearing data');

    // Limpiar servicios
    setUserId(crashlytics, '');
    setAttributes(crashlytics, { user_name: '', user_email: '' });
    analyticsService.setUserId(null);
    Sentry.setUser(null);

    // Regenerar UUID anónimo
    const newAnonymousId = anonymousIdentityService.resetAnonymousId();

    // Configurar nuevo UUID en servicios
    analyticsService.setUserId(newAnonymousId);
    Clarity.setCustomUserId(newAnonymousId);

    SafeLogger.info('[Auth] ✅ New anonymous session started:', newAnonymousId);
  }

  set({ user });
},

// ======= FIN DE CAMBIOS EN authStore.ts =======
```

---

### PASO 3: Modificar AppNavigator para Remover Auth Obligatorio

**Archivo:** `src/navigation/AppNavigator.tsx`

**Antes:**

```typescript
{showOnboarding ? (
  <Stack.Screen name="Onboarding" component={OnboardingScreen} />
) : user ? (
  <Stack.Screen name="MainTabs" component={MainTabNavigator} />
) : (
  <Stack.Screen name="Auth" component={AuthNavigator} />
)}
```

**Después:**

```typescript
{showOnboarding ? (
  <Stack.Screen name="Onboarding" component={OnboardingScreen} />
) : (
  // Ir directo a Main Tabs, sin importar si hay user o no
  <Stack.Screen name="MainTabs" component={MainTabNavigator} />
)}
```

**Cambio completo:**

```typescript
// src/navigation/AppNavigator.tsx

// ... resto del archivo sin cambios ...

return (
  <NavigationContainer ref={navigationRef} linking={linking}>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {showOnboarding ? (
        // Usuario ve onboarding por primera vez
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        // Usuario ya completó onboarding → va directo a app
        // No importa si tiene cuenta o no
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      )}

      {/* Auth Navigator sigue disponible, pero se accede desde Settings */}
      <Stack.Screen name="Auth" component={AuthNavigator} />
    </Stack.Navigator>
  </NavigationContainer>
);
```

---

### PASO 4: Modificar OnboardingScreen

**Archivo:** `src/screens/OnboardingScreen.tsx`

**Cambios:**

1. Cambiar navegación de `'Auth'` a `'MainTabs'`
2. Inicializar UUID anónimo al finalizar onboarding
3. Configurar userId en servicios de analytics

```typescript
// src/screens/OnboardingScreen.tsx

import { anonymousIdentityService } from '@/services/AnonymousIdentityService';
import { analyticsService } from '@/services/AnalyticsService';
import Clarity from '@microsoft/clarity-react-native';

// ... resto de imports ...

const finishOnboarding = async () => {
  try {
    setIsLoading(true);

    // Marcar onboarding como completado
    storageService.setBoolean('hasSeenOnboarding', true);

    // ═══════════════════════════════════════════════════════════
    // NUEVO: Inicializar UUID anónimo
    // ═══════════════════════════════════════════════════════════

    const anonymousId = anonymousIdentityService.getAnonymousId();
    SafeLogger.info('[Onboarding] Anonymous ID initialized:', anonymousId);

    // Configurar UUID en servicios de analytics
    analyticsService.setUserId(anonymousId);
    Clarity.setCustomUserId(anonymousId);

    // Registrar evento de onboarding completado con UUID
    analyticsService.logEvent('onboarding_completed', {
      user_id: anonymousId,
      completed_at: Date.now(),
    });

    SafeLogger.info('[Onboarding] Onboarding completed');

    // ═══════════════════════════════════════════════════════════
    // CAMBIO: Navegar directo a MainTabs (no a Auth)
    // ═══════════════════════════════════════════════════════════

    navigation.replace('MainTabs');
  } catch (error) {
    SafeLogger.error('[Onboarding] Error finishing onboarding:', error);
    showToast({
      type: 'error',
      text1: 'Error',
      text2: 'Hubo un problema al iniciar. Por favor, reinicia la app.',
    });
  } finally {
    setIsLoading(false);
  }
};
```

---

### PASO 5: Actualizar UserProfileCard (Opcional)

**Archivo:** `src/components/settings/UserProfileCard.tsx`

**Cambio:**  
Actualizar lógica para mostrar UUID anónimo cuando no hay user.

```typescript
// src/components/settings/UserProfileCard.tsx

import { anonymousIdentityService } from '@/services/AnonymousIdentityService';

// ... resto de imports ...

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ onPressRegister }) => {
  const { user } = useAuthStore();
  const theme = useTheme();

  // ═══════════════════════════════════════════════════════════
  // NUEVO: Obtener UUID si no hay user
  // ═══════════════════════════════════════════════════════════

  const anonymousId = user ? null : anonymousIdentityService.getAnonymousId();
  const isPro = !!user && !user.isAnonymous;

  return (
    <Surface style={styles.container}>
      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>
            {user?.displayName?.[0]?.toUpperCase() || '👤'}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text variant="titleMedium" style={styles.name}>
            {user?.displayName || 'Usuario Anónimo'}
          </Text>

          <Text variant="bodySmall" style={styles.email}>
            {user?.email || (anonymousId ? `ID: ${anonymousId.substring(0, 20)}...` : 'Sin cuenta')}
          </Text>
        </View>

        {/* Badge */}
        <View style={[styles.badge, isPro ? styles.proBadge : styles.freeBadge]}>
          <Text style={styles.badgeText}>{isPro ? 'PRO' : 'FREE'}</Text>
        </View>
      </View>

      {/* Botón de registro (solo si no está autenticado) */}
      {!user && (
        <Button
          mode="contained"
          onPress={onPressRegister}
          style={styles.registerButton}
        >
          Registrarse gratis
        </Button>
      )}
    </Surface>
  );
};
```

---

### PASO 6: Inicializar UUID en App.tsx

**Archivo:** `App.tsx`

**Agregar inicialización temprana del UUID:**

```typescript
// App.tsx

import { anonymousIdentityService } from '@/services/AnonymousIdentityService';
import { analyticsService } from '@/services/AnalyticsService';
import Clarity from '@microsoft/clarity-react-native';

// ... resto de imports ...

useEffect(() => {
  const initializeApp = async () => {
    try {
      // ═══════════════════════════════════════════════════════════
      // NUEVO: Inicializar UUID si no hay usuario autenticado
      // ═══════════════════════════════════════════════════════════

      const user = useAuthStore.getState().user;

      if (!user) {
        const anonymousId = anonymousIdentityService.getAnonymousId();
        SafeLogger.info('[App] Anonymous ID initialized on startup:', anonymousId);

        // Configurar en servicios
        analyticsService.setUserId(anonymousId);
        Clarity.setCustomUserId(anonymousId);
      }

      // ... resto de inicialización ...
    } catch (error) {
      SafeLogger.error('[App] Initialization error:', error);
    }
  };

  initializeApp();
}, []);
```

---

## 🧪 Testing de la Implementación

### Test Unitario de AnonymousIdentityService

**Archivo:** `__tests__/services/AnonymousIdentityService.test.ts`

```typescript
import { anonymousIdentityService } from '@/services/AnonymousIdentityService';
import { storageService } from '@/services/StorageService';
import DeviceInfo from 'react-native-device-info';

jest.mock('@/services/StorageService');
jest.mock('react-native-device-info');

describe('AnonymousIdentityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (DeviceInfo.getDeviceId as jest.Mock).mockReturnValue('test-device-123');
  });

  describe('getAnonymousId', () => {
    it('debe generar nuevo UUID si no existe', () => {
      (storageService.getString as jest.Mock).mockReturnValue(null);

      const id = anonymousIdentityService.getAnonymousId();

      expect(id).toMatch(/^anon_\d{13}_[a-z0-9]{6}_[a-z0-9]+$/);
      expect(storageService.setString).toHaveBeenCalledWith('anonymous_user_id', expect.stringMatching(/^anon_/));
    });

    it('debe retornar UUID existente si es válido', () => {
      const existingId = 'anon_1738692841_x7k2m9_test1';
      (storageService.getString as jest.Mock).mockReturnValue(existingId);

      const id = anonymousIdentityService.getAnonymousId();

      expect(id).toBe(existingId);
      expect(storageService.setString).not.toHaveBeenCalled();
    });

    it('debe generar nuevo UUID si el existente es inválido', () => {
      (storageService.getString as jest.Mock).mockReturnValue('invalid-uuid');

      const id = anonymousIdentityService.getAnonymousId();

      expect(id).toMatch(/^anon_/);
      expect(storageService.setString).toHaveBeenCalled();
    });
  });

  describe('resetAnonymousId', () => {
    it('debe generar y guardar nuevo UUID', () => {
      const newId = anonymousIdentityService.resetAnonymousId();

      expect(newId).toMatch(/^anon_/);
      expect(storageService.deleteKey).toHaveBeenCalledWith('anonymous_user_id');
      expect(storageService.setString).toHaveBeenCalledWith('anonymous_user_id', newId);
    });
  });

  describe('isAnonymousId', () => {
    it('debe retornar true para UUID anónimo válido', () => {
      expect(anonymousIdentityService.isAnonymousId('anon_123_abc_xyz')).toBe(true);
    });

    it('debe retornar false para UUID de Firebase', () => {
      expect(anonymousIdentityService.isAnonymousId('firebase_ABC123')).toBe(false);
    });

    it('debe retornar false para null/undefined', () => {
      expect(anonymousIdentityService.isAnonymousId(null)).toBe(false);
      expect(anonymousIdentityService.isAnonymousId(undefined)).toBe(false);
    });
  });
});
```

### Test de Integración - Flujo Completo

```typescript
// __tests__/integration/auth-flow.test.ts

describe('Auth Flow Integration', () => {
  it('flujo completo: onboarding → uso anónimo → registro → migración', async () => {
    // 1. App inicia sin user
    expect(useAuthStore.getState().user).toBeNull();

    // 2. Usuario completa onboarding
    const { getByText } = render(<OnboardingScreen />);

    // Avanzar todos los pasos
    for (let i = 0; i < 5; i++) {
      fireEvent.press(getByText('Siguiente'));
      await waitFor(() => {});
    }

    // 3. Verificar UUID generado
    const anonymousId = anonymousIdentityService.getAnonymousId();
    expect(anonymousId).toMatch(/^anon_/);
    expect(analyticsService.setUserId).toHaveBeenCalledWith(anonymousId);

    // 4. Usuario usa la app (eventos se registran con UUID)
    analyticsService.logEvent('view_home_screen', {});
    expect(analyticsService.logEvent).toHaveBeenCalled();

    // 5. Usuario decide registrarse
    const { getByTestId } = render(<RegisterScreen />);

    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByText('Crear cuenta'));

    // 6. Esperar autenticación
    await waitFor(() => {
      const user = useAuthStore.getState().user;
      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
    }, { timeout: 5000 });

    // 7. Verificar migración ejecutada
    const user = useAuthStore.getState().user!;

    // User Properties configurados
    expect(analyticsService.setUserProperty).toHaveBeenCalledWith(
      'original_anonymous_id',
      anonymousId
    );

    // Evento de conversión registrado
    expect(analyticsService.logEvent).toHaveBeenCalledWith(
      'user_account_linked',
      expect.objectContaining({
        previous_anonymous_id: anonymousId,
        firebase_uid: user.uid,
      })
    );

    // userId actualizado en todos los servicios
    expect(analyticsService.setUserId).toHaveBeenCalledWith(user.uid);

    // Mapeo guardado en MMKV
    const mapping = JSON.parse(
      storageService.getString('uuid_to_firebase_map') || '{}'
    );
    expect(mapping.uuid).toBe(anonymousId);
    expect(mapping.firebaseUid).toBe(user.uid);
  });
});
```

---

## ✅ Checklist de Implementación

- [ ] **PASO 1:** Crear `AnonymousIdentityService.ts`
- [ ] **PASO 2:** Modificar `authStore.ts` - función `setUser`
- [ ] **PASO 3:** Modificar `AppNavigator.tsx` - remover guard de Auth
- [ ] **PASO 4:** Modificar `OnboardingScreen.tsx` - navegar a MainTabs
- [ ] **PASO 5:** (Opcional) Actualizar `UserProfileCard.tsx`
- [ ] **PASO 6:** Inicializar UUID en `App.tsx`
- [ ] **Testing:**
  - [ ] Escribir test unitario de `AnonymousIdentityService`
  - [ ] Escribir test de integración del flujo completo
  - [ ] Ejecutar `npm test` y verificar 100% coverage
- [ ] **Validación Manual:**
  - [ ] Probar flujo onboarding → app sin login
  - [ ] Probar registro desde app anónima
  - [ ] Verificar migración en Firebase Console
  - [ ] Verificar eventos en Analytics Dashboard
  - [ ] Probar logout y regeneración de UUID
- [ ] **Configuración Firebase:**
  - [ ] Verificar User Properties habilitadas en Firebase Analytics
  - [ ] Configurar BigQuery Export (opcional)
  - [ ] Documentar custom events y parameters
- [ ] **Deployment:**
  - [ ] Compilar TypeScript sin errores: `npx tsc`
  - [ ] Ejecutar linter: `npm run lint`
  - [ ] Build Android: `cd android && ./gradlew assembleRelease`
  - [ ] Build iOS: `cd ios && xcodebuild -workspace VTradingAPP.xcworkspace`
  - [ ] Crear release tag: `git tag v2.0.0-auth-optional`

---

## 📊 Estimación de Tiempos

| Tarea                                     | Tiempo Estimado |
| ----------------------------------------- | --------------- |
| Crear AnonymousIdentityService            | 1-2 horas       |
| Modificar authStore                       | 2-3 horas       |
| Modificar AppNavigator y OnboardingScreen | 1 hora          |
| Testing unitario + integración            | 2-3 horas       |
| Validación manual en Firebase Console     | 1 hora          |
| Documentación y ajustes finales           | 1-2 horas       |
| **TOTAL**                                 | **8-12 horas**  |

---

## 🚨 Puntos Críticos

### ⚠️ NO olvidar:

1. **Ejecutar `npx tsc` antes de commit** - Sin errores de compilación
2. **Tests deben pasar al 100%** - `npm test` exitoso
3. **Verificar Firebase Console** después del primer usuario migrado
4. **Probar logout/login múltiple** para verificar regeneración de UUID
5. **Documentar custom events** en Firebase Console para equipo de analytics

---

## 🎓 Siguientes Pasos

Después de implementar:

1. **Monitorear métricas:** Ver `05-analytics-integration.md`
2. **Configurar alertas:** Ver problemas comunes en `07-troubleshooting.md`
3. **Optimizar conversión:** Analizar datos de `user_account_linked` events

---

_Última actualización: 4 de Febrero, 2026_
