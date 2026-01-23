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

## Notas Importantes sobre Símbolos vs Tópicos

Es crucial distinguir entre el nombre del **Topic** de suscripción y el valor del **Symbol** dentro del payload JSON, ya que la aplicación realiza validaciones estrictas.

### Regla de Oro
*   **Topic (Canal de Envío):** Siempre sanitizado (minúsculas, sin caracteres especiales, espacios reemplazados por `_`).
*   **Payload `symbol` (Dato de Lógica):** Siempre idéntico al formato visual de la app (Mayúsculas, con `/` para pares, puntos para acciones).

| Caso | Símbolo en App (Payload) | Tópico FCM (Canal) | Razón |
| :--- | :--- | :--- | :--- |
| **Par Divisas** | `VES/USD` | `ticker_ves_usd` | La app compara `a.symbol === "VES/USD"` para disparar la alerta. |
| **Par Divisas (Inverso)** | `COP/VES` | `ticker_cop_ves` | Inverso de VES/COP. **OJO:** Son instrumentos diferentes con Topics diferentes. |
| **Par Divisas** | `VES/COP` | `ticker_ves_cop` | Si envías solo "COP", la comparación falla. |
| **Cripto** | `BTC/USDT` | `ticker_btc_usdt` | Igual que divisas, requiere el par completo. |
| **Acción** | `ABC.A` | `ticker_abc_a` | El punto se reemplaza en el topic, pero debe mantenerse en el payload. |
| **Índice** | `IBC` | `ticker_ibc` | Símbolos simples coinciden (salvo mayúsculas/minúsculas). |

---

## Ejemplos de Segmentación por Tópicos

A continuación se detallan ejemplos prácticos de payloads para enviar notificaciones a segmentos específicos de usuarios.

### 1. Usuarios en "Modo Claro" (Marketing)
Enviar una promoción visual solo a usuarios que usan el tema claro (`theme_light`).

```bash
curl -X POST -H "Authorization: key=YOUR_SERVER_KEY" -H "Content-Type: application/json" -d '{
  "to": "/topics/theme_light",
  "notification": {
    "title": "¡Protege tu vista!",
    "body": "Prueba nuestro nuevo Modo Oscuro en Configuración."
  },
  "data": {
    "screen": "Settings"
  }
}' https://fcm.googleapis.com/fcm/send
```

### 2. Alerta de Precio: VES/USD (Data Message)
Actualización de precio para usuarios siguiendo la tasa del Bolívar respecto al Dólar (inverso).
*   **Topic:** `ticker_ves_usd` (Sanitizado de `VES/USD`)
*   **Payload:** Data Message silencioso.

```bash
curl -X POST -H "Authorization: key=YOUR_SERVER_KEY" -H "Content-Type: application/json" -d '{
  "to": "/topics/ticker_ves_usd",
  "data": {
    "symbol": "VES/USD",
    "price": "0.0275"
  }
}' https://fcm.googleapis.com/fcm/send
```

### 3. Alerta de Precio: VES/COP (Data Message)
Actualización para el par Bolívar/Peso Colombiano.
*   **Topic:** `ticker_ves_cop` (Sanitizado de `VES/COP`)

```bash
curl -X POST -H "Authorization: key=YOUR_SERVER_KEY" -H "Content-Type: application/json" -d '{
  "to": "/topics/ticker_ves_cop",
  "data": {
    "symbol": "VES/COP",
    "price": "115.50"
  }
}' https://fcm.googleapis.com/fcm/send
```

### 4. Alerta de Precio: COP/VES (Inverso)
**Caso Común de Error:** `COP/VES` (Pesos por Bolívar) es un instrumento distinto a `VES/COP`.
*   **Topic:** `ticker_cop_ves`
*   **Symbol:** `COP/VES`

```bash
curl -X POST -H "Authorization: key=YOUR_SERVER_KEY" -H "Content-Type: application/json" -d '{
  "to": "/topics/ticker_cop_ves",
  "data": {
    "symbol": "COP/VES",
    "price": "0.13"
  }
}' https://fcm.googleapis.com/fcm/send
```

### 5. Alerta de Stock: ABC.A (Data Message)
Actualización de precio para una acción específica (ej. `ABC.A`).
*   **Topic:** `ticker_abc_a` (El punto `.` se reemplaza por `_`)

```bash
curl -X POST -H "Authorization: key=YOUR_SERVER_KEY" -H "Content-Type: application/json" -d '{
  "to": "/topics/ticker_abc_a",
  "data": {
    "symbol": "ABC.A",
    "price": "45.20"
  }
}' https://fcm.googleapis.com/fcm/send
```

---

### 3. Optimización de Tópicos y Desuscripción
El sistema está diseñado para ser eficiente en el uso de datos y batería:

1.  **Un Tópico para Múltiples Alertas:**
    *   Si tienes 2 alertas para `COP/VES` (una "Sube de 0.15" y otra "Baja de 0.10"), el dispositivo **SOLO se suscribe una vez** al canal `ticker_cop_ves`.
    *   Cuando llega un mensaje con el precio actual, la app verifica internamente ambas condiciones.
    *   **Resultado:** Funciona perfectamente para subida y bajada simultáneamente.

2.  **Desuscripción Inteligente:**
    *   Al borrar o desactivar una alerta, el sistema verifica si tienes **otras alertas activas** para ese mismo símbolo.
    *   **Si quedan alertas:** Mantiene la suscripción al tópico (para que las otras sigan funcionando).
    *   **Si NO quedan alertas:** Se desuscribe automáticamente del tópico en FCM para ahorrar recursos.

## Solución de Problemas (Troubleshooting)

### 1. La notificación no llega (Alertas de Precio)
*   **Verificar Topic:** ¿Estás enviando al topic correcto?
    *   Si la alerta es `COP/VES` -> Topic: `ticker_cop_ves`.
    *   Si envías a `ticker_ves_cop`, el dispositivo NO recibirá nada porque no está suscrito a ese canal inverso.
*   **Verificar Symbol:** ¿El `symbol` en el JSON es IDÉNTICO al de la alerta?
    *   La app compara `alert.symbol === payload.symbol`.
    *   `COP/VES` !== `VES/COP`.
*   **Verificar Suscripción:**
    *   Si acabas de crear la alerta y no funciona, prueba desactivar y activar el switch de la alerta. Esto fuerza una re-suscripción al topic en FCM.
*   **Verificar Condición:** La app recibe el mensaje silencioso pero solo muestra la notificación visual SI se cumple la condición (Mayor o Menor al precio objetivo).
    *   Ejemplo: Alerta "Baja de 0.15". Payload precio "0.13". 0.13 < 0.15 -> **DISPARA**.
    *   Ejemplo: Alerta "Baja de 0.15". Payload precio "0.16". 0.16 > 0.15 -> **IGNORA**.

### 2. Notificación llega pero no se muestra
*   **Foreground:** Revisa si aparece el Toast dorado.
*   **Background:** Revisa si se generó la notificación de sistema.
*   **Condición:** Si el precio recibido no cruza el umbral definido por el usuario, la app descarta el mensaje silenciosamente (comportamiento esperado).

---

## Flujo de Navegación

*   **Background/Quit:** Al tocar la notificación, `NotificationContext` detecta la apertura (`getInitialNotification` o `onNotificationOpenedApp`) y navega automáticamente a la pantalla `Notifications`.
*   **Foreground:** El usuario ve el Toast y puede tocarlo (si se implementa la acción) o ir manualmente a la pantalla de notificaciones.
