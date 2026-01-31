# Guía de Analytics - VTradingAPP

## Descripción General

VTradingAPP utiliza un sistema de analytics robusto que integra múltiples plataformas:

- **Firebase Analytics**: Analytics principal con eventos personalizados
- **Microsoft Clarity**: Grabación de sesiones y mapas de calor
- **Sentry**: Breadcrumbs para debugging y contexto de errores

## Uso del AnalyticsService

### Importación

```typescript
import {
  analyticsService,
  ANALYTICS_EVENTS,
  AnalyticsEventParams,
} from '@/services/firebase/AnalyticsService';
```

### Eventos Estandarizados

#### 1. Screen Views (Vistas de Pantalla)

```typescript
// Automático en AppNavigator
analyticsService.logScreenView('HomeScreen', 'HomeScreenClass');
```

#### 2. User Actions (Acciones de Usuario)

```typescript
// Login
analyticsService.logLogin('email'); // 'email', 'google', 'anonymous'

// Sign Up
analyticsService.logSignUp('google');

// Select Content (clicks en items)
analyticsService.logSelectContent('currency', 'USD');
analyticsService.logSelectContent('stock', 'AAPL');
analyticsService.logSelectContent('bank_rate', 'USD_BancoBicentenario');

// Share
analyticsService.logShare('currency', 'USD', 'image_square');
```

#### 3. Search y Filtros

```typescript
// Búsqueda
analyticsService.logSearch('bitcoin');

// Interacciones
analyticsService.logInteraction('filter_applied', {
  screen: 'exchange_rates',
  filter_count: 3,
});

analyticsService.logInteraction('sort_changed', {
  screen: 'exchange_rates',
  sort_by: 'value',
});

analyticsService.logInteraction('dialog_opened', {
  dialog_type: 'about',
});
```

#### 4. Data Operations

```typescript
// Refresh de datos
analyticsService.logDataRefresh('dashboard', true); // true = success

// API Calls
analyticsService.logApiCall('/api/rates', 'GET', true, 234); // 234ms
```

#### 5. Features Usage

```typescript
analyticsService.logFeatureUsage('calculator_conversion', {
  base_currency: 'USD',
  target_count: 3,
});

analyticsService.logFeatureUsage('webview', {
  url: 'https://vtrading.app/blog/...',
  title: 'Article Title',
});
```

#### 6. Errores

```typescript
// En lugar de logEvent('error_sign_in')
analyticsService.logError('sign_in', { method: 'email' });

// En lugar de logEvent('error_widget_load_data')
analyticsService.logError('widget_load_data');
```

#### 7. Sesión y Engagement

```typescript
// Session (automático en App.tsx)
analyticsService.logSessionStart();
analyticsService.logSessionEnd(durationMs);

// User Engagement
analyticsService.logEngagement('article', 30000); // 30 segundos
```

#### 8. Timing de Operaciones

```typescript
const endTiming = analyticsService.startTiming('load_rates');
// ... operación
endTiming(); // Automáticamente loguea el tiempo
```

### User Properties

```typescript
// Una propiedad
analyticsService.setUserProperty('theme', 'dark');
analyticsService.setUserProperty('has_widget', 'true');

// Múltiples propiedades
analyticsService.setUserProperties({
  notification_permission: 'granted',
  device_type: 'phone',
  app_version: '1.0.5',
});

// User ID
analyticsService.setUserId(userId);
```

## Convenciones de Nombres

### Event Names (Nombres de Eventos)

- **Usar snake_case**: `user_signed_in` ✅, `userSignedIn` ❌
- **Ser descriptivos**: `button_click` ✅, `click` ❌
- **Incluir contexto**: `calculator_currency_selected` ✅, `selected` ❌
- **Usar constantes**: `ANALYTICS_EVENTS.LOGIN` ✅, `'login'` ⚠️

### Event Parameters (Parámetros de Eventos)

- **snake_case**: `search_term`, `screen_name`, `content_type`
- **Valores consistentes**:
  - Methods: `'email'`, `'google'`, `'anonymous'`
  - Content Types: `'currency'`, `'stock'`, `'bank_rate'`, `'article'`
  - Screens: `'exchange_rates'`, `'home_screen'`, `'settings'`

