# Guía de Implementación Navigation Components

Este documento registra los estándares y documentación para los componentes de navegación ubicados en `src/components/navigation/`.

## ModernTabBar (Barra de Navegación Inferior)

`ModernTabBar` es el componente personalizado que reemplaza la barra de pestañas nativa de React Navigation.

### Estándares de Diseño (Flat Design)
Para mantener la coherencia con el sistema de diseño plano de la aplicación:

*   **Contenedor Principal (`barBackground`):**
    *   **Bordes:** Eliminados completamente (`borderWidth: 0`) para un diseño limpio y fluido.
    *   **Elevación:** `elevation: 0` y `shadowOpacity: 0` (Sin sombras).
    *   **Fondo:** `theme.colors.elevation.level1` (Coincide con las tarjetas).
    *   **Forma:** `borderTopLeftRadius: 20`, `borderTopRightRadius: 20`.

*   **Indicador Activo:**
    *   Círculo flotante (`translateY: -20`).
    *   Fondo: `theme.colors.primary`.
    *   Icono: `theme.colors.onPrimary` (Para contraste correcto en ambos modos).

### Implementación Técnica
El borde debe aplicarse excluyendo la parte inferior para evitar líneas dobles con la barra de navegación del sistema o cortes visuales extraños.

```typescript
barBackground: {
  // ...
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  borderTopWidth: 1,
  borderLeftWidth: 1,
  borderRightWidth: 1,
  borderBottomWidth: 0,
  borderColor: theme.colors.outline,
  elevation: 0,
  backgroundColor: theme.colors.elevation.level1,
  // ...
}
```

---
*Última actualización: 20 de Enero de 2026*
