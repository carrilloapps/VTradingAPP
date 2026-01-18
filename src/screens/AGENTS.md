# Estándares de Pantallas (Screens)

## Manejo de Safe Area y Status Bar

Para garantizar una visualización correcta en dispositivos con `StatusBar` translúcida (especialmente en Android):

*   **Contenedor Principal:** Usar `SafeAreaView` como contenedor raíz.
*   **Android Translucent:** Si se usa `translucent={true}` en el `StatusBar`, el contenido puede quedar detrás de la barra de estado.
    *   **Solución:** Añadir `paddingTop` condicional en el contenedor del header o contenido superior.
    *   ```typescript
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
        ```
    *   Esto asegura que el header respete el área de notificaciones sin romper el diseño "edge-to-edge" en iOS.

## Lógica de Presentación de Datos

### Listados de Tasas de Cambio
*   **Filtrado de Moneda Base:** Al mostrar listados completos de tasas (ej. `ExchangeRatesScreen`), se debe **filtrar explícitamente** la moneda base (VES) si el servicio la devuelve.
    *   Mostrar "VES/VES = 1" es redundante y aporta poco valor al usuario final en una vista de lista.
    *   *Implementación:* `const displayRates = data.filter(r => r.code !== 'VES');`

### Estados de Carga y Error
*   Gestionar estados de `loading`, `error` y `empty` (sin resultados) de forma visualmente distinta.
*   Usar `RefreshControl` en `ScrollView` para permitir recarga manual.
