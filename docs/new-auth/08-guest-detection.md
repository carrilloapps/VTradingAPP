# Detección de Usuario Invitado

## 🎯 Objetivo

Proporcionar helpers semánticos para detectar fácilmente si un usuario está logueado o es un "invitado" (guest).

---

## 📚 API del AuthStore

### Getters Computados

El `authStore` ahora incluye dos getters computados:

```typescript
interface AuthState {
  // State
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;

  // Computed getters
  isGuest: () => boolean; // true cuando user = null
  isPremium: () => boolean; // true cuando user existe y !isAnonymous

  // ... rest of actions
}
```

---

## 🔧 Uso en Componentes

### Opción 1: Usar directamente desde el store

```typescript
import { useAuthStore } from '@/stores/authStore';

function MyComponent() {
  const isGuest = useAuthStore(state => state.isGuest());
  const isPremium = useAuthStore(state => state.isPremium());

  if (isGuest) {
    return <LoginPrompt />;
  }

  if (isPremium) {
    return <PremiumFeature />;
  }

  return <StandardFeature />;
}
```

### Opción 2: Usar el hook `useAuth` (recomendado)

```typescript
import { useAuth } from '@/stores';

function MyComponent() {
  const { isGuest, isPremium, user } = useAuth();

  return (
    <View>
      {isGuest() && <Text>Usuario invitado</Text>}
      {isPremium() && <Text>Usuario Premium</Text>}
      {user && <Text>Hola, {user.displayName}</Text>}
    </View>
  );
}
```

---

## 🔍 Estados del Usuario

### Estado 1: Usuario Invitado (Guest)

```typescript
// user = null
isGuest()   → true
isPremium() → false
```

**Características:**

- No está logueado
- Tiene UUID anónimo local (via AnonymousIdentityService)
- Acceso a funcionalidades FREE
- Se le puede mostrar prompts para registrarse

**Ejemplo de UI:**

```typescript
if (isGuest()) {
  return (
    <Button onPress={() => navigate('Login')}>
      Inicia sesión para desbloquear funciones premium
    </Button>
  );
}
```

### Estado 2: Usuario Autenticado

```typescript
// user = { ...firebaseUser }
isGuest()   → false
isPremium() → true
```

**Características:**

- Está logueado (email o Google)
- Tiene Firebase UID
- Acceso a funcionalidades PREMIUM
- Su UUID anterior migró a Firebase UID

**Ejemplo de UI:**

```typescript
if (isPremium()) {
  return <PremiumDashboard user={user} />;
}
```

---

## 💡 Casos de Uso Comunes

### 1. Mostrar/Ocultar Funciones Premium

```typescript
function StockDetailScreen() {
  const isPremium = useAuthStore(state => state.isPremium());

  return (
    <View>
      <StockChart data={basicData} />

      {isPremium() && (
        <>
          <AdvancedIndicators />
          <RealtimeAlerts />
        </>
      )}

      {!isPremium() && (
        <UpgradeButton />
      )}
    </View>
  );
}
```

### 2. Condicionar Navegación

```typescript
function handlePremiumFeature() {
  const isGuest = useAuthStore(state => state.isGuest());

  if (isGuest()) {
    // Redirigir a login
    navigation.navigate('Auth', { screen: 'Login' });
    showToast('Inicia sesión para acceder a esta función', 'info');
    return;
  }

  // Proceder con la función premium
  openAdvancedChart();
}
```

### 3. Personalizar Mensajes

```typescript
function WelcomeMessage() {
  const { isGuest, user } = useAuth();

  if (isGuest()) {
    return (
      <Text>
        👋 Bienvenido, invitado.
        <Link onPress={() => navigate('Login')}>Inicia sesión</Link>
        para personalizar tu experiencia.
      </Text>
    );
  }

  return (
    <Text>
      👋 Hola, {user?.displayName || 'Usuario'}!
    </Text>
  );
}
```

### 4. Lógica de Botones

```typescript
function SettingsScreen() {
  const { isGuest } = useAuth();

  return (
    <View>
      {isGuest() ? (
        <Button onPress={handleLogin}>
          Iniciar sesión
        </Button>
      ) : (
        <Button onPress={handleLogout}>
          Cerrar sesión
        </Button>
      )}
    </View>
  );
}
```

---

## 📊 Comparación con Sistema Anterior

### Antes (con Firebase Anonymous Auth)

```typescript
// Usuario invitado
user = { uid: 'firebase_anon_uid', isAnonymous: true };

// Detectar invitado
const isGuest = user?.isAnonymous;
const isPremium = !!(user && !user.isAnonymous);
```

### Ahora (con UUID Local)

```typescript
// Usuario invitado
user = null; // No hay objeto Firebase

// Detectar invitado (helpers semánticos)
const isGuest = useAuthStore(state => state.isGuest());
const isPremium = useAuthStore(state => state.isPremium());
```

**Ventajas:**

- ✅ Más semántico y legible
- ✅ No crea cuentas Firebase innecesarias
- ✅ UUID local más ligero
- ✅ Fácil migración a Firebase cuando se registra

---

## 🚨 Importante

### ⚠️ isGuest() e isPremium() son FUNCIONES

Recuerda invocarlas con `()`:

```typescript
// ✅ CORRECTO
if (isGuest()) {
  // ...
}

// ❌ INCORRECTO (evalúa la función, no su resultado)
if (isGuest) {
  // ...
}
```

### ⚠️ No Confundir con user.isAnonymous

```typescript
// ❌ YA NO EXISTE en nuestro sistema
if (user?.isAnonymous) { ... }

// ✅ USAR HELPERS
if (isGuest()) { ... }
if (isPremium()) { ... }
```

---

## 🔗 Ver También

- [Arquitectura del Sistema](./01-architecture.md)
- [Servicio de UUID Anónimo](./02-uuid-service.md)
- [Integración Analytics](./05-analytics-integration.md)
