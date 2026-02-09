# Arquitectura del Sistema de Autenticación Opcional

## 📐 Diseño General

### Principios de Diseño

1. **Opt-in Authentication:** El usuario no está obligado a autenticarse
2. **Progressive Enhancement:** Funcionalidad completa sin auth, premium con auth
3. **Seamless Migration:** Transición invisible de anónimo a autenticado
4. **Analytics Continuity:** Historial completo sin pérdida de datos
5. **Privacy First:** Mínima recolección de datos hasta que el usuario lo autorice

---

## 🏗️ Componentes del Sistema

### 1. AnonymousIdentityService

**Responsabilidad:** Generar y mantener identificadores anónimos únicos

```
┌─────────────────────────────────────────┐
│   AnonymousIdentityService              │
├─────────────────────────────────────────┤
│ + getAnonymousId(): string              │
│ + resetAnonymousId(): string            │
│ + getDeviceMetadata(): object           │
│ - generateAnonymousId(): string         │
└─────────────────────────────────────────┘
```

**Dependencias:**

- `StorageService` (MMKV para persistencia)
- `DeviceInfo` (para device ID)

**Almacenamiento:**

```
MMKV Key: 'anonymous_user_id'
Value: "anon_1738692841_x7k2m9_d4f8b"
```

---

### 2. AuthStore (Zustand)

**Responsabilidad:** Gestionar estado de autenticación y migración

```
┌─────────────────────────────────────────┐
│   AuthStore                             │
├─────────────────────────────────────────┤
│ State:                                  │
│ + user: FirebaseUser | null             │
│ + isLoading: boolean                    │
│                                         │
│ Actions:                                │
│ + setUser(user): void                   │
│ + signIn(...): Promise<void>            │
│ + signUp(...): Promise<void>            │
│ + signOut(...): Promise<void>           │
│ + migrateAnonymousToAuth(): void        │
└─────────────────────────────────────────┘
```

**Nueva Funcionalidad:**

- `migrateAnonymousToAuth()`: Vincula UUID con Firebase UID
- Detecta automáticamente si hay UUID previo al hacer `setUser`

---

### 3. Firebase Analytics Integration

**Responsabilidad:** Trackear eventos con userId correcto

```
┌─────────────────────────────────────────┐
│   AnalyticsService                      │
├─────────────────────────────────────────┤
│ + setUserId(id: string | null): void    │
│ + setUserProperty(key, value): void     │
│ + logEvent(name, params): void          │
│ + logConversionEvent(uuid, uid): void   │
└─────────────────────────────────────────┘
```

**User Properties Registradas:**

- `original_anonymous_id`: UUID previo al registro
- `account_linked_at`: Timestamp de vinculación
- `first_open_date`: Fecha de instalación
- `conversion_method`: Método de registro (email, google, etc.)

---

### 4. AppNavigator

**Responsabilidad:** Controlar flujo de navegación

**Estado Actual:**

```typescript
{showOnboarding ? (
  <Onboarding />
) : user ? (
  <Main />
) : (
  <Auth />  // ← Se elimina esta validación
)}
```

**Estado Nuevo:**

```typescript
{showOnboarding ? (
  <Onboarding />
) : (
  <Main />  // ← Directo a Main sin validar usuario
)}
```

---

## 🔄 Flujo de Datos

### Diagrama de Componentes

```
┌────────────────────────────────────────────────────────────────┐
│                        App.tsx                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ useEffect(() => {                                        │ │
│  │   const anonymousId = anonymousIdentityService.get();    │ │
│  │   analyticsService.setUserId(anonymousId);              │ │
│  │   crashlytics.setUserId(anonymousId);                   │ │
│  │   clarity.setUserId(anonymousId);                       │ │
│  │ })                                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                    AppNavigator                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Si showOnboarding: → OnboardingScreen                    │ │
│  │ Si NO: → MainTabNavigator (sin validar user)            │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                    MainTabNavigator                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Markets │ Rates │ Home │ Discover │ Settings             │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              ↓ (Usuario navega a Settings)
┌────────────────────────────────────────────────────────────────┐
│                    SettingsScreen                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ UserProfileCard: user ? "Premium" : "Free"               │ │
│  │ Botón: "Iniciar Sesión / Registrarse"                   │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              ↓ (Usuario hace click)
┌────────────────────────────────────────────────────────────────┐
│                    LoginScreen / RegisterScreen                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Usuario completa formulario                              │ │
│  │ authStore.signUp() o authStore.signIn()                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              ↓ (Auth exitoso)
┌────────────────────────────────────────────────────────────────┐
│                    authStore.setUser()                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 1. Capturar previousAnonymousId                          │ │
│  │ 2. Si existe UUID previo:                                │ │
│  │    - analyticsService.setUserProperty(...)               │ │
│  │    - analyticsService.logEvent('user_account_linked')    │ │
│  │    - crashlytics.setAttribute(...)                       │ │
│  │ 3. Actualizar userId a Firebase UID                      │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Arquitectura de Datos

### Estados del Usuario

```
┌─────────────────────────────────────────────────────────────┐
│                    Estado: ANÓNIMO                          │
├─────────────────────────────────────────────────────────────┤
│ userId (Analytics): "anon_1738692841_x7k2m9_d4f8b"         │
│ user (AuthStore): null                                      │
│ isPremium: false                                            │
│ Datos locales: MMKV (no sincronizado)                      │
│ Funcionalidad: Completa (modo Free)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓ (Usuario se registra)
┌─────────────────────────────────────────────────────────────┐
│                    Estado: TRANSICIÓN                       │
├─────────────────────────────────────────────────────────────┤
│ userId anterior: "anon_1738692841_x7k2m9_d4f8b"            │
│ userId nuevo: "firebase_ABC123XYZ"                         │
│ user (AuthStore): FirebaseUser { uid: "firebase_ABC..." }  │
│ Migración: En progreso                                      │
│ - Vinculando UUID con Firebase UID                         │
│ - Guardando User Properties                                │
│ - Enviando evento de conversión                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓ (Migración completa)
┌─────────────────────────────────────────────────────────────┐
│                    Estado: AUTENTICADO                      │
├─────────────────────────────────────────────────────────────┤
│ userId (Analytics): "firebase_ABC123XYZ"                   │
│ user (AuthStore): FirebaseUser { uid, email, ... }         │
│ isPremium: true                                             │
│ Datos: Sincronizados con Firebase                          │
│ Funcionalidad: Completa (modo Premium)                     │
│ User Property: original_anonymous_id = "anon_1738..."      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Seguridad y Persistencia

