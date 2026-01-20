# Guía de Implementación: Componentes de Configuración (Settings)

Este directorio contiene los componentes utilizados en la pantalla de configuración y preferencias del usuario.

## AddAlertDialog (Estándar de Referencia)

Este componente es el **ESTÁNDAR DE REFERENCIA (Gold Standard)** para todos los diálogos de formulario en la aplicación. Cualquier otro modal o diálogo que contenga inputs y botones de acción debe replicar sus estilos.

### Estándares Visuales Clave
*   **Inputs:**
    *   Fondo: `theme.colors.surfaceVariant`.
    *   Bordes: Redondeados (12px - `borderTopLeftRadius`, etc. manual o via theme).
    *   Placeholder: `theme.colors.onSurfaceVariant`.
    *   Texto: `theme.colors.onSurface`.
*   **Botones:**
    *   **Primario (Guardar/Acción):** `mode="contained"`, `buttonColor={theme.colors.primary}`, `textColor={theme.colors.onPrimary}`.
    *   **Secundario (Cancelar/Archivar):** `mode="outlined"`, `borderColor={theme.colors.primary}`, `textColor={theme.colors.primary}`. **IMPORTANTE:** No usar gris, usar el color primario para denotar interactividad.
    *   **Dimensiones:** Altura fija y bordes redondeados consistentes.

### Ejemplo de Estructura

```tsx
<UniversalDialog visible={...}>
  <View style={styles.content}>
    {/* Inputs con fondo surfaceVariant */}
    <TextInput
      style={{ backgroundColor: theme.colors.surfaceVariant }}
      // ...
    />
    
    {/* Botones alineados a la derecha */}
    <View style={styles.actions}>
      <Button mode="outlined" textColor={theme.colors.primary} style={{ borderColor: theme.colors.primary }}>
        CANCELAR
      </Button>
      <Button mode="contained" buttonColor={theme.colors.primary}>
        GUARDAR
      </Button>
    </View>
  </View>
</UniversalDialog>
```

## ThemeSelector

Componente para la selección del tema de la aplicación (Claro / Oscuro / Sistema).

### Características
*   **Visualización:** Muestra tarjetas seleccionables con previsualización de colores.
*   **Interacción:** Usa `TouchableOpacity` para selección.
*   **Estado Activo:** Indica la selección actual con un borde `primary` y un icono de check.

### Props

| Prop | Tipo | Descripción |
|---|---|---|
| `currentTheme` | `'light' \| 'dark' \| 'system'` | Tema actual seleccionado. |
| `onSelect` | `(theme: 'light' \| 'dark' \| 'system')` | Callback al seleccionar un tema. |
