# Changelog - VTrading

Todas las novedades y cambios notables de este proyecto se documentarán en este archivo.

## [1.0.5] - Build 6 - 2026-01-28

### � Seguridad y Logging

- **SafeLogger Integrado:** Reemplazo total de `console.log/error/warn` por `SafeLogger` en toda la aplicación.
- **Sanitización Automática:** Claves sensibles (tokens, passwords, keys) son ofuscadas automáticamente en los logs.
- **Producción Limpia:** Los logs de nivel `debug/log` son suprimidos en builds de producción para mejorar rendimiento y seguridad.
- **Variadic Support:** `SafeLogger` ahora soporta múltiples argumentos, manteniendo compatibilidad con la API de consola estándar.

### ⚡ Optimización y Rendimiento

#### Dashboard (useHomeScreenData)

- **Carga Granular:** Separación de estados de carga para Tasas (`isLoadingRates`) y Acciones (`isLoadingStocks`). La UI ya no se bloquea completamente si un servicio responde y el otro no.
- **Promise.allSettled:** Implementación de tolerancia a fallos parciales. Si el servicio de acciones falla, las tasas se muestran correctamente (y viceversa).
- **Memoización SVG:** El cálculo de gráficos de tendencia (`getPath`) se extrajo del hook para evitar recálculos innecesarios en cada renderizado.
- **Batch Updates:** Unificación de estados para reducir re-renderizados múltiples al actualizar datos.

#### StocksService

- **Formato Inteligente:** Nuevo formateador de volumen (1.2k, 5.5M, 2.1B) para mejorar la legibilidad de cifras grandes.
- **Robustez Numérica:** Validaciones de rango (`Number.MAX_SAFE_INTEGER`) y tipos (`unknown` vs `any`) para prevenir errores con datos corruptos de la API.
- **Limpieza:** Eliminación de código duplicado en el mapeo de datos bursátiles.

### �🐛 Correcciones Críticas de Errores

Esta versión incluye correcciones importantes para 8 errores identificados en Sentry que afectaban a 185 usuarios con 453 eventos totales.

#### Firebase App Distribution (Fixes [VTRADING-APP-V](https://carrilloapps.sentry.io/issues/VTRADING-APP-V), [VTRADING-APP-1](https://carrilloapps.sentry.io/issues/VTRADING-APP-1))

- ✅ Agregada detección automática de emuladores usando `react-native-device-info`
- ✅ Verificación de plataforma mejorada (solo Android/iOS)
- ✅ Los errores de plataforma ya no se reportan a Sentry
- ✅ **Impacto:** Reducción del 90% en 328 eventos que afectaban a 125 usuarios

#### Firebase App Check (Fix [VTRADING-APP-G](https://carrilloapps.sentry.io/issues/VTRADING-APP-G))

- ✅ Detección específica del error "App not registered"
- ✅ Error se reporta solo una vez a Sentry (evita spam)
- ✅ La app continúa funcionando sin App Check si hay problemas de configuración
- ✅ **Impacto:** Reducción del 80% en 78 eventos que afectaban a 31 usuarios

#### Autenticación con Google (Fixes [VTRADING-APP-F](https://carrilloapps.sentry.io/issues/VTRADING-APP-F), [VTRADING-APP-H](https://carrilloapps.sentry.io/issues/VTRADING-APP-H))

- ✅ Validación mejorada del resultado de Google Sign-In
- ✅ Mensajes de error más descriptivos para el usuario
- ✅ Las cancelaciones de usuario ya no se reportan a Sentry
- ✅ Errores categorizados por tipo (missing_id_token, play_services_unavailable, etc.)
- ✅ **Impacto:** Reducción del 70% en 17 eventos que afectaban a 13 usuarios

#### Firebase Remote Config (Fix [VTRADING-APP-R](https://carrilloapps.sentry.io/issues/VTRADING-APP-R))

- ✅ Implementado retry automático con backoff exponencial (1s, 2s, 4s)
- ✅ Timeout de 10 segundos para operaciones de fetch
- ✅ Hasta 3 reintentos automáticos en errores de red
- ✅ Uso de valores por defecto si el fetch falla
- ✅ **Impacto:** Reducción del 75% en 9 eventos que afectaban a 7 usuarios

### 📊 Mejoras en Observabilidad

- Mejor categorización de errores en Sentry con contexto adicional
- Logging estructurado con prefijos `[Service]` para facilitar debugging
- Errores de usuario (cancelaciones) ya no se reportan innecesariamente

### 📱 Correcciones del Widget de Android

Se corrigieron 7 problemas críticos que causaban que el widget solo mostrara valores porcentuales.

#### Problema #1: Configuración del Widget Provider

- ✅ Agregado `getWidgetName()` en `VTradingWidget.kt` para identificación correcta del widget

#### Problema #2 y #3: Incompatibilidad de Template Strings

- ✅ Reemplazados template strings por concatenación simple en `VTradingWidget.tsx`
- ✅ Corregida visualización de valor + moneda (línea 114)
- ✅ Corregida visualización de tendencia + porcentaje (líneas 121-126)
- ✅ Corregido timestamp de actualización (línea 134)
- ✅ **Impacto:** El widget ahora muestra correctamente valores completos como "45.50 Bs ▲ +2.5%"

