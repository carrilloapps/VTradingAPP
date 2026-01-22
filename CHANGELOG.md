# Changelog - VTradingAPP

Todas las novedades y cambios notables de este proyecto se documentarán en este archivo.

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
*VTradingAPP - Tu puerta al mercado financiero de forma segura y eficiente.*
