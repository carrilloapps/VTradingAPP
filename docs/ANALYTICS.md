# Documentación de Analítica y Privacidad

## Visión General
VTradingAPP utiliza un sistema de analítica dual para comprender el comportamiento del usuario y mejorar la experiencia de la aplicación, respetando estrictamente la privacidad del usuario.

### Herramientas
1.  **Google Analytics 4 (Firebase):** Seguimiento de eventos, conversiones y métricas de uso.
2.  **Microsoft Clarity:** Mapas de calor y reproducción de sesiones para análisis de UX.

## Privacidad y Cumplimiento

### Consentimiento
*   El rastreo se activa **automáticamente** al ingresar a la aplicación, cubierto por los Términos y Condiciones y Política de Privacidad aceptados implícitamente por el usuario al usar el servicio.
*   No se requiere consentimiento explícito adicional (modal).

### Anonimización
*   **IP Anonymization:** Google Analytics anonimiza las direcciones IP por defecto.
*   **Data Masking:** Microsoft Clarity está configurado para enmascarar textos sensibles (`allowMasking: true`).
*   **PII (Información Personal Identificable):**
    *   No se envían nombres, correos electrónicos ni teléfonos a las herramientas de analítica.
    *   El `User ID` utilizado es el UID de Firebase (alfanumérico aleatorio), no vinculado directamente a datos personales en la plataforma de analítica.

## Diccionario de Eventos

### Eventos Automáticos (GA4)
*   `screen_view`: Visualización de pantalla.
*   `first_open`: Primera apertura.
*   `app_remove`: Desinstalación.
*   `session_start`: Inicio de sesión.

### Eventos Personalizados

| Nombre del Evento | Parámetros | Descripción |
| :--- | :--- | :--- |
| `login` | `method` (email, google, anonymous) | Inicio de sesión exitoso. |
| `sign_up` | `method` | Registro de nuevo usuario. |
| `search` | `search_term` | Búsqueda realizada (acciones, divisas). |
| `select_content` | `content_type`, `item_id` | Selección de un elemento (acción, divisa). |
| `update_profile_name` | - | Actualización del nombre de perfil. |
| `toggle_push` | `enabled` (boolean) | Cambio en configuración de notificaciones. |
| `change_theme` | `theme` (light/dark/system) | Cambio de tema visual. |
| `toggle_alert` | `symbol`, `enabled` | Activación/Desactivación de alerta de precio. |
| `delete_alert` | `symbol` | Eliminación de alerta. |
| `calculate_exchange` | `base`, `target`, `amount` | Uso de la calculadora básica. |
| `adv_calc_add_currency` | `currency` | Añadir moneda a calculadora avanzada. |
| `adv_calc_set_base` | `currency` | Cambiar base en calculadora avanzada. |

## Propiedades de Usuario
*   `theme_preference`: Preferencia de tema (Light/Dark).
*   `push_enabled`: Estado de permisos de notificaciones.

## Implementación Técnica
La lógica de analítica está centralizada en `src/services/firebase/AnalyticsService.ts`.
Este servicio actúa como un "Proxy" que:
1.  Envía eventos a Google Analytics.
2.  Refleja ("Mirrors") eventos relevantes a Microsoft Clarity.

