# Guía de Implementación UI Components

Este documento registra los estándares y documentación para los componentes UI globales ubicados en `src/components/ui/`.

## TopToast (Notificaciones In-App)

`TopToast` es un componente de notificación visual diseñado para aparecer en la parte superior de la pantalla ("Toast Superior"). Se utiliza para alertas críticas, actualizaciones de estado y notificaciones push recibidas mientras la app está en primer plano.

### ¿Cuándo usarlo?
*   Notificaciones Push recibidas en primer plano (ej. Alertas de Precio).
*   Feedback de operaciones exitosas que requieren alta visibilidad (ej. "Orden Ejecutada").
*   Alertas de error de sistema.

### Integración (Context API)
El componente se gestiona globalmente a través de `ToastContext`. No se debe instanciar manualmente. Usar el hook `useToast()`.

```typescript
import { useToast } from '../context/ToastContext';

const MyComponent = () => {
  const { showToast } = useToast();

  const handleAlert = () => {
    // Notificación Simple (Bottom/Default)
    showToast("Mensaje simple");

    // Notificación Superior (TopToast)
    showToast("Precio de BTC alcanzó $50k", {
        type: 'alert',
        position: 'top',
        title: 'Alerta de Precio',
        duration: 5000
    });
  };
};
```

### Tipos de Toast (`type`)
*   `info`: (Default) Azul/Neutro. Información general.
*   `success`: Verde. Operaciones exitosas.
*   `error`: Rojo. Errores críticos.
*   `warning`: Naranja. Advertencias.
*   `alert`: Amarillo/Dorado. Específico para alertas de precio/sistema.

### Arquitectura de Notificaciones
El sistema utiliza `NotificationController` (dentro de `App.tsx`) para escuchar mensajes de Firebase (FCM) en primer plano y disparar automáticamente `TopToast`.

---

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

## FilterSection (Selector de Filtros)

Componente unificado para mostrar opciones de filtrado en formato de "Chips". Soporta modos de scroll horizontal y envoltura (wrap).

### Características
*   **Animaciones:** Soporte integrado para `LayoutAnimation` al seleccionar.
*   **Modos de Visualización:** 
    *   `scroll`: Lista horizontal desplazable (Ideal para muchas categorías, ej. Stocks).
    *   `wrap`: Lista que se ajusta al ancho disponible (Ideal para pocas opciones, ej. Tasas de cambio).
*   **Estilo Unificado:** Chips con bordes ligeros en estado inactivo y fondo sólido (Primary) en estado activo.
*   **Contraste Accesible:** En estado activo, utiliza `theme.colors.onPrimary` para texto e iconos, asegurando legibilidad en ambos temas (Claro/Oscuro).

### Props
| Prop | Tipo | Requerido | Descripción |
|---|---|---|---|
| `options` | `FilterOption[]` | Sí | Array de objetos `{ label: string, value: string }`. |
| `selectedValue` | `string` | Sí | Valor actualmente seleccionado. |
| `onSelect` | `(value: string) => void` | Sí | Callback al seleccionar una opción. |
| `mode` | `'scroll' \| 'wrap'` | No | Modo de visualización. Default: `'scroll'`. |
| `visible` | `boolean` | No | Controla si el componente se renderiza. Default: `true`. |
| `style` | `StyleProp<ViewStyle>` | No | Estilos personalizados para el contenedor (ej. márgenes). |

## SearchBar (Barra de Búsqueda Universal)

Componente estandarizado para inputs de búsqueda con soporte opcional para acciones de filtro y sugerencias.

### Características Clave
*   **Estilo Flat:** Utiliza `elevation: 0`, `borderWidth: 1` y colores del tema para integrarse con el estándar de diseño plano.
*   **Filtro Condicional:** El icono de filtro ("tune") **solo se renderiza si se proporciona la prop `onFilterPress`**.
    *   Si `onFilterPress` es `undefined`, el icono no ocupa espacio ni se muestra.
*   **Sugerencias:** Soporte integrado para mostrar una lista desplegable de sugerencias.

### Props Destacadas
| Prop | Tipo | Descripción |
|---|---|---|
| `onFilterPress` | `() => void` | **Opcional.** Callback para el botón de filtro. Si se omite, el botón se oculta. |
| `suggestions` | `string[]` | Lista de sugerencias a mostrar al escribir. |
| `onSuggestionPress` | `(item: string) => void` | Callback al seleccionar una sugerencia. |

---
*Última actualización: 20 de Enero de 2026*

## CustomDialog (Estándar Global)

`CustomDialog` es el componente unificado para todos los diálogos de la aplicación, diseñado para seguir estrictamente el estándar "Flat Design" con un enfoque visual claro mediante un fondo oscurecido.

### Características Obligatorias
*   **Diseño Plano (Flat):** Sin elevación (`elevation: 0`), bordes de 1px (`borderColor: theme.colors.outline`).
*   **Fondo de Enfoque (Overlay):** Todos los diálogos utilizan automáticamente un fondo oscurecido al 80% (`theme.colors.backdrop`) para centrar la atención, tanto en modo claro como oscuro.
*   **Estilo de Botones Estandarizado:**
    *   **Cancelar:** Debe ser estilo `outlined` (`cancelMode="outlined"`).
    *   **Confirmar:** Debe ser estilo `contained`.
    *   **Disposición:** Deben ocupar todo el ancho disponible (`fullWidthActions={true}`).

### Uso Estándar

```typescript
<CustomDialog
  visible={visible}
  onDismiss={onDismiss}
  title="Título del Diálogo"
  onConfirm={handleConfirm}
  confirmLabel="Aceptar"
  cancelLabel="Cancelar"
  showCancel={true}
  confirmLoading={loading}
  cancelMode="outlined"      // OBLIGATORIO: Bordeado
  fullWidthActions={true}    // OBLIGATORIO: Ancho completo
>
  {/* Contenido personalizado opcional */}
  <View>...</View>
</CustomDialog>
```

## LogoutDialog (Diálogo de Cierre de Sesión)

Componente especializado que implementa `CustomDialog` con la configuración estandarizada para acciones destructivas.

### Implementación

```typescript
import LogoutDialog from '../components/settings/LogoutDialog';

// ...

<LogoutDialog
  visible={showLogoutDialog}
  onDismiss={() => setShowLogoutDialog(false)}
  onConfirm={handleLogout}
/>
```

## GenericDeleteDialog (Confirmación de Eliminación)

Componente genérico para confirmar acciones destructivas (eliminar elementos), siguiendo el mismo patrón visual de alto impacto que `LogoutDialog`.

### Props
| Prop | Tipo | Requerido | Descripción |
|---|---|---|---|
| `visible` | `boolean` | Sí | Controla la visibilidad. |
| `onDismiss` | `() => void` | Sí | Callback al cancelar. |
| `onConfirm` | `() => void` | Sí | Callback al confirmar la eliminación. |
| `title` | `string` | No | Título del diálogo (Default: "Confirmar eliminación"). |
| `description` | `string` | No | Mensaje descriptivo (Default: "Esta acción no se puede deshacer..."). |
| `entityName` | `string` | No | Nombre del elemento a eliminar para personalizar el mensaje. |

### Uso
Recomendado para reemplazar `Alert.alert` en acciones de borrado.