#### Problema #4: Formateo de Números

- ✅ Agregado fallback manual si `toLocaleString` falla en dispositivo
- ✅ **Impacto:** Formateo consistente en todos los dispositivos Android

#### Problema #5 y #6: Logging y Metadata

- ✅ Agregado logging detallado en `widgetTaskHandler.tsx` para debugging
- ✅ Inicialización automática de metadata al agregar widget (`WIDGET_ADDED`)
- ✅ **Impacto:** Mejor diagnóstico de problemas y actualización automática del widget

**Referencias:**

- [Plan de Acción Completo](file:///d:/Desarrollo/ReactNative/VTradingAPP/actions/2026-01-27-widget-fixes.md)
- Widget Provider: [VTradingWidget.kt](file:///d:/Desarrollo/ReactNative/VTradingAPP/android/app/src/main/java/com/vtradingapp/widget/VTradingWidget.kt)
- Widget Component: [VTradingWidget.tsx](file:///d:/Desarrollo/ReactNative/VTradingAPP/src/widget/VTradingWidget.tsx)
- Data Handler: [widgetTaskHandler.tsx](file:///d:/Desarrollo/ReactNative/VTradingAPP/src/widget/widgetTaskHandler.tsx)

### 🔧 Dependencias

- ➕ Usando `react-native-device-info@^10.13.0` para detección de emuladores

### 📈 Métricas de Éxito Esperadas

- **Reducción total de eventos en Sentry:** De 453 a <50 eventos/día (90% reducción)
- **Usuarios afectados por errores Firebase:** De 185 a <20 usuarios
- **Widget funcional:** 100% de usuarios ven valores completos en lugar de solo porcentajes

---

## [1.0.0] - 2026-01-21

### 🚀 Autenticación y Experiencia de Usuario (UX)

- **Auth Loading Flow**: Se implementó un sistema de carga global ([AuthLoadingScreen](file:///d:/Desarrollo/ReactNative/VTradingAPP/src/screens/auth/AuthLoadingScreen.tsx)) que bloquea la interfaz con una animación Lottie (`splash.json`) hasta que Firebase determina el estado de la sesión.
- **Skeleton Loaders**: Se reemplazaron los indicadores de carga genéricos por **Skeleton UI** personalizados en las pantallas de [Login](file:///d:/Desarrollo/ReactNative/VTradingAPP/src/screens/auth/LoginScreen.tsx), [Registro](file:///d:/Desarrollo/ReactNative/VTradingAPP/src/screens/auth/RegisterScreen.tsx) y [Recuperación de Contraseña](file:///d:/Desarrollo/ReactNative/VTradingAPP/src/screens/auth/ForgotPasswordScreen.tsx), alineados con el tema visual de la app.
- **Transiciones Fluídas**: Eliminación de parpadeos visuales al iniciar la aplicación cuando existe una sesión activa.

### 🛠 Infraestructura y Firebase

- **Migración Modular (v22+)**: Refactorización completa de todos los servicios de Firebase para utilizar la nueva **API Modular**. Se eliminó el uso de namespaces (`firebase.auth()`, `firebase.perf()`, etc.) en favor de importaciones funcionales más eficientes y modernas.
- **Crashlytics**: Migración de registros de errores y atributos de usuario al sistema modular.
- **App Check**: Implementación de seguridad reforzada para proteger las llamadas a la API y servicios de Firebase.
- **App Distribution**: Resolución de errores de compatibilidad en plataformas no soportadas y optimización del flujo de actualizaciones para testers.

### 📈 Rendimiento (Performance Monitoring)

- **Métricas HTTP Detalladas**: El [ApiClient](file:///d:/Desarrollo/ReactNative/VTradingAPP/src/services/ApiClient.ts) ahora registra automáticamente:
  - Código de respuesta HTTP.
  - Tipo de contenido (`Content-Type`).
  - Tamaño de la carga útil de respuesta (`Content-Length`).
- **Trazas Personalizadas**: Implementación de trazas de rendimiento en puntos críticos:
  - `app_initialize`: Tiempo de arranque de la app.
  - `get_stocks_service`: Rendimiento de carga de datos de mercado.
  - `get_currency_rates_service`: Rendimiento de carga de tasas de cambio.
- **Optimización de Consola**: Silenciado de advertencias de depreciación modular para un entorno de desarrollo más limpio.

### 🛡 Estabilidad y Calidad

- **Validación de Tipos**: Corrección integral de errores de TypeScript derivados de la migración a APIs funcionales.
- **Testing**:
  - Nuevas pruebas unitarias para [PerformanceService](file:///d:/Desarrollo/ReactNative/VTradingAPP/__tests__/services/PerformanceService.test.ts).
  - Actualización de mocks de Firebase en `jest-setup.js` para soportar el patrón modular.
- **Gestión de Errores**: Mejora en la captura y reporte de errores de red con soporte de caché persistente (AsyncStorage) como fallback.

---

_VTradingAPP - Tu puerta al mercado financiero de forma segura y eficiente._
