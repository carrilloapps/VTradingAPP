# Verificación de Implementación

## 1. Corrección de Advertencias de Metro
Se ha modificado `metro.config.js` para incluir `resolver.sourceExts` y `resolver.mainFields`. Esto debería mitigar los problemas de resolución de paquetes como `@react-native-firebase/app` al priorizar los campos correctos (`react-native`) y manejar extensiones estándar.

## 2. Integración en HomeScreen
*   **Estado de Carga**: Se reemplazó el mock de carga por una llamada real a `CurrencyService.getRates()`.
*   **Datos Reales**: Se transforman los datos de la API para mostrarlos en las `ExchangeCard`.
    *   Si la API retorna `EUR` y `USD`, se mostrarán en la sección principal.
    *   Se maneja el caso de array vacío.
*   **RefreshControl**: Se añadió funcionalidad de "Pull to Refresh".
*   **Manejo de Errores**: Se utiliza `ToastContext` para notificar errores de red sin bloquear la UI.

## 3. Integración en ExchangeRatesScreen
*   **Gestión de Estado**: Se implementó carga (`loading`), error (`error`) y refresco (`refreshing`).
*   **Filtrado**: Se mantiene la lógica de filtrado por búsqueda y tipo (Fiat/Cripto), aplicándola sobre los datos reales.
*   **Feedback Visual**: Se muestran indicadores de carga y mensajes de error con opción de reintentar.

## Próximos Pasos
*   Ejecutar la aplicación con `npm start -- --reset-cache` para aplicar los cambios de Metro.
*   Verificar que las tarjetas en el Home coincidan con los datos de la pantalla de Tasas.
