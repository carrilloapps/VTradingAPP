# Guía de Implementación Navigation Components

Este documento registra los estándares y documentación para los componentes de navegación ubicados en `src/components/navigation/`.

## ModernTabBar (Barra de Navegación Inferior)

`ModernTabBar` es el componente personalizado que reemplaza la barra de pestañas nativa de React Navigation.

### Estándares de Diseño (Flat Design)
Para mantener la coherencia con el sistema de diseño plano de la aplicación:

*   **Contenedor Principal (`barBackground`):**
    *   **Bordes:** `borderWidth: 1` (continuo en todos los lados) con `borderColor: theme.colors.outline`.
    *   **Elevación:** `elevation: 0` y `shadowOpacity: 0` (Sin sombras).
    *   **Fondo:** `theme.colors.elevation.level1` (Coincide con las tarjetas).
    *   **Forma:** `borderTopLeftRadius: 20`, `borderTopRightRadius: 20`.

*   **Indicador Activo:**
    *   Círculo flotante (`translateY: -20`).
    *   Fondo: `theme.colors.primary`.
    *   Icono: `theme.colors.onPrimary` (Para contraste correcto en ambos modos).

### Implementación Técnica
El borde debe aplicarse como `borderWidth: 1` (no solo `borderTopWidth`) para asegurar que la línea del borde siga la curvatura de las esquinas redondeadas superiores, cerrando visualmente el contenedor.

```typescript
barBackground: {
  // ...
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  borderWidth: 1, // Crucial para bordes curvos completos
  borderColor: theme.colors.outline,
  elevation: 0,
  backgroundColor: theme.colors.elevation.level1,
  // ...
}
```

---
*Última actualización: 20 de Enero de 2026*