### Almacenamiento MMKV

```typescript
// Estructura de datos en MMKV
{
  // UUID anónimo (se genera al instalar)
  "anonymous_user_id": "anon_1738692841_x7k2m9_d4f8b",

  // Mapeo UUID → Firebase UID (se guarda al hacer login)
  "uuid_to_firebase_map": {
    "uuid": "anon_1738692841_x7k2m9_d4f8b",
    "firebaseUid": "firebase_ABC123XYZ",
    "linkedAt": 1738692841000,
    "loginMethod": "google.com"
  },

  // Preferencias de usuario (local)
  "theme": "dark",
  "notifications_enabled": true,

  // Alertas creadas (local)
  "alerts": [
    { id: "1", currency: "USD", threshold: 40.5 }
  ]
}
```

### Firebase Analytics

```typescript
// User Properties (vinculación)
{
  "userId": "firebase_ABC123XYZ",
  "userProperties": {
    "original_anonymous_id": "anon_1738692841_x7k2m9_d4f8b",
    "account_linked_at": "2026-02-04T15:30:00Z",
    "conversion_method": "google",
    "first_open_date": "2026-01-30"
  }
}
```

### Firebase Crashlytics

```typescript
// Custom Attributes (debugging)
{
  "userId": "firebase_ABC123XYZ",
  "attributes": {
    "user_email": "jose@example.com",
    "user_name": "José Carrillo",
    "original_anonymous_id": "anon_1738692841_x7k2m9_d4f8b",
    "provider": "google.com"
  }
}
```

---

## 🎨 Diseño de Interfaces

### UserProfileCard - Modo Anónimo

```
┌─────────────────────────────────────────┐
│  👤  Invitado                           │
│      usuario@anónimo                    │
│                                    [FREE]│
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  💎 PÁSATE AL PLAN PREMIUM              │
│  Gratis durante el periodo de pruebas.  │
│  Solo necesitas registrarte.            │
│                                         │
│  [  Registrarse gratis  ]               │
└─────────────────────────────────────────┘
```

### UserProfileCard - Modo Autenticado

```
┌─────────────────────────────────────────┐
│  👤  José Carrillo              [✏️]    │
│      jose@example.com            [PRO] │
└─────────────────────────────────────────┘
```

---

## 🔧 Configuración de Servicios

### Firebase Console - Analytics

**User Properties a Configurar:**

```
original_anonymous_id (text, 50 chars)
account_linked_at (text, 30 chars)
conversion_method (text, 20 chars)
```

**Eventos Personalizados:**

```
user_account_linked
  - method (string): "email", "google", "apple"
  - previous_anonymous_id (string): UUID anterior
  - firebase_uid (string): UID de Firebase
  - is_new_user (boolean): true si es registro, false si login
```

### Firebase Console - Crashlytics

**Custom Keys a Usar:**

```
original_anonymous_id
conversion_method
account_linked_at
```

---

## 📊 Diagramas de Secuencia

### Secuencia 1: Primera Instalación

```
Usuario  App.tsx  AnonymousService  MMKV  Analytics
  │         │            │            │        │
  │ Instala │            │            │        │
  │────────>│            │            │        │
  │         │ getAnonymousId()        │        │
  │         │───────────>│            │        │
  │         │            │ get('anonymous_user_id')
  │         │            │───────────>│        │
  │         │            │<───────────│        │
  │         │            │ (undefined)│        │
  │         │            │            │        │
  │         │            │ generateId()        │
  │         │            │ "anon_abc123"       │
  │         │            │            │        │
  │         │            │ set('anonymous_user_id', 'anon_abc123')
  │         │            │───────────>│        │
  │         │            │<───────────│        │
  │         │<───────────│            │        │
  │         │ "anon_abc123"           │        │
  │         │                         │        │
  │         │ setUserId("anon_abc123")│        │
  │         │────────────────────────────────>│
  │         │<────────────────────────────────│
  │         │                         │        │
  │  ✅ App lista con UUID           │        │
```

