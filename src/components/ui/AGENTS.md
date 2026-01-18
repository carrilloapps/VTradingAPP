# Guía de Implementación UI Components

Este documento registra los estándares y documentación para los componentes UI globales ubicados en `src/components/ui/`.

## CustomDialog (Reemplazo de Alert)

`CustomDialog` es un componente reutilizable diseñado para reemplazar las alertas nativas (`Alert.alert`) y ofrecer una experiencia visual consistente con el tema de la aplicación (Material Design 3 via React Native Paper).

### ¿Cuándo usarlo?
*   Confirmaciones de acciones destructivas (ej. Cerrar sesión, Eliminar cuenta).
*   Mensajes de información importantes que requieren atención del usuario.
*   Cualquier situación donde antes se usaría `Alert.alert`.

### Características
*   **Integración con Tema:** Usa `theme.colors.elevation.level3` para el fondo y colores del tema para textos y botones.
*   **Modo Destructivo:** Propiedad `isDestructive` cambia el color del botón de confirmación a `error` (Rojo).
*   **Portal:** Renderizado a través de `Portal` de React Native Paper para asegurar que aparezca sobre otros elementos.

### Ejemplo de Implementación

```typescript
import React, { useState } from 'react';
import CustomDialog from '../components/ui/CustomDialog';

const MyScreen = () => {
  const [showDialog, setShowDialog] = useState(false);

  const handleConfirm = () => {
    // Lógica de confirmación
    setShowDialog(false);
  };

  return (
    <>
      {/* ... resto del render ... */}
      
      <CustomDialog
        visible={showDialog}
        onDismiss={() => setShowDialog(false)}
        title="Título del Diálogo"
        content="Mensaje descriptivo para el usuario."
        onConfirm={handleConfirm}
        confirmLabel="Aceptar" // Opcional, default: "Aceptar"
        cancelLabel="Cancelar" // Opcional, default: "Cancelar"
        isDestructive={false} // Opcional, default: false
      />
    </>
  );
};
```

### Props

| Prop | Tipo | Requerido | Descripción |
|---|---|---|---|
| `visible` | `boolean` | Sí | Controla la visibilidad del diálogo. |
| `onDismiss` | `() => void` | Sí | Función llamada al cerrar el diálogo (backdrop press o botón cancelar). |
| `title` | `string` | Sí | Título del encabezado. |
| `content` | `string` | Sí | Cuerpo del mensaje. |
| `onConfirm` | `() => void` | Sí | Función ejecutada al presionar el botón de confirmación. |
| `confirmLabel` | `string` | No | Texto del botón de acción principal. Default: 'Aceptar'. |
| `cancelLabel` | `string` | No | Texto del botón de cancelación. Default: 'Cancelar'. |
| `isDestructive` | `boolean` | No | Si es `true`, el botón de confirmación usa color de error. Default: `false`. |

## Skeleton Loader Standard

El sistema de Skeleton Loading se basa en un componente central reutilizable que proporciona la animación y el estilo base.

### Componente `Skeleton.tsx`
Ubicación: `src/components/ui/Skeleton.tsx`

Este componente es un bloque de construcción ("primitive") que renderiza una vista con un gradiente animado (Linear Gradient) moviéndose horizontalmente para simular carga.

*   **Animación:** Loop infinito de `Animated.timing` modificando `translateX` del gradiente.
*   **Theming:**
    *   Utiliza colores definidos en el tema (`theme.colors.skeleton` y `theme.colors.skeletonHighlight`).
    *   **Light Mode:** Tonos grises suaves (`#E1E9EE` / `#F2F8FC`) para integrarse con superficies blancas/grises.
    *   **Dark Mode:** Tonos oscuros (`#2A2A2A` / `#3A3A3A`) para bajo brillo.
*   **Props:**
    *   `width`, `height`: Dimensiones flexibles.
    *   `borderRadius`: Para coincidir con la forma del componente UI real (círculos para avatares, rectángulos redondeados para tarjetas).

### Estrategia de Implementación
No usar `Skeleton` directamente en las pantallas. En su lugar, crear componentes "Skeleton" dedicados (ej. `DashboardSkeleton`, `WalletSkeleton`) que compongan múltiples primitivos `Skeleton` para replicar la estructura exacta del layout final.

---
*Última actualización: 20 de Enero de 2026*
