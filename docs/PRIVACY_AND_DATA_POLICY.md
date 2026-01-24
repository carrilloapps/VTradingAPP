# Política de Privacidad y Gestión de Datos

## 1. Introducción y Alcance

### Propósito
Esta Política de Privacidad describe de manera exhaustiva y técnica cómo **VTradingAPP** ("nosotros", "la aplicación") recopila, utiliza, almacena, comparte y protege la información de sus usuarios. Este documento ha sido elaborado para cumplir con los más altos estándares de transparencia y normativas internacionales (GDPR, CCPA).

### Alcance
Esta política cubre el uso de la aplicación móvil **VTradingAPP** (Android e iOS) y todos sus servicios integrados. Al instalar y utilizar la aplicación, usted acepta el procesamiento de datos descrito a continuación.

### Última Actualización
**Fecha:** 24 de Enero de 2026
**Versión:** 2.1 (Revisión técnica completa de dependencias y flujos de datos).

---

## 2. Descripción Detallada de la Aplicación

### Función Principal
VTradingAPP es una plataforma financiera informativa que provee tasas de cambio en tiempo real (BCV, Paralelo, Cripto), herramientas de conversión (calculadoras) y monitoreo del mercado bursátil venezolano.

### Arquitectura y Tecnología
La aplicación opera bajo una arquitectura "Serverless" y utiliza servicios de terceros para su infraestructura.
*   **Frontend:** React Native 0.83 (TypeScript).
*   **Identidad:** Google Firebase Authentication.
*   **Base de Datos:** Firebase Cloud Firestore & Realtime Database.
*   **Analítica:** Google Analytics 4 (GA4) y Microsoft Clarity.
*   **Observabilidad:** Sentry y Firebase Crashlytics.
*   **Publicidad:** Google AdMob.
*   **Seguridad:** Firebase App Check.

---

## 3. Recopilación de Datos

A continuación, detallamos cada tipo de dato recopilado, su fuente y la tecnología involucrada.

### A. Datos de Identificación (Usuario)
Estos datos son proporcionados voluntariamente por el usuario al registrarse.
*   **Tipos de Datos:**
    *   Dirección de correo electrónico.
    *   Nombre completo (o alias).
    *   Foto de perfil (URL).
    *   Identificador Único de Usuario (Firebase UID).
*   **Fuente:** Formularios de registro o Proveedores de Identidad (Google Sign-In).
*   **SDK Involucrado:** `@react-native-firebase/auth`, `@react-native-google-signin/google-signin`.
*   **Finalidad:** Creación de cuenta, sincronización de perfil y personalización.

### B. Datos Técnicos del Dispositivo
Recopilados automáticamente para asegurar la compatibilidad y seguridad.
*   **Tipos de Datos:**
    *   Modelo del dispositivo (ej. Samsung S23, iPhone 14).
    *   Sistema Operativo y versión (ej. Android 14, iOS 17).
    *   Identificador de Publicidad (AD_ID / IDFA).
    *   Dirección IP (Anonimizada en sistemas analíticos).
    *   Estado de la red (WiFi/4G).
    *   Token de Integridad (App Check Token).
*   **SDK Involucrado:** `react-native-device-info`, `@react-native-firebase/app-check`.
*   **Finalidad:** Diagnóstico de errores, prevención de fraude (bots), entrega de publicidad.

### C. Datos de Uso y Comportamiento (Analítica)
Recopilados para entender cómo se interactúa con la aplicación.
*   **Tipos de Datos:**
    *   **Eventos de Navegación:** Vistas de pantalla (`screen_view`), tiempo de permanencia.
    *   **Interacciones:** Clics en botones, uso de calculadora, términos de búsqueda (`search`), selección de activos (`select_content`).
    *   **Grabaciones de Sesión:** Reproducción visual de la sesión (clicks, scrolls) anonimizada.
    *   **Mapas de Calor:** Zonas de mayor interacción en la pantalla.
*   **SDK Involucrado:** `@react-native-firebase/analytics`, `@microsoft/react-native-clarity`.
*   **Finalidad:** Mejora de UX/UI, detección de flujos confusos.

### D. Datos de Rendimiento y Errores (Observabilidad)
Recopilados cuando la aplicación falla o experimenta lentitud.
*   **Tipos de Datos:**
    *   Stack traces (líneas de código donde ocurrió el error).
    *   Metadatos del error (nivel de batería, memoria libre, si la app estaba en segundo plano).
    *   Tiempos de respuesta de red (latencia de API).
*   **SDK Involucrado:** `@sentry/react-native`, `@react-native-firebase/crashlytics`, `@react-native-firebase/perf`.
*   **Finalidad:** Corrección de bugs y optimización de velocidad.

### E. Datos Financieros (Configuración Local)
Datos ingresados por el usuario para el uso de herramientas.
*   **Tipos de Datos:**
    *   Alertas de precios configuradas (Símbolo, Precio Objetivo).
    *   Configuración de Widgets (Monedas seleccionadas).
    *   Preferencias de notificaciones.
