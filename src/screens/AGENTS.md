# Estándares de Pantallas (Screens)

## Manejo de Safe Area y Headers Unificados

Para garantizar una experiencia visual correcta y funcional tanto en **Android** como en **iOS** (incluyendo dispositivos con Notch, Dynamic Island o Status Bar translúcida):

*   **Solución Universal (`UnifiedHeader`):**
    *   Este componente implementa internamente `useSafeAreaInsets()` de `react-native-safe-area-context`.
    *   Aplica automáticamente el padding superior necesario (`insets.top`) según el dispositivo y la plataforma.
    *   **Regla de Oro:** No usar lógica condicional de plataforma (`Platform.OS`) para márgenes o paddings superiores. Confiar en los insets calculados automáticamente.

*   **Implementación en Pantallas:**
    *   **Contenedor Raíz:** Usar `View` estándar (no `SafeAreaView`) con `flex: 1`. El `UnifiedHeader` se encargará de proteger el área superior.
    *   **StatusBar:** Debe configurarse como `translucent` y `backgroundColor="transparent"` para permitir que el diseño fluya correctamente detrás de la barra de estado, delegando el espaciado al Header.
    *   **Unificación Visual:** `ExchangeRatesScreen` y `StocksScreen` deben compartir exactamente el mismo layout de encabezado (Título grande alineado a la izquierda, botón de acción secundario a la derecha) para mantener la coherencia al navegar entre pestañas.

### Patrón de Diseño para Encabezados (Header Pattern)
Para mantener la consistencia entre pantallas principales (ej. `StocksScreen`, `ExchangeRatesScreen`), seguir esta estructura estricta:

```tsx
// Estructura JSX
<View style={[styles.headerContainer, { backgroundColor: theme.colors.background }]}>
  <UnifiedHeader
    variant="section"
    title="Título Sección"
    subtitle="Subtítulo opcional"
    onActionPress={handleReload}
    rightActionIcon="refresh" // Icono estandarizado para recarga
    style={styles.headerStyle}
  />
  
  <View style={styles.searchContainer}>
    <SearchBar ... />
  </View>
</View>

// Estilos Estandarizados
const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 16, // Espaciado consistente antes del contenido
    // No usar zIndex a menos que sea estrictamente necesario para sombras
  },
  headerStyle: {
    paddingBottom: 0,      // Eliminar padding interno inferior
    borderBottomWidth: 0,  // Eliminar borde si hay elementos debajo (como SearchBar)
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 8,          // Separación estándar del título
  }
});
```

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