### Secuencia 2: Usuario se Registra

```
Usuario  LoginScreen  authStore  Firebase  Analytics  MMKV
  │         │            │          │          │        │
  │ Click   │            │          │          │        │
  │"Register"           │          │          │        │
  │────────>│            │          │          │        │
  │         │ signUp()   │          │          │        │
  │         │───────────>│          │          │        │
  │         │            │ signUpWithEmail()   │        │
  │         │            │─────────>│          │        │
  │         │            │<─────────│          │        │
  │         │            │ (FirebaseUser)      │        │
  │         │            │          │          │        │
  │         │            │ setUser(user)       │        │
  │         │            │          │          │        │
  │         │            │ 1. get('anonymous_user_id') │
  │         │            │─────────────────────────────>│
  │         │            │<─────────────────────────────│
  │         │            │ "anon_abc123"       │        │
  │         │            │          │          │        │
  │         │            │ 2. setUserProperty('original_anonymous_id', 'anon_abc123')
  │         │            │─────────────────────>│        │
  │         │            │          │          │        │
  │         │            │ 3. logEvent('user_account_linked')
  │         │            │─────────────────────>│        │
  │         │            │          │          │        │
  │         │            │ 4. setUserId("firebase_XYZ")
  │         │            │─────────────────────>│        │
  │         │            │          │          │        │
  │         │<───────────│          │          │        │
  │<────────│            │          │          │        │
  │  ✅ Registrado       │          │          │        │
```

---

## 🎯 Decisiones de Arquitectura

### ¿Por qué Zustand para AuthStore?

- ✅ Ya está implementado en el proyecto
- ✅ Performance óptimo con selectores
- ✅ DevTools para debugging
- ✅ Middleware para persistencia

### ¿Por qué MMKV para UUID?

- ✅ Más rápido que AsyncStorage
- ✅ Sincrónico (no async)
- ✅ Encriptado por defecto
- ✅ Ya está en el proyecto

### ¿Por qué User Properties en vez de Custom Dimensions?

- ✅ User Properties persisten con el usuario
- ✅ Fácil consulta en BigQuery
- ✅ Incluido en plan gratuito de Firebase
- ✅ No requiere configuración adicional

### ¿Por qué no Firebase Anonymous Auth?

- ❌ Requiere conexión a internet al inicio
- ❌ Genera llamadas de red innecesarias
- ❌ UUID local es más rápido y offline-first
- ✅ Nuestra implementación es más ligera

---

## 🔄 Ciclo de Vida del Usuario

```
[INSTALACIÓN]
     ↓
[UUID Generado] ──────────────────────┐
     ↓                                 │
[Onboarding] ────> [Skip]             │
     ↓                ↓                │
[Main App con UUID] ←┘                │
     ↓                                 │
[Usa app N días]                      │ Historial
     ↓                                 │ Analytics
[Decide registrarse]                  │ con UUID
     ↓                                 │
[LoginScreen/RegisterScreen]          │
     ↓                                 │
[Auth exitoso] ←──────────────────────┘
     ↓
[Migración Automática]
  • UUID vinculado con Firebase UID
  • User Property guardada
  • Evento de conversión enviado
     ↓
[Usuario Autenticado] ────────────────┐
     ↓                                 │
[Premium features]                    │ Historial
     ↓                                 │ Analytics
[Sincronización multi-device]         │ con Firebase
     ↓                                 │ UID + UUID
[Logout opcional] ────────────────────┘ vinculado
     ↓
[Vuelve a UUID anónimo]
     │
     └──> [Puede hacer login de nuevo]
```

---

## 📝 Checklist de Implementación

### Fase 1: Servicios Base

- [ ] Crear `AnonymousIdentityService.ts`
- [ ] Agregar key en `StorageService.ts`
- [ ] Tests unitarios de AnonymousIdentityService

### Fase 2: Navegación

- [ ] Modificar `AppNavigator.tsx`
- [ ] Modificar `OnboardingScreen.tsx`
- [ ] Tests de navegación

### Fase 3: Auth Store

- [ ] Agregar lógica de migración en `authStore.ts`
- [ ] Tests de migración

### Fase 4: Analytics

- [ ] Configurar Firebase Analytics User Properties
- [ ] Implementar evento de conversión
- [ ] Tests de analytics

### Fase 5: UI

- [ ] Agregar botón login en Settings
- [ ] Actualizar UserProfileCard
- [ ] Tests de UI

### Fase 6: Testing E2E

- [ ] Test: Usuario anónimo completo
- [ ] Test: Registro después de uso anónimo
- [ ] Test: Login existente después de uso anónimo
- [ ] Test: Multi-dispositivo

---

_Última actualización: 4 de Febrero, 2026_
