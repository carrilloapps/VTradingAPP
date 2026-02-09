# Estrategia de Testing

## 🎯 Objetivos de Testing

1. **Cobertura 100%** del nuevo código (`AnonymousIdentityService`)
2. **Validar migración** UUID → Firebase UID en todos los escenarios
3. **Verificar integración** con todos los servicios de analytics
4. **Probar casos edge** (errores, timeouts, dispositivos múltiples)
5. **Testing E2E** del flujo completo de usuario

---

## 📁 Estructura de Tests

```
__tests__/
├── services/
│   ├── AnonymousIdentityService.test.ts       ← Test unitario
│   └── AnonymousIdentityService.integration.test.ts  ← Test integración
├── stores/
│   └── authStore.migration.test.ts            ← Test migración
├── e2e/
│   ├── auth-flow.test.ts                      ← E2E completo
│   └── multi-device.test.ts                   ← Multi-device
└── integration/
    └── analytics-services.test.ts             ← Integración analytics
```

---

## 🧪 Test Unitario - AnonymousIdentityService

**Archivo:** `__tests__/services/AnonymousIdentityService.test.ts`

```typescript
import { anonymousIdentityService } from '@/services/AnonymousIdentityService';
import { storageService } from '@/services/StorageService';
import DeviceInfo from 'react-native-device-info';

// Mocks
jest.mock('@/services/StorageService');
jest.mock('react-native-device-info');
jest.mock('@/utils/SafeLogger');

describe('AnonymousIdentityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (DeviceInfo.getDeviceId as jest.Mock).mockReturnValue('test-device-123');
    (DeviceInfo.getBrand as jest.Mock).mockReturnValue('Apple');
    (DeviceInfo.getModel as jest.Mock).mockReturnValue('iPhone 14');
    (DeviceInfo.getSystemVersion as jest.Mock).mockReturnValue('17.0');
  });

  describe('getAnonymousId', () => {
    it('debe generar nuevo UUID si no existe en storage', () => {
      (storageService.getString as jest.Mock).mockReturnValue(null);

      const id = anonymousIdentityService.getAnonymousId();

      // Verificar formato correcto
      expect(id).toMatch(/^anon_\d{13}_[a-z0-9]{6}_[a-z0-9]+$/);

      // Verificar que se guardó en storage
      expect(storageService.setString).toHaveBeenCalledWith('anonymous_user_id', expect.stringMatching(/^anon_/));
    });

    it('debe retornar UUID existente si ya está guardado', () => {
      const existingId = 'anon_1738692841_x7k2m9_test1';
      (storageService.getString as jest.Mock).mockReturnValue(existingId);

      const id = anonymousIdentityService.getAnonymousId();

      expect(id).toBe(existingId);

      // No debe generar nuevo UUID
      expect(storageService.setString).not.toHaveBeenCalled();
    });

    it('debe generar nuevo UUID si el existente tiene formato inválido', () => {
      (storageService.getString as jest.Mock).mockReturnValue('invalid-format');

      const id = anonymousIdentityService.getAnonymousId();

      expect(id).toMatch(/^anon_/);
      expect(storageService.setString).toHaveBeenCalled();
    });

    it('debe incluir deviceId en el UUID generado', () => {
      (storageService.getString as jest.Mock).mockReturnValue(null);
      (DeviceInfo.getDeviceId as jest.Mock).mockReturnValue('TEST-DEVICE-XYZ');

      const id = anonymousIdentityService.getAnonymousId();

      // Device ID se sanitiza: "TEST-DEVICE-XYZ" → "testd"
      expect(id).toContain('testd');
    });

    it('debe generar UUID temporal si storage falla', () => {
      (storageService.getString as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const id = anonymousIdentityService.getAnonymousId();

      // Debe retornar UUID válido aunque falle storage
      expect(id).toMatch(/^anon_/);

      // No debe guardar (porque falló storage)
      expect(storageService.setString).not.toHaveBeenCalled();
    });
  });

  describe('resetAnonymousId', () => {
    it('debe borrar UUID existente y generar uno nuevo', () => {
      const newId = anonymousIdentityService.resetAnonymousId();

      // Verificar que se borró el anterior
      expect(storageService.deleteKey).toHaveBeenCalledWith('anonymous_user_id');

      // Verificar que se generó y guardó uno nuevo
      expect(newId).toMatch(/^anon_/);
      expect(storageService.setString).toHaveBeenCalledWith('anonymous_user_id', newId);
    });

    it('debe generar UUID válido incluso si deleteKey falla', () => {
      (storageService.deleteKey as jest.Mock).mockImplementation(() => {
        throw new Error('Delete error');
      });

      const newId = anonymousIdentityService.resetAnonymousId();

      expect(newId).toMatch(/^anon_/);
    });
  });

  describe('isAnonymousId', () => {
    it('debe retornar true para UUID anónimo válido', () => {
      expect(anonymousIdentityService.isAnonymousId('anon_1738692841_x7k2m9_test1')).toBe(true);
      expect(anonymousIdentityService.isAnonymousId('anon_1234567890123_abcdef_xyz')).toBe(true);
    });

    it('debe retornar false para UUID de Firebase', () => {
      expect(anonymousIdentityService.isAnonymousId('firebase_ABC123XYZ')).toBe(false);
      expect(anonymousIdentityService.isAnonymousId('aBc123dEf456')).toBe(false);
    });

    it('debe retornar false para null/undefined', () => {
      expect(anonymousIdentityService.isAnonymousId(null)).toBe(false);
      expect(anonymousIdentityService.isAnonymousId(undefined)).toBe(false);
    });

    it('debe retornar false para string vacío', () => {
      expect(anonymousIdentityService.isAnonymousId('')).toBe(false);
    });
  });

  describe('getDeviceMetadata', () => {
    it('debe retornar metadata correcta del dispositivo', () => {
      const metadata = anonymousIdentityService.getDeviceMetadata();

      expect(metadata).toEqual({
        deviceId: 'test-device-123',
        brand: 'Apple',
        model: 'iPhone 14',
        systemVersion: '17.0',
      });
    });
  });

  describe('formato UUID', () => {
    it('debe generar UUIDs únicos en múltiples llamadas', () => {
      (storageService.getString as jest.Mock).mockReturnValue(null);

      const id1 = anonymousIdentityService.getAnonymousId();
      jest.clearAllMocks();
      (storageService.getString as jest.Mock).mockReturnValue(null);

      const id2 = anonymousIdentityService.getAnonymousId();

      expect(id1).not.toBe(id2);
    });

    it('timestamp debe ser unix timestamp de 13 dígitos', () => {
      (storageService.getString as jest.Mock).mockReturnValue(null);

      const id = anonymousIdentityService.getAnonymousId();
      const parts = id.split('_');
      const timestamp = parseInt(parts[1], 10);

      // Verificar que es timestamp válido (entre 2020 y 2030)
      expect(timestamp).toBeGreaterThan(1577836800000); // 1 Jan 2020
      expect(timestamp).toBeLessThan(1893456000000); // 1 Jan 2030
    });

    it('parte aleatoria debe tener exactamente 6 caracteres alfanuméricos', () => {
      (storageService.getString as jest.Mock).mockReturnValue(null);

      const id = anonymousIdentityService.getAnonymousId();
      const parts = id.split('_');
      const randomPart = parts[2];

      expect(randomPart).toHaveLength(6);
      expect(randomPart).toMatch(/^[a-z0-9]{6}$/);
    });
  });
});
```

