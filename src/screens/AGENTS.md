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

## Composición y Reutilización
*   **No duplicar UI:** Las pantallas deben actuar principalmente como orquestadores de datos y contenedores de layout.
*   **Componentes Reutilizables:** Si un elemento de UI (como un selector de moneda, una tarjeta de resumen, o un botón de acción específico) aparece en más de una pantalla (ej. `CalculatorScreen` y `AdvancedCalculatorScreen`), **debe** extraerse a un componente compartido en `src/components/`.
    *   *Ejemplo:* `CurrencySelectorButton` se usa tanto en la calculadora simple como en la avanzada.
*   **Consistencia:** Usar los componentes compartidos garantiza que los cambios de diseño se propaguen automáticamente a todas las pantallas.
