# Integración de Notificaciones Push (FCM)

Este documento detalla la implementación completa del sistema de notificaciones push en VTradingAPP, incluyendo tipos de mensajes, estructuras de payload, lógica de manejo en primer/segundo plano y ejemplos de prueba.

## Visión General

La aplicación utiliza **Firebase Cloud Messaging (FCM)** junto con `@notifee/react-native` para manejar notificaciones.

*   **Servicio Principal:** `src/services/firebase/FCMService.ts`
*   **Lógica de Negocio (Background):** `src/services/NotificationLogic.ts`
*   **Manejo de UI (Foreground):** `src/components/ui/NotificationController.tsx`
*   **Estado Global:** `src/context/NotificationContext.tsx`

## Tipos de Notificaciones

Existen tres tipos principales de notificaciones manejadas por la aplicación:

### 1. Notificación Estándar (Notification Message)
Mensajes enviados con el campo `notification`. Son manejados automáticamente por el sistema cuando la app está en segundo plano (System Tray) y manualmente cuando está en primer plano.

*   **Uso:** Marketing, avisos generales, actualizaciones de sistema.
*   **Comportamiento:**
    *   **Segundo Plano (Background/Quit):** Muestra notificación de sistema estándar.
    *   **Primer Plano (Foreground):** Muestra un `Toast` informativo (azul). Se agrega al historial de notificaciones.

#### Estructura del Payload
```json
{
  "message": {
    "token": "DEVICE_FCM_TOKEN",
    "notification": {
      "title": "Título del Mensaje",
      "body": "Cuerpo del mensaje informativo."
    },
    "data": {
      "optional_key": "value"
    }
  }
}
```

### 2. Alerta de Precio (Data Message - Silent)
Mensajes de datos silenciosos que contienen información de precios en tiempo real. La app procesa estos datos para verificar si cumplen con alguna **Alerta de Precio** configurada localmente por el usuario.

*   **Uso:** Disparar alertas de precio en tiempo real sin despertar la UI a menos que sea necesario.
*   **Comportamiento:**
    *   **Segundo Plano:** `NotificationLogic.ts` recibe el precio. Verifica `storageService.getAlerts()`. Si se cumple una condición, crea una notificación local usando `Notifee` (Canal: `price_alerts`).
    *   **Primer Plano:** `NotificationController.tsx` recibe el precio. Verifica alertas locales. Si se cumple, muestra un `Toast` de alerta (dorado/amarillo).
    *   **Historial:** Se agrega al historial solo si contiene `title`/`body` o si la lógica interna decide generarlo.

#### Estructura del Payload
**Requisito:** Debe enviarse **SOLO** como `data`. No incluir `notification`.

```json
{
  "message": {
    "token": "DEVICE_FCM_TOKEN",
    "data": {
      "symbol": "BTCUSDT",
      "price": "65432.10"
    }
  }
}
```

### 3. Notificación General Personalizada (Data Message)
Mensajes de datos que simulan una notificación estándar pero permiten mayor control sobre el canal y la importancia en Android.

*   **Uso:** Notificaciones que requieren procesamiento previo o canales específicos (ej. "General").
*   **Comportamiento:**
    *   **Segundo Plano:** `NotificationLogic.ts` detecta `title` y `body` en `data`. Crea una notificación local `Notifee` (Canal: `general`).
    *   **Primer Plano:** Se agrega al historial (`NotificationContext`). **Nota:** Actualmente `NotificationController` no muestra Toast para este tipo específico, solo aparece en la lista.

#### Estructura del Payload
```json
{
  "message": {
    "token": "DEVICE_FCM_TOKEN",
    "data": {
      "title": "Noticia Importante",
      "body": "El mercado ha cerrado por mantenimiento.",
      "type": "market_news" // Opcional, para filtrado futuro
    }
  }
}
```

---

## Canales de Notificación (Android)

La aplicación crea y gestiona los siguientes canales a través de `Notifee` en `src/services/NotificationLogic.ts`:

| ID Canal | Nombre Visible | Importancia | Sonido | Uso |
| :--- | :--- | :--- | :--- | :--- |
| `price_alerts` | Alertas de Precio | HIGH | default | Alertas disparadas localmente por coincidencia de precio. |
| `general` | General | DEFAULT | default | Notificaciones generales enviadas vía Data Message. |

---

## Suscripción a Tópicos (Topics)

El sistema utiliza una estrategia de suscripción a tópicos para segmentación de usuarios y alertas en tiempo real.

### 1. Tópicos Demográficos (Automáticos)
Al iniciar la aplicación y obtener permisos, `FCMService` suscribe automáticamente al dispositivo a tópicos que describen su entorno. Esto permite campañas segmentadas (ej. "Solo usuarios Android 13" o "Solo usuarios con tema oscuro").