**Ejecutar test:**

```bash
npm test AnonymousIdentityService.test.ts

# Verificar cobertura
npm test -- --coverage --collectCoverageFrom='src/services/AnonymousIdentityService.ts'

# Debe mostrar: 100% Statements, Branches, Functions, Lines
```

---

## 🔄 Test de Integración - Migración

**Archivo:** `__tests__/stores/authStore.migration.test.ts`

```typescript
import { useAuthStore } from '@/stores/authStore';
import { storageService } from '@/services/StorageService';
import { analyticsService } from '@/services/AnalyticsService';
import { anonymousIdentityService } from '@/services/AnonymousIdentityService';
import Clarity from '@microsoft/clarity-react-native';
import * as Sentry from '@sentry/react-native';

jest.mock('@/services/StorageService');
jest.mock('@/services/AnalyticsService');
jest.mock('@microsoft/clarity-react-native');
jest.mock('@sentry/react-native');
jest.mock('@react-native-firebase/crashlytics', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    setUserId: jest.fn(),
    setAttribute: jest.fn(),
  })),
}));

describe('authStore - UUID Migration', () => {
  const mockUser = {
    uid: 'firebase_ABC123XYZ',
    email: 'test@example.com',
    displayName: 'Test User',
    isAnonymous: false,
    providerData: [{ providerId: 'password' }],
    metadata: {
      creationTime: '2026-02-04T10:00:00Z',
      lastSignInTime: '2026-02-04T10:00:00Z',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('debe ejecutar migración si existe UUID anónimo previo', () => {
    const anonymousId = 'anon_1738692841_x7k2m9_test1';
    (storageService.getString as jest.Mock).mockReturnValue(anonymousId);

    // Simular login
    useAuthStore.getState().setUser(mockUser as any);

    // Verificar User Properties configuradas
    expect(analyticsService.setUserProperty).toHaveBeenCalledWith('original_anonymous_id', anonymousId);
    expect(analyticsService.setUserProperty).toHaveBeenCalledWith('account_linked_at', expect.any(String));

    // Verificar evento de conversión
    expect(analyticsService.logEvent).toHaveBeenCalledWith(
      'user_account_linked',
      expect.objectContaining({
        method: 'password',
        previous_anonymous_id: anonymousId,
        firebase_uid: mockUser.uid,
        is_new_user: true,
      }),
    );

    // Verificar Sentry
    expect(Sentry.setUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockUser.uid,
        email: mockUser.email,
        anonymous_id_legacy: anonymousId,
      }),
    );

    // Verificar Clarity
    expect(Clarity.setCustomTag).toHaveBeenCalledWith('prev_anon_id', anonymousId);
  });

  it('NO debe ejecutar migración si no hay UUID previo', () => {
    (storageService.getString as jest.Mock).mockReturnValue(null);

    useAuthStore.getState().setUser(mockUser as any);

    // NO debe configurar User Property de migración
    expect(analyticsService.setUserProperty).not.toHaveBeenCalledWith('original_anonymous_id', expect.anything());

    // NO debe enviar evento de conversión
    expect(analyticsService.logEvent).not.toHaveBeenCalledWith('user_account_linked', expect.anything());
  });

  it('debe distinguir entre nuevo registro y login existente', () => {
    const anonymousId = 'anon_1738692841_x7k2m9_test1';
    (storageService.getString as jest.Mock).mockReturnValue(anonymousId);

    // Caso 1: Usuario NUEVO (creationTime === lastSignInTime)
    useAuthStore.getState().setUser(mockUser as any);

    expect(analyticsService.logEvent).toHaveBeenCalledWith(
      'user_account_linked',
      expect.objectContaining({
        is_new_user: true,
      }),
    );

    jest.clearAllMocks();

    // Caso 2: Usuario EXISTENTE (creationTime !== lastSignInTime)
    const existingUser = {
      ...mockUser,
      metadata: {
        creationTime: '2026-01-01T10:00:00Z',
        lastSignInTime: '2026-02-04T10:00:00Z',
      },
    };

    useAuthStore.getState().setUser(existingUser as any);

    expect(analyticsService.logEvent).toHaveBeenCalledWith(
      'user_account_linked',
      expect.objectContaining({
        is_new_user: false,
      }),
    );
  });

  it('debe guardar mapeo UUID→Firebase en MMKV', () => {
    const anonymousId = 'anon_1738692841_x7k2m9_test1';
    (storageService.getString as jest.Mock).mockReturnValue(anonymousId);

    useAuthStore.getState().setUser(mockUser as any);

    expect(storageService.setString).toHaveBeenCalledWith('uuid_to_firebase_map', expect.stringContaining(anonymousId));

    // Verificar estructura del mapeo
    const savedMapping = JSON.parse((storageService.setString as jest.Mock).mock.calls.find(call => call[0] === 'uuid_to_firebase_map')?.[1] || '{}');

    expect(savedMapping).toMatchObject({
      uuid: anonymousId,
      firebaseUid: mockUser.uid,
      linkedAt: expect.any(Number),
      loginMethod: 'password',
      isNewUser: true,
    });
  });

  it('debe regenerar UUID al hacer logout', () => {
    // Setear usuario
    useAuthStore.getState().setUser(mockUser as any);

    jest.clearAllMocks();

    // Logout
    useAuthStore.getState().setUser(null);

    // Verificar servicios limpiados
    expect(analyticsService.setUserId).toHaveBeenCalledWith(null);
    expect(Sentry.setUser).toHaveBeenCalledWith(null);

    // Verificar nuevo UUID generado y configurado
    const newAnonymousId = anonymousIdentityService.resetAnonymousId();
    expect(newAnonymousId).toMatch(/^anon_/);
  });
});
```

