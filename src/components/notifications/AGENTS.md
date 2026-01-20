# Guía de Implementación: Componentes de Notificaciones

Este directorio contiene los componentes relacionados con la gestión y visualización de notificaciones del sistema, alertas de precios y noticias.

## NotificationCard

Componente principal para visualizar una notificación individual.

### Características
*   **Diseño:** Estilo "Card" plano (Flat Design) acorde al sistema de diseño.
*   **Swipeable:** Soporta gesto de deslizamiento a la derecha para archivar.
*   **Iconografía Dinámica:** Cambia el icono y color de fondo según el `type` y `trend` de la notificación.
*   **Estado:** Visualización diferenciada para leídas/no leídas (cambio de fondo/elevación).

### Props

| Prop | Tipo | Descripción |
|Ref|---|---|
| `notification` | `NotificationData` | Objeto de datos de la notificación. |
| `onPress` | `() => void` | Acción al tocar la tarjeta (marcar como leída/navegar). |
| `onArchive` | `() => void` | Acción al deslizar para archivar. |

### Tipos de Notificación (`type`)
*   `price_alert`: Alertas de subida/bajada de precios (Icono: `payments`, Badge: Flecha).
*   `market_news`: Noticias del mercado (Icono: `show-chart`).
*   `system`: Mensajes del sistema (Icono: `campaign`).

### Ejemplo de Uso

```tsx
import NotificationCard from './NotificationCard';

<NotificationCard
  notification={{
    id: '1',
    type: 'price_alert',
    title: 'Alerta BCV',
    message: 'El precio subió...',
    timestamp: '9:41 AM',
    isRead: false,
    trend: 'up'
  }}
  onPress={() => handleRead('1')}
  onArchive={() => handleArchive('1')}
/>
```

## Pantalla de Notificaciones (`NotificationsScreen`)

La pantalla principal implementa:
*   **Header Personalizado:** Sticky header con búsqueda y filtros (Chips).
*   **Tabs:** Separación entre "No leídas" y "Leídas".
*   **Filtros:** Por categoría (Todas, Tasas, Acciones, Generales).
*   **Búsqueda:** Filtrado en tiempo real por título/mensaje.

Esta pantalla está registrada en el `RootStack` (modal) y no en el `MainTabNavigator` para permitir superposición sobre la interfaz principal.

## NotificationDetailModal

Modal de detalle para visualizar el contenido completo de una notificación.

### Estándares de Diseño
Este componente utiliza `BottomSheetModal` para presentar la información detallada, siguiendo el patrón de "Bottom Sheet" moderno solicitado.

*   **Componente Base:** `BottomSheetModal` (src/components/ui/BottomSheetModal.tsx).
*   **Animación:** `slide` (Despliegue desde abajo hacia arriba).
*   **Indicador Visual:** Incluye una barra superior ("Handle Bar") que indica visualmente que es un elemento modal deslizable.
*   **Contenedor de Datos:**
    *   Para mostrar pares Clave-Valor (ej. Divisa - Precio), se utiliza un contenedor con fondo `theme.colors.surfaceVariant`.
    *   Bordes redondeados (12px) para separar visualmente los datos del mensaje principal.
*   **Botones de Acción (Layout Vertical):**
    *   **ARCHIVAR:** `contained-tonal` (Acción principal no destructiva).
    *   **ELIMINAR:** `contained` con color `error` (Acción destructiva).
    *   **CERRAR:** `outlined` (Acción de cancelación).

### Props

| Prop | Tipo | Descripción |
|---|---|---|
| `visible` | `boolean` | Controla la visibilidad. |
| `notification` | `Notification` | Objeto de notificación a mostrar. |
| `onDismiss` | `() => void` | Callback al cerrar el modal. |
| `onDelete` | `(id: string) => void` | Acción de eliminar. |
| `onArchive` | `(id: string) => void` | Acción de archivar. |
