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

---
*Última actualización: 20 de Enero de 2026*
