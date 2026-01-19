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