### User Properties (Propiedades de Usuario)

- **snake_case**: `notification_permission`, `has_widget`
- **Strings**: Todas las propiedades deben ser strings
- **Valores booleanos como strings**: `'true'`, `'false'`

## Constantes Disponibles

```typescript
// Screen Views
ANALYTICS_EVENTS.SCREEN_VIEW;

// User Actions
ANALYTICS_EVENTS.LOGIN;
ANALYTICS_EVENTS.SIGN_UP;
ANALYTICS_EVENTS.LOGOUT;
ANALYTICS_EVENTS.SEARCH;
ANALYTICS_EVENTS.SELECT_CONTENT;
ANALYTICS_EVENTS.SHARE;

// Auth Attempts (for funnel tracking)
ANALYTICS_EVENTS.LOGIN_ATTEMPT;
ANALYTICS_EVENTS.SIGN_UP_ATTEMPT;
ANALYTICS_EVENTS.PASSWORD_RESET_ATTEMPT;
ANALYTICS_EVENTS.RESET_PASSWORD_REQUEST;

// Account Management
ANALYTICS_EVENTS.DELETE_ACCOUNT;
ANALYTICS_EVENTS.UPDATE_PROFILE_NAME;
ANALYTICS_EVENTS.EDIT_PROFILE_CLICK;

// Interactions
ANALYTICS_EVENTS.BUTTON_CLICK;
ANALYTICS_EVENTS.CARD_TAP;
ANALYTICS_EVENTS.FILTER_APPLIED;
ANALYTICS_EVENTS.SORT_CHANGED;
ANALYTICS_EVENTS.DIALOG_OPENED;
ANALYTICS_EVENTS.DIALOG_CLOSED;

// Data Operations
ANALYTICS_EVENTS.DATA_REFRESH;
ANALYTICS_EVENTS.API_CALL;
ANALYTICS_EVENTS.BANK_RATES_REFRESH;

// Features
ANALYTICS_EVENTS.FEATURE_USED;

// Session
ANALYTICS_EVENTS.SESSION_START;
ANALYTICS_EVENTS.SESSION_END;
ANALYTICS_EVENTS.USER_ENGAGEMENT;

// Errors
ANALYTICS_EVENTS.ERROR;

// Widgets
ANALYTICS_EVENTS.WIDGET_ADDED;
ANALYTICS_EVENTS.WIDGET_DELETED;
ANALYTICS_EVENTS.WIDGET_REFRESH;
ANALYTICS_EVENTS.WIDGET_SAVE_CONFIG;

// Notifications
ANALYTICS_EVENTS.NOTIFICATION_RECEIVED;
ANALYTICS_EVENTS.NOTIFICATION_OPENED;
ANALYTICS_EVENTS.NOTIFICATION_PERMISSION_REQUESTED;
ANALYTICS_EVENTS.NOTIFICATION_PERMISSION_RESULT;
ANALYTICS_EVENTS.NOTIFICATION_SYSTEM_INITIALIZED;
ANALYTICS_EVENTS.NOTIFICATION_ALERTS_RESUBSCRIBED;
ANALYTICS_EVENTS.NOTIFICATION_PERMISSION_SKIPPED;

// Calculator
ANALYTICS_EVENTS.CALCULATOR_ADD_CURRENCY;
ANALYTICS_EVENTS.CALCULATOR_ADD_CURRENCY_PRESSED;
ANALYTICS_EVENTS.CALCULATOR_SET_BASE;
ANALYTICS_EVENTS.CALCULATOR_CLEAR;

// Alerts
ANALYTICS_EVENTS.CREATE_ALERT;
ANALYTICS_EVENTS.CREATE_ALERT_CLICK;
ANALYTICS_EVENTS.UPDATE_ALERT;
ANALYTICS_EVENTS.DELETE_ALERT;
ANALYTICS_EVENTS.TOGGLE_ALERT;

// Settings
ANALYTICS_EVENTS.OPEN_EXTERNAL_LINK;
ANALYTICS_EVENTS.TOGGLE_PUSH;
ANALYTICS_EVENTS.CHANGE_THEME;

// Onboarding
ANALYTICS_EVENTS.ONBOARDING_START;
ANALYTICS_EVENTS.ONBOARDING_STEP_VIEW;
ANALYTICS_EVENTS.ONBOARDING_COMPLETE;

// Deep Links
ANALYTICS_EVENTS.DEEP_LINK_OPENED;

// Article/Content
ANALYTICS_EVENTS.ARTICLE_SHARED;

// Stock Operations
ANALYTICS_EVENTS.SEARCH_STOCK;
```