---

## 🌐 Test E2E - Flujo Completo

**Archivo:** `__tests__/e2e/auth-flow.test.ts`

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../App';
import { useAuthStore } from '@/stores/authStore';
import { anonymousIdentityService } from '@/services/AnonymousIdentityService';
import { analyticsService } from '@/services/AnalyticsService';

describe('E2E: Auth Flow Completo', () => {
  it('flujo completo: onboarding → uso anónimo → registro → migración', async () => {
    // ═══════════════════════════════════════════════════════
    // FASE 1: ONBOARDING
    // ═══════════════════════════════════════════════════════

    const { getByText, getByTestId, queryByText } = render(<App />);

    // Esperar pantalla de onboarding
    await waitFor(() => {
      expect(getByText('Bienvenido/a')).toBeTruthy();
    }, { timeout: 3000 });

    // Completar onboarding (5 pasos)
    for (let i = 0; i < 5; i++) {
      fireEvent.press(getByText('Siguiente'));
      await waitFor(() => {}, { timeout: 500 });
    }

    // ═══════════════════════════════════════════════════════
    // FASE 2: UUID ANÓNIMO GENERADO
    // ═══════════════════════════════════════════════════════

    await waitFor(() => {
      expect(queryByText('Bienvenido/a')).toBeNull(); // Onboarding cerrado
    });

    const anonymousId = anonymousIdentityService.getAnonymousId();
    expect(anonymousId).toMatch(/^anon_/);
    expect(analyticsService.setUserId).toHaveBeenCalledWith(anonymousId);

    // ═══════════════════════════════════════════════════════
    // FASE 3: USO ANÓNIMO
    // ═══════════════════════════════════════════════════════

    // Navegar a Settings
    fireEvent.press(getByTestId('settings-tab'));

    await waitFor(() => {
      expect(getByText('Usuario Anónimo')).toBeTruthy();
      expect(getByText('Registrarse gratis')).toBeTruthy();
    });

    // ═══════════════════════════════════════════════════════
    // FASE 4: REGISTRO
    // ═══════════════════════════════════════════════════════

    fireEvent.press(getByText('Registrarse gratis'));

    await waitFor(() => {
      expect(getByText('Crear cuenta')).toBeTruthy();
    });

    // Completar formulario
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');
    fireEvent.press(getByText('Crear cuenta'));

    // ═══════════════════════════════════════════════════════
    // FASE 5: MIGRACIÓN AUTOMÁTICA
    // ═══════════════════════════════════════════════════════

    await waitFor(() => {
      const user = useAuthStore.getState().user;
      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
    }, { timeout: 5000 });

    const user = useAuthStore.getState().user!;

    // Verificar User Property configurado
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
        is_new_user: true,
      })
    );

    // ═══════════════════════════════════════════════════════
    // FASE 6: ESTADO FINAL
    // ═══════════════════════════════════════════════════════

    // Verificar UI actualizada
    await waitFor(() => {
      expect(queryByText('Usuario Anónimo')).toBeNull();
      expect(getByText('test@example.com')).toBeTruthy();
      expect(getByText('PRO')).toBeTruthy();
    });
  });
});
```

---

## 📱 Test Multi-Dispositivo

**Archivo:** `__tests__/e2e/multi-device.test.ts`

```typescript
describe('Multi-Device Scenario', () => {
  it('debe vincular UUID de múltiples dispositivos al mismo Firebase UID', async () => {
    // Dispositivo 1
    const device1Id = 'anon_1738692841_x7k2m9_dev1';
    storageService.setString('anonymous_user_id', device1Id);

    // Usuario se registra en dispositivo 1
    await useAuthStore.getState().signUp('test@example.com', 'password123');

    const firebaseUid = useAuthStore.getState().user?.uid;
    expect(firebaseUid).toBeTruthy();

    // Verificar migración en dispositivo 1
    expect(analyticsService.logEvent).toHaveBeenCalledWith(
      'user_account_linked',
      expect.objectContaining({
        previous_anonymous_id: device1Id,
        firebase_uid: firebaseUid,
      }),
    );

    // ═══════════════════════════════════════════════════════
    // DISPOSITIVO 2
    // ═══════════════════════════════════════════════════════

    jest.clearAllMocks();

    // Dispositivo 2 - Nuevo UUID
    const device2Id = 'anon_1738699999_abc123_dev2';
    storageService.setString('anonymous_user_id', device2Id);

    // Usuario hace login en dispositivo 2
    await useAuthStore.getState().signIn('test@example.com', 'password123');

    // Verificar que Firebase UID es el MISMO
    expect(useAuthStore.getState().user?.uid).toBe(firebaseUid);

    // Verificar migración en dispositivo 2 con NUEVO UUID
    expect(analyticsService.logEvent).toHaveBeenCalledWith(
      'user_account_linked',
      expect.objectContaining({
        previous_anonymous_id: device2Id, // ← UUID diferente
        firebase_uid: firebaseUid, // ← Mismo UID
        is_new_user: false, // ← Login, no registro
      }),
    );
  });
});
```

---

## ✅ Checklist de Testing

### Pre-implementación

- [ ] Configurar Jest con coverage habilitado
- [ ] Instalar `@testing-library/react-native`
- [ ] Configurar mocks de Firebase, Clarity, Sentry

### Tests Unitarios

- [ ] `AnonymousIdentityService.test.ts` - 100% coverage
- [ ] Tests de formato UUID correcto
- [ ] Tests de validación UUID
- [ ] Tests de manejo de errores en storage

### Tests de Integración

- [ ] `authStore.migration.test.ts` - Migración con UUID previo
- [ ] Test sin UUID previo (no migración)
- [ ] Test de registro vs login existente
- [ ] Test de logout y regeneración UUID

### Tests E2E

- [ ] Flujo completo: onboarding → uso → registro
- [ ] Flujo con login de usuario existente
- [ ] Flujo multi-dispositivo

### Validación Manual

- [ ] Instalar app en dispositivo físico
- [ ] Completar onboarding sin registrarse
- [ ] Verificar UUID en Firebase DebugView
- [ ] Registrarse después de usar app anónimamente
- [ ] Verificar evento `user_account_linked` en Firebase
- [ ] Verificar User Property `original_anonymous_id`

---

## 🐛 Debugging Tests

```bash
# Ejecutar test específico con logs
npm test AnonymousIdentityService.test.ts -- --verbose

# Ejecutar con coverage
npm test -- --coverage

# Ver solo tests fallidos
npm test -- --onlyFailures

# Ejecutar en modo watch
npm test -- --watch
```

---

_Última actualización: 4 de Febrero, 2026_