*   **Almacenamiento:** Local (Dispositivo).
*   **Finalidad:** Funcionalidad core de la aplicación.

---

## 4. Uso de los Datos

| Finalidad | Datos Utilizados | Base Legal |
| :--- | :--- | :--- |
| **Provisión del Servicio** | Identificación, Financieros | Ejecución de Contrato (Términos de Uso) |
| **Seguridad (App Check)** | Técnicos (Tokens, IP) | Interés Legítimo (Prevención de ataques) |
| **Analítica de UX** | Uso, Grabaciones | Interés Legítimo (Mejora de producto) |
| **Publicidad** | AD_ID, Datos de Uso | Consentimiento (vía ATT/CMP) |
| **Notificaciones Push** | Token FCM, Preferencias | Consentimiento |
| **Diagnóstico de Errores** | Logs de Fallos, Técnicos | Interés Legítimo (Estabilidad) |

---

## 5. Compartición de Datos y Terceros

VTradingAPP comparte datos exclusivamente con los siguientes proveedores de infraestructura y servicios. No vendemos datos a "Data Brokers".

### Infraestructura y Backend
*   **Google Firebase (EE.UU.):**
    *   *Servicios:* Auth, Firestore, Functions, Hosting.
    *   *Datos:* Todo el backend de la aplicación reside aquí.
    *   *Garantía:* Certificación ISO 27001, SOC 1/2/3.

### Analítica y Observabilidad
*   **Google Analytics 4 (EE.UU.):** Métricas agregadas de uso.
*   **Microsoft Clarity (EE.UU.):** Grabaciones de sesión. (Datos enmascarados por defecto).
*   **Sentry (EE.UU.):** Monitoreo de errores en tiempo real. (`sendDefaultPii: false` configurado para no enviar datos personales).

### Publicidad
*   **Google AdMob (EE.UU.):** Red publicitaria. Utiliza el AD_ID para servir anuncios (personalizados o no personalizados según configuración).

### Proveedor de Datos
*   **VTrading API:** Recibe peticiones de tasas de cambio. Solo registra IPs y Tokens de App Check en logs temporales de acceso para seguridad (Rate Limiting).

---

## 6. Almacenamiento y Seguridad

### Almacenamiento Local (AsyncStorage)
La aplicación almacena datos en el dispositivo del usuario bajo las siguientes claves (`Keys`):
1.  `app_settings`: Preferencias generales (ej. Push activado).
2.  `user_alerts`: Lista de alertas de precios creadas.
3.  `user_notifications`: Historial local de notificaciones recibidas.
4.  `widget_config`: Configuración visual de los widgets de Android.
5.  `api_cache_*`: Caché temporal de respuestas de API para modo offline.
6.  `has_seen_onboarding`: Estado del tutorial de bienvenida.

### Medidas de Seguridad
1.  **Cifrado en Tránsito:** Todo el tráfico (App <-> API <-> Firebase) usa TLS 1.2+.
2.  **App Check:** Verificación criptográfica de que las peticiones provienen de una instancia legítima de la app (protección contra emuladores y scripts).
3.  **Gestión de Permisos:** No solicitamos permisos sensibles (Cámara, Micrófono, Ubicación GPS precisa).

### Retención
*   **Logs de Errores (Sentry/Crashlytics):** 90 días.
*   **Grabaciones Clarity:** 30 días.
*   **Analítica GA4:** 14 meses.
*   **Datos de Cuenta:** Hasta la eliminación de la cuenta por el usuario.

---

## 7. Derechos del Usuario

El usuario tiene control total sobre sus datos:
1.  **Eliminación de Cuenta:** Disponible dentro de la app en `Configuración > Perfil > Eliminar Cuenta`. Esto borra el registro en Firebase Auth.
2.  **Limpieza de Datos Locales:** Puede borrar el almacenamiento de la app desde los ajustes de Android/iOS para eliminar `AsyncStorage`.
3.  **Gestión de Permisos:** Puede revocar el permiso de Notificaciones o Rastreo (iOS) en cualquier momento desde los ajustes del sistema.

---

## 8. Cookies y Tecnologías de Rastreo

Al ser una aplicación nativa, no usamos "Cookies" de navegador tradicionales, pero sí identificadores similares:
*   **Instance ID (Firebase):** Identifica la instalación de la app para notificaciones y analítica.
*   **Clarity Session ID:** Identifica una sesión única de uso para agrupar interacciones.
*   **Ad ID:** Identificador reseteable del sistema operativo para publicidad.

---

## 9. Cambios en la Política

Cualquier cambio crítico en el procesamiento de datos será notificado mediante:
1.  Un mensaje "In-App" (Pop-up) al abrir la aplicación.
2.  Una actualización en las notas de la versión en Google Play Store / Apple App Store.

---

## 10. Información de Contacto

**VTradingAPP Development Team**
*   **Soporte y Privacidad:** soporte@vtrading.app
*   **Web:** https://vtrading.app

---
*Documento generado tras auditoría técnica del código fuente (v2.1).*