## Mejores Prácticas

### ✅ DO (Hacer)

- Usar constantes de `ANALYTICS_EVENTS` cuando estén disponibles
- Incluir contexto relevante en los parámetros
- Usar `logSelectContent` para clicks en items de listas
- Usar `logError` con tipo específico en lugar de `logEvent('error_...')`
- Trackear success/failure de operaciones críticas
- Sanitizar datos sensibles antes de enviar (emails, tokens, etc.)

### ❌ DON'T (No Hacer)

- No enviar información personal identificable (PII)
- No usar camelCase para nombres de eventos
- No crear eventos genéricos sin contexto
- No trackear cada interacción menor (sobre-tracking)
- No olvidar el try-catch (el servicio ya lo maneja internamente)

## Ejemplos Completos

### Ejemplo 1: Click en Currency Card

```typescript
<ExchangeCard
  {...item}
  onPress={() => {
    analyticsService.logSelectContent('currency', item.code);
    navigation.navigate('CurrencyDetail', { rate: item });
  }}
/>
```

### Ejemplo 2: Búsqueda con Debounce

```typescript
const debouncedSearch = useCallback(
  debounce((text: string) => {
    setDebouncedSearchQuery(text);
    if (text.length >= 2) {
      analyticsService.logSearch(text);
    }
  }, 300),
  [],
);
```

### Ejemplo 3: Refresh con Resultado

```typescript
const onRefresh = async () => {
  setRefreshing(true);
  try {
    await CurrencyService.getRates(true);
    await analyticsService.logDataRefresh('currencies', true);
    showToast('Datos actualizados', 'success');
  } catch (e) {
    await analyticsService.logDataRefresh('currencies', false);
    showToast('Error al actualizar', 'error');
  } finally {
    setRefreshing(false);
  }
};
```

### Ejemplo 4: Feature Usage con Timing

```typescript
const convertCurrency = async () => {
  const endTiming = analyticsService.startTiming('currency_conversion');

  try {
    const result = await performConversion();
    analyticsService.logFeatureUsage('calculator', {
      base_currency: baseCurrency,
      target_currency: targetCurrency,
      success: 'true',
    });
    return result;
  } catch (error) {
    analyticsService.logError('conversion_failed');
  } finally {
    endTiming();
  }
};
```

## Integración con Observability

El `AnalyticsService` está integrado con `ObservabilityService`:

- Todos los eventos se registran como breadcrumbs en Sentry
- Los errores en analytics no interrumpen la aplicación
- Clarity recibe eventos personalizados y tags de contexto
- Firebase Analytics es la fuente principal de datos

## Testing

Los eventos de analytics no se ejecutan en modo `__DEV__` para evitar contaminar datos de producción. Para testing:

```typescript
if (__DEV__) {
  console.log('[Analytics] Would log event:', eventName, params);
}
```

## Dashboard y Reportes

### Firebase Console

- **Eventos en Tiempo Real**: Events > Realtime
- **Reportes Personalizados**: Analysis > Custom Dashboards
- **Funnels**: Analysis > Funnels

### Clarity

- **Grabaciones de Sesión**: Sessions
- **Mapas de Calor**: Heatmaps
- **Filtros por Tag**: Use custom tags para filtrar sesiones

### Sentry

- **Breadcrumbs**: Performance > Transaction Details
- **User Context**: Issues > Event Details

---

**Última actualización**: Enero 30, 2026
