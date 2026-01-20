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

### Estándares de Diseño (Coherencia con AddAlertDialog)
Este componente sigue estrictamente los lineamientos visuales de `AddAlertDialog` para garantizar consistencia entre diálogos y modales.

*   **Animación:** `slide-down` (Despliegue desde arriba) usando `Animated.View`.
*   **Contenedor de Datos:**
    *   Para mostrar pares Clave-Valor (ej. Divisa - Precio), se utiliza un contenedor con fondo `theme.colors.surfaceVariant`.
    *   Bordes redondeados (12px) para coincidir con los Inputs de formularios.
*   **Botones de Acción:**
    *   **Archivar:** Estilo `outlined` con `borderColor: theme.colors.primary` y texto `primary`.
    *   **Eliminar:** Estilo `contained` con color de error/advertencia si aplica, o secundario.
*   **Indicador Superior:** Barra pequeña (`drag handle`) en la parte superior para indicar que es deslizable/modal.

### Props

| Prop | Tipo | Descripción |
|---|---|---|
| `visible` | `boolean` | Controla la visibilidad. |
| `notification` | `Notification` | Objeto de notificación a mostrar. |
| `onDismiss` | `() => void` | Callback al cerrar el modal. |
| `onDelete` | `(id: string) => void` | Acción de eliminar. |
| `onArchive` | `(id: string) => void` | Acción de archivar. |
