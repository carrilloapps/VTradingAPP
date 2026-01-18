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
    *   **Unificación Visual:** `ExchangeRatesScreen` y `StocksScreen` deben compartir exactamente el mismo layout de encabezado y estructura de contenido.
    *   **Ubicación de Filtros:** Los componentes de filtro (como `FilterSection`) deben ubicarse **dentro del ScrollView de contenido**, no fijos en el header. Esto evita problemas de espaciado y permite que los filtros se desplacen con la lista.

### Patrón de Diseño para Encabezados (Header Pattern)
Para mantener la consistencia entre pantallas principales (ej. `StocksScreen`, `ExchangeRatesScreen`), seguir esta estructura estricta:

```tsx
// Estructura JSX
<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
  {/* Header Fijo */}
  <View style={[styles.headerContainer, { backgroundColor: theme.colors.background }]}>
    <UnifiedHeader
      variant="section"
      title="Título Sección"
      subtitle="Subtítulo"
      onActionPress={handleReload}
      rightActionIcon="refresh"
      style={styles.headerStyle}
    />
    
    <View style={styles.searchContainer}>
      <SearchBar 
        value={query}
        onChangeText={setQuery}
        placeholder="..."
        // Icono de filtro condicional:
        // Pasar undefined para ocultar el icono (ej. StocksScreen)
        // Pasar función para mostrarlo (ej. ExchangeRatesScreen)
        onFilterPress={showFiltersToggle ? handleToggle : undefined}
      />
    </View>
  </View>

  {/* Contenido Scrollable */}
  <ScrollView 
    style={styles.content} 
    contentContainerStyle={styles.scrollContent}
  >
    {/* Filtros dentro del scroll */}
    <FilterSection 
      options={...} 
      visible={showFilters} 
      mode="wrap" // o "scroll"
    />
    
    {/* Lista de Datos */}
    {data.map(...)}
  </ScrollView>
</View>

// Estilos Estandarizados
const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 16, // Espaciado consistente antes del contenido
  },
  headerStyle: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  scrollContent: {
    paddingBottom: 100, // Espacio para FAB o TabBar
    // NO usar paddingTop aquí para evitar huecos extraños
  }
});
```

### Estándares de Espaciado (Spacing Standards)
Para mantener una armonía visual entre pantallas:

*   **Espacio Header-Contenido:** El espacio visual entre el Input de Búsqueda y el primer elemento del contenido desplazable (ej. `MarketStatus`, `FilterSection`) debe ser de aproximadamente **20px** (`theme.spacing.xl`).
    *   Esto se logra combinando `headerContainer.paddingBottom: 16` (`theme.spacing.l`) con el margen superior del primer componente.
    *   Si el primer componente es `FilterSection`, usar la prop `style={{ marginTop: theme.spacing.xs }}` (4px) para ajustar el margen por defecto (12px) y alcanzar el total de 20px.

## Lógica de Presentación de Datos

### Listados de Tasas y Acciones
*   **Filtrado de Moneda Base:** Al mostrar listados completos de tasas (ej. `ExchangeRatesScreen`), se debe **filtrar explícitamente** la moneda base (VES) si el servicio la devuelve.
    *   Mostrar "VES/VES = 1" es redundante y aporta poco valor al usuario final en una vista de lista.
    *   *Implementación:* `const displayRates = data.filter(r => r.code !== 'VES');`
*   **Servicios de Datos:** Utilizar `CurrencyService` y `StocksService` para obtener datos, evitando lógica de fetch directa en las pantallas.

### Estados de Carga y Error
*   Gestionar estados de `loading`, `error` y `empty` (sin resultados) de forma visualmente distinta.
*   Usar `RefreshControl` en `ScrollView` para permitir recarga manual.

## Composición y Reutilización
*   **No duplicar UI:** Las pantallas deben actuar principalmente como orquestadores de datos y contenedores de layout.
*   **Componentes Reutilizables:** Si un elemento de UI (como un selector de moneda, una tarjeta de resumen, o un botón de acción específico) aparece en más de una pantalla (ej. `CalculatorScreen` y `AdvancedCalculatorScreen`), **debe** extraerse a un componente compartido en `src/components/`.
    *   *Ejemplo:* `CurrencySelectorButton` se usa tanto en la calculadora simple como en la avanzada.
*   **Consistencia:** Usar los componentes compartidos garantiza que los cambios de diseño se propaguen automáticamente a todas las pantallas.
