# Guía de Notificaciones Push (FCM)

El sistema de notificaciones de VTradingAPP utiliza Firebase Cloud Messaging (FCM) y Notifee para alertas de precio en tiempo real y mensajes informativos.

## 1. Arquitectura y Flujo

El sistema se basa en un servicio de inicialización centralizado (`NotificationInitService.ts`) que garantiza que el token y los permisos se gestionen correctamente.

### Tipos de Mensajes
1. **Notificación Estándar**: Mensaje visual enviado por el sistema (~Marketing).
2. **Alerta de Precio (Data-Only)**: Mensaje silencioso que la app procesa localmente. Solo dispara una notificación visual si el precio cumple una condición configurada por el usuario.

---

## 2. Suscripción a Tópicos (Topics)

### Tópicos Demográficos (Automáticos)
Al iniciar, la app se suscribe a: `os_android`, `os_ios`, `theme_dark/light`, `app_ver_X`.

### Tópicos de Alertas (Dinámicos)
- **Formato**: `ticker_{symbol_sanitized}` (ej: `ticker_usd_ves`).
- **Lógica**: La app se suscribe al crear una alerta y se desuscribe automáticamente si ya no quedan alertas activas para ese símbolo.

---

## 3. Protocolo para Backend

Para alertas de precio, el backend **no debe incluir** el campo `notification`. Use solo el campo `data`.

**Ejemplo de Payload:**
```json
{
  "to": "/topics/ticker_usd_ves",
  "data": {
    "symbol": "USD/VES",
    "price": "40.50"
  }
}
```

---

## 4. Diagnóstico y Troubleshooting

- **Permisos**: Sin permisos de sistema, la app bloquea la creación de alertas para evitar confusión.
- **Sincronización**: El switch en "Ajustes" verifica en tiempo real el estado de los permisos de Android/iOS.
- **Pruebas**: Use comandos `curl` contra la API de Firebase para simular cambios de precio.

---

## 5. Canales (Android)
- `price_alerts`: Importancia ALTA, sonido activado.
- `general`: Importancia MEDIA (avisos del sistema).