**Formato de Tópicos:**
*   `build_[BUILD_NUMBER]` -> ej. `build_100`
*   `os_[OS_NAME]` -> ej. `os_android`, `os_ios`
*   `theme_[COLOR_SCHEME]` -> ej. `theme_dark`, `theme_light`
*   `os_ver_[SYSTEM_VERSION]` -> ej. `os_ver_14_0` (Puntos reemplazados por guion bajo)
*   `app_ver_[APP_VERSION]` -> ej. `app_ver_1_0_0`
*   `cohort_[YEAR]_[MONTH]` -> ej. `cohort_2024_05` (Mes de instalación)

### 2. Tópicos de Alertas de Precio (Dinámicos)
Cuando un usuario crea una alerta de precio para un par o acción, la app se suscribe al tópico de actualizaciones de ese símbolo.
*   **Formato:** `ticker_[SYMBOL_SANITIZED]`
*   **Sanitización:** `symbol.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()`
*   **Ejemplos:**
    *   `BTC/USDT` -> `ticker_btc_usdt`
    *   `AAPL` -> `ticker_aapl`
*   **Lógica de Suscripción:**
    *   **Al Crear/Activar Alerta:** Se suscribe al tópico `ticker_xxx`.
    *   **Al Eliminar/Desactivar Alerta:** Se verifica si existen otras alertas activas para el mismo símbolo. Si no quedan alertas activas para ese símbolo, se desuscribe del tópico para ahorrar batería y datos.
*   **Nota:** El backend envía el precio actual a este tópico. La app recibe el mensaje silencioso, compara el precio con su base de datos local de alertas (`AsyncStorage`) y decide si mostrar la notificación.

### 3. Tópicos de Contenido (Opcionales)
El usuario puede optar por recibir o no cierto tipos de contenido desde la configuración o secciones específicas.
*   `news_updates`: Suscripción a noticias de mercado. Se gestiona desde la pantalla "Descubrir" (DiscoverScreen).

---

## Comandos cURL para Pruebas

Reemplaza `YOUR_SERVER_KEY` (Legacy) o usa el token OAuth2 si usas HTTP v1. Estos ejemplos asumen la API Legacy para simplicidad, pero la estructura del payload JSON es la clave.

### 1. Probar Notificación Estándar
```bash
curl -X POST -H "Authorization: key=YOUR_SERVER_KEY" -H "Content-Type: application/json" -d '{
  "to": "DEVICE_FCM_TOKEN",
  "notification": {
    "title": "Prueba Estándar",
    "body": "Esta es una notificación visible automática."
  }
}' https://fcm.googleapis.com/fcm/send
```

### 2. Probar Alerta de Precio (Simulación)
*Nota: Para verla, debes tener una alerta activa en la app para BTCUSDT que se cumpla con el precio 99000.*

```bash
curl -X POST -H "Authorization: key=YOUR_SERVER_KEY" -H "Content-Type: application/json" -d '{
  "to": "DEVICE_FCM_TOKEN",
  "data": {
    "symbol": "BTCUSDT",
    "price": "99000.00"
  }
}' https://fcm.googleapis.com/fcm/send
```

### 3. Probar Notificación General (Data)
```bash
curl -X POST -H "Authorization: key=YOUR_SERVER_KEY" -H "Content-Type: application/json" -d '{
  "to": "DEVICE_FCM_TOKEN",
  "data": {
    "title": "Mantenimiento",
    "body": "La plataforma estará en mantenimiento a las 00:00."
  }
}' https://fcm.googleapis.com/fcm/send
```

## Gestión del Token FCM y Permisos

### Obtención del Token
*   **Inicio:** La app solicita el token FCM al iniciarse mediante `fcmService.getFCMToken()`.
*   **Refresco:** Se escucha el evento `onTokenRefresh` para manejar actualizaciones del token por parte de Firebase. Actualmente el token se imprime en consola para depuración, pero debería enviarse al backend para asociarlo al usuario.

### Permisos
El servicio `FCMService` maneja la solicitud de permisos de manera diferenciada por plataforma:
*   **iOS:** Solicita permiso explícito (`requestPermission`).
*   **Android >= 13 (Tiramisu):** Solicita el permiso `POST_NOTIFICATIONS` en tiempo de ejecución.
*   **Android < 13:** El permiso se concede automáticamente en la instalación.

---

## Flujo de Navegación

*   **Background/Quit:** Al tocar la notificación, `NotificationContext` detecta la apertura (`getInitialNotification` o `onNotificationOpenedApp`) y navega automáticamente a la pantalla `Notifications`.
*   **Foreground:** El usuario ve el Toast y puede tocarlo (si se implementa la acción) o ir manualmente a la pantalla de notificaciones.
