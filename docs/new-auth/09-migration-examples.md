# Ejemplo de Migración a isGuest/isPremium

Este documento muestra cómo refactorizar código existente para usar los nuevos helpers `isGuest()` e `isPremium()`.

---

## 📝 Ejemplo 1: UserProfileCard

### Antes

```typescript
const UserProfileCard = ({ user, onEdit, onRegister, onLogin }: UserProfileCardProps) => {
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';
  const email = user?.email || 'Inicia sesión presionando aquí';
  const isPro = !!user && !user.isAnonymous;
  const hasUser = !!user;

  const handlePremiumAction = () => {
    if (!hasUser) {
      onRegister?.();
    } else {
      showToast('Muy pronto estará disponible el Plan Premium', 'info');
    }
  };

  // ...
};
```

### Después (con helpers)

```typescript
const UserProfileCard = ({ user, onEdit, onRegister, onLogin }: UserProfileCardProps) => {
  const isGuest = useAuthStore(state => state.isGuest);
  const isPremium = useAuthStore(state => state.isPremium);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';
  const email = user?.email || 'Inicia sesión presionando aquí';

  const handlePremiumAction = () => {
    if (isGuest()) {
      onRegister?.();
    } else {
      showToast('Muy pronto estará disponible el Plan Premium', 'info');
    }
  };

  return (
    <View>
      {/* Avatar y nombre */}

      {!isPremium() && (
        <View style={styles.premiumCard}>
          <Text>
            {isGuest()
              ? 'Gratis durante el periodo de pruebas. Solo necesitas registrarte.'
              : 'Accede a funcionalidades exclusivas.'}
          </Text>
          <Button onPress={handlePremiumAction}>
            {isGuest() ? 'Registrarse gratis' : 'Adquirir Plan Premium'}
          </Button>
        </View>
      )}
    </View>
  );
}
```

---

## 📝 Ejemplo 2: SettingsScreen

### Antes

```typescript
const SettingsScreen = () => {
  const { user } = useAuthStore();

  const handleLoginOrLogout = () => {
    if (!user || user.isAnonymous) {
      navigation.navigate('Auth', { screen: 'Login' });
    } else {
      setShowLogoutDialog(true);
    }
  };

  return (
    <View>
      <MenuButton
        icon={user && !user.isAnonymous ? 'logout' : 'login'}
        label={user && !user.isAnonymous ? 'Cerrar sesión' : 'Iniciar sesión'}
        onPress={handleLoginOrLogout}
        isDanger={!!(user && !user.isAnonymous)}
      />
    </View>
  );
}
```

### Después (con helpers)

```typescript
const SettingsScreen = () => {
  const { user, isGuest } = useAuth();

  const handleLoginOrLogout = () => {
    if (isGuest()) {
      navigation.navigate('Auth', { screen: 'Login' });
    } else {
      setShowLogoutDialog(true);
    }
  };

  return (
    <View>
      <MenuButton
        icon={isGuest() ? 'login' : 'logout'}
        label={isGuest() ? 'Iniciar sesión' : 'Cerrar sesión'}
        onPress={handleLoginOrLogout}
        isDanger={!isGuest()}
      />
    </View>
  );
}
```

---

## 📝 Ejemplo 3: HomeScreen

### Antes

```typescript
const HomeScreen = () => {
  const { user } = useAuthStore();

  const userData = useMemo(
    () => ({
      name: user?.displayName || user?.email?.split('@')[0] || 'Usuario',
      avatarUrl: user?.photoURL,
      email: user?.email,
      notificationCount: 3,
      isPremium: !!(user && !user.isAnonymous),
    }),
    [user],
  );

  return (
    <UnifiedHeader
      variant="profile"
      userName={userData.name}
      avatarUrl={userData.avatarUrl}
      email={userData.email}
      isPremium={userData.isPremium}
      notificationCount={userData.notificationCount}
    />
  );
}
```

### Después (con helpers)

```typescript
const HomeScreen = () => {
  const { user, isPremium } = useAuth();

  const userData = useMemo(
    () => ({
      name: user?.displayName || user?.email?.split('@')[0] || 'Usuario',
      avatarUrl: user?.photoURL,
      email: user?.email,
      notificationCount: 3,
      isPremium: isPremium(),
    }),
    [user, isPremium],
  );

  return (
    <UnifiedHeader
      variant="profile"
      userName={userData.name}
      avatarUrl={userData.avatarUrl}
      email={userData.email}
      isPremium={userData.isPremium}
      notificationCount={userData.notificationCount}
    />
  );
}
```

---

## 📝 Ejemplo 4: Condicionar Acceso a Funciones

### Antes

```typescript
function StocksScreen() {
  const { user } = useAuthStore();
  const isPremium = !!(user && !user.isAnonymous);

  const handleAdvancedChart = () => {
    if (!isPremium) {
      showToast('Necesitas ser usuario premium', 'warning');
      return;
    }
    openChart();
  };

  return (
    <View>
      <Button onPress={handleAdvancedChart}>
        Ver gráfico avanzado
      </Button>
    </View>
  );
}
```

### Después (con helpers)

```typescript
function StocksScreen() {
  const { isGuest, isPremium } = useAuth();

  const handleAdvancedChart = () => {
    if (isGuest()) {
      navigation.navigate('Auth', { screen: 'Login' });
      showToast('Inicia sesión para acceder a gráficos avanzados', 'info');
      return;
    }

    if (!isPremium()) {
      showToast('Necesitas ser usuario premium', 'warning');
      return;
    }

    openChart();
  };

  return (
    <View>
      <Button onPress={handleAdvancedChart}>
        Ver gráfico avanzado
      </Button>
    </View>
  );
}
```

---

## ✅ Ventajas de usar isGuest/isPremium

1. **Más semántico:** `isGuest()` es más legible que `!user`
2. **Type-safe:** TypeScript garantiza el uso correcto
3. **Consistente:** Mismo patrón en toda la app
4. **Mantenible:** Cambios futuros en una sola ubicación
5. **Documentado:** API clara y bien documentada

---

## 🔄 Patrón de Migración

```typescript
// ❌ Patrón antiguo
const hasUser = !!user;
const isPro = !!user && !user.isAnonymous;

if (!hasUser) {
  // Usuario invitado
}

if (isPro) {
  // Usuario premium
}

// ✅ Patrón nuevo
const { isGuest, isPremium } = useAuth();

if (isGuest()) {
  // Usuario invitado
}

if (isPremium()) {
  // Usuario premium
}
```

---

## 📚 Recursos Adicionales

- [Detección de Usuario Invitado](./08-guest-detection.md)
- [Arquitectura del Sistema](./01-architecture.md)
- [Guía de Implementación](./04-implementation-guide.md)
