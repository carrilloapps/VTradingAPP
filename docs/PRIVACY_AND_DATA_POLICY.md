# Política de Privacidad y Gestión de Datos - VTradingAPP

Este documento detalla los permisos solicitados, los datos recolectados y los mecanismos de almacenamiento utilizados en la aplicación VTradingAPP.

## 1. Permisos Solicitados

### Android
| Permiso | Propósito | Tipo |
|---------|-----------|------|
| `INTERNET` | Comunicación con Firebase y la API de VTrading. | Normal |
| `ACCESS_NETWORK_STATE` | Verificación de conectividad antes de realizar peticiones. | Normal |
| `POST_NOTIFICATIONS` | Envío de notificaciones push (Android 13+). | Peligroso (Runtime) |
| `AD_ID` | Identificador de publicidad para analíticas y AdMob (Android 13+). | Normal |

### iOS
| Permiso / Llave | Propósito |
|-----------------|-----------|
| `Push Notifications` | Envío de alertas de precios y noticias. |
| `App Transport Security` | Configuración de excepciones para conexiones seguras. |
| `App Tracking Transparency` | (Implícito por AdMob) Seguimiento de anuncios. |

---

## 2. Datos Recolectados

### A. Autenticación (Firebase Auth)
- **Email y Contraseña**: Utilizados para la creación y gestión de cuentas de usuario.
- **Identidad de Google**: Si el usuario opta por "Sign in with Google".
- **UID de Firebase**: Identificador único interno para vincular datos del usuario.

### B. Analíticas y Rendimiento (Firebase Suite)
- **Eventos de Navegación**: Pantallas visitadas y tiempo de permanencia.
- **Métricas de Red**: URL de peticiones, tiempos de respuesta, códigos de estado y tamaños de carga (vía Firebase Performance).
- **Información del Dispositivo**: Modelo, versión del SO, resolución de pantalla y configuración de idioma.
- **Demografía Técnica**: Versión de la app, número de build, tema (claro/oscuro).
- **Logs de Errores**: Seguimiento de crashes y excepciones (vía Firebase Crashlytics).

### C. Publicidad (Google AdMob)
- **Identificadores de Dispositivo**: Utilizados para mostrar anuncios relevantes (banners) a usuarios no premium.

### D. Notificaciones (FCM)
- **Tokens de Dispositivo**: Para el enrutamiento de mensajes push.
- **Suscripciones a Temas**: Segmentación por SO, versión de app y build.

---

## 3. Almacenamiento de Datos

### Almacenamiento Local (AsyncStorage)
Se utiliza para persistencia rápida y funcionamiento offline parcial.
- **`api_cache_*`**: Caché de tasas de cambio y datos financieros (TTL: 5 min).
- **`app_settings`**: Preferencias de usuario (ej. notificaciones habilitadas).
- **`user_alerts`**: Alertas de precios configuradas por el usuario.
- **`user_notifications`**: Historial local de notificaciones recibidas.
- **`widget_config`**: Configuración de los widgets de pantalla de inicio.

### Almacenamiento Remoto
- **Firebase Auth**: Perfiles de usuario y credenciales.
- **Firebase Console**: Datos agregados de analíticas, rendimiento y errores.
- **VTrading API**: Los datos financieros reales se consumen de `https://vt.isapp.dev/`.

---

## 4. Proveedores de Servicios (Terceros)

1.  **Google / Firebase**: Proveedor principal de infraestructura (Auth, Push, Analytics, Performance).
2.  **Google AdMob**: Proveedor de servicios publicitarios.
3.  **VTrading API**: Proveedor externo de datos de mercado.

---

## 5. Seguridad de los Datos
- **App Check**: Todas las llamadas a la API están protegidas mediante Firebase App Check para evitar accesos no autorizados.
- **Cifrado en Tránsito**: Todas las comunicaciones se realizan bajo el protocolo HTTPS.
- **Minimización**: No se solicitan permisos invasivos como Cámara, Micrófono o Contactos.
