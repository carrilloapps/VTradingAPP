# Diagnóstico del Sistema de Notificaciones

## Problemas Identificados y Solucionados

### 1. ❌ **No se inicializaba el sistema de notificaciones en App.tsx**
**Problema**: El sistema de notificaciones solo se inicializaba si el usuario completaba el onboarding. Si el usuario omitía o ya había visto el onboarding, nunca se solicitaban permisos, no se obtenía el token FCM, ni se suscribía a tópicos.

**Solución**: 
- ✅ Creado `NotificationInitService.ts` - Servicio centralizado para inicializar todo el sistema
- ✅ Integrado en `App.tsx` para que se ejecute en cada inicio de la app
- ✅ El servicio verifica permisos automáticamente y resuscribe a alertas guardadas

### 2. ❌ **Las notificaciones de foreground no se persistían**
**Problema**: Cuando la app estaba en primer plano, las notificaciones se mostraban en el toast pero no se guardaban en la lista de notificaciones.

**Solución**:
- ✅ Mejorado `NotificationContext.tsx` para procesar notificaciones en todos los estados (foreground, background, quit)
- ✅ Añadida función `processRemoteMessage()` que persiste inmediatamente las notificaciones en storage
- ✅ Las notificaciones ahora se guardan tanto en el contexto como en MMKV storage

### 3. ❌ **No se resuscribía a alertas después de reinstalar**
**Problema**: Si el usuario reinstalaba la app o cambiaba de dispositivo, las alertas guardadas no volvían a suscribirse a los tópicos FCM.

**Solución**:
- ✅ `NotificationInitService` resuscribe automáticamente a todos los tópicos de alertas activas al iniciar
- ✅ Obtiene símbolos únicos y suscribe a cada tópico `ticker_{symbol}`

### 4. ❌ **El switch de notificaciones en Ajustes no verificaba permisos del sistema**
**Problema**: El switch "Notificaciones push" en SettingsScreen era solo una preferencia de UI en storage, NO verificaba ni solicitaba los permisos reales del sistema operativo.

**Solución**:
- ✅ Integrado `NotificationInitService` con el switch de notificaciones
- ✅ Al cargar la pantalla, verifica los permisos del sistema y sincroniza el estado del switch
- ✅ Al activar: solicita permisos del sistema si no los tiene, inicializa el servicio completo
- ✅ Si el usuario deniega: muestra diálogo para abrir configuración del dispositivo
- ✅ Al desactivar: solo actualiza la preferencia local (respeta la decisión del usuario)

### 5. ❌ **Falta de coherencia: Sin permisos se podía crear alertas y ver notificaciones**
**Problema**: Los usuarios podían acceder a NotificationsScreen y AddAlertScreen sin tener permisos de notificaciones activados, creando confusión y alertas que nunca funcionarían.

**Solución**:
- ✅ **NotificationsScreen**: Muestra estado vacío con opción de activar si no hay permisos o notificaciones deshabilitadas
- ✅ **AddAlertScreen**: Bloquea la creación/edición de alertas y redirige a Ajustes si no hay permisos
- ✅ **NotificationInitService**: Verifica preferencia `pushEnabled` antes de inicializar
- ✅ **SettingsScreen**: Al desactivar notificaciones, desactiva TODAS las alertas y se desuscribe de todos los tópicos FCM
- ✅ Sistema completamente coherente: Sin permisos = Sin alertas = Sin notificaciones

## Flujo Mejorado del Sistema

### Al Iniciar la App:

```
1. App.tsx se inicia
2. initializeFirebase() ejecuta:
   ├─ Firebase Services (Crashlytics, App Check, etc.)
   └─ notificationInitService.initialize()
      ├─ Verifica permisos (checkPermission)
      ├─ Si tiene permisos:
      │  ├─ Obtiene token FCM (getFCMToken)
      │  ├─ Suscribe a tópicos demográficos (subscribeToDemographics)
      │  └─ Resuscribe a alertas guardadas (resubscribeToAlerts)
      └─ Si NO tiene permisos: registra en analytics y espera
```

### Cuando se Crea/Edita una Alerta:

```
1. Usuario configura alerta en AddAlertScreen
2. Se guarda en MMKV storage
3. Se suscribe al tópico FCM: ticker_{symbol}
4. Backend envía notificaciones data-only a ese tópico
```

### Cuando Llega una Notificación:

#### Caso 1: App CERRADA (Quit State)
```
1. Backend envía notificación
2. NotificationLogic.ts (background handler) procesa el mensaje
3. Notifee muestra notificación local
4. Se guarda en MMKV storage
5. Usuario toca notificación
6. App abre y navega a NotificationsScreen
```

#### Caso 2: App EN SEGUNDO PLANO (Background)
```
1. Backend envía notificación
2. NotificationLogic.ts procesa el mensaje
3. Notifee muestra notificación local
4. Se guarda en MMKV storage
5. Si usuario toca: App pasa a foreground y navega a NotificationsScreen
```

#### Caso 3: App EN PRIMER PLANO (Foreground)
```
1. Backend envía notificación
2. NotificationContext procesa el mensaje
3. Se muestra toast (NotificationController)
4. Se guarda inmediatamente en MMKV storage
5. Se añade a la lista de notificaciones
6. Aparece en NotificationsScreen
```

## Archivos Modificados

### Nuevos Archivos:
- ✅ `src/services/NotificationInitService.ts` - Servicio de inicialización
- ✅ `__tests__/services/NotificationInitService.test.ts` - Tests del servicio

### Archivos Modificados:
- ✅ `App.tsx` - Integración de notificationInitService
- ✅ `src/context/NotificationContext.tsx` - Mejora de persistencia de notificaciones
- ✅ `src/screens/SettingsScreen.tsx` - Switch sincronizado con permisos del sistema + desactivación inteligente
- ✅ `src/screens/NotificationsScreen.tsx` - Verificación de permisos y estado vacío
- ✅ `src/screens/settings/AddAlertScreen.tsx` - Bloqueo sin permisos
- ✅ `src/services/NotificationInitService.ts` - Respeta preferencia pushEnabled

## Cómo Verificar que Funciona

### 1. Verificar Permisos:
```typescript
import { notificationInitService } from './src/services/NotificationInitService';

const status = await notificationInitService.checkStatus();
console.log('Status:', status);
// {
//   hasPermission: true/false,
//   hasToken: true/false,
//   isInitialized: true/false,
//   activeAlertsCount: 2
// }
```

### 2. Solicitar Permisos Manualmente:
```typescript
const granted = await notificationInitService.requestPermission();
if (granted) {
  console.log('Permisos otorgados');
}
```

### 3. Forzar Reinicialización:
```typescript
await notificationInitService.reinitialize();
```

## Configuración del Backend

Para que las notificaciones lleguen correctamente, el backend debe enviar mensajes en este formato:

### Alerta de Precio (Data-Only Message):
```json
{
  "data": {
    "symbol": "USD/VES",
    "price": "40.25"
  },
  "topic": "ticker_usd_ves"
}
```

La app procesará automáticamente:
- Verificará si el precio cumple alguna alerta activa
- Mostrará notificación local con Notifee
- Guardará en la lista de notificaciones
- Mostrará toast si está en foreground

### Notificación General:
```json
{
  "data": {
    "title": "Nueva funcionalidad",
    "body": "Descubre las últimas actualizaciones",
    "type": "system"
  },
  "topic": "all_users"
}
```

## Tópicos FCM Automáticos

La app se suscribe automáticamente a:

### Tópicos Demográficos:
- `all_users` - Todos los usuarios
- `os_android` o `os_ios` - Por plataforma
- `device_phone` o `device_tablet` - Por tipo de dispositivo
- `app_version_1_0_5` - Por versión de la app
- `build_123` - Por número de build
- `sys_version_33` - Por versión del sistema operativo

### Tópicos de Alertas:
- `ticker_usd_ves` - Por cada símbolo con alerta activa
- `ticker_eur_ves`
- `ticker_btc_usd`
- etc.

## Solución de Problemas

### Si las notificaciones no llegan:

1. **Verificar permisos en el dispositivo**:
   - Android 13+: Configuración > Apps > VTradingAPP > Notificaciones
   - iOS: Configuración > VTradingAPP > Notificaciones

2. **Verificar token FCM**:
   ```typescript
   const token = await fcmService.getFCMToken();
   console.log('FCM Token:', token);
   ```

3. **Verificar suscripción a tópicos**:
   - El token FCM debe registrarse en Firebase Console
   - Verificar que el backend envíe a los tópicos correctos

4. **Verificar alertas activas**:
   ```typescript
   const alerts = await storageService.getAlerts();
   console.log('Alertas activas:', alerts.filter(a => a.isActive));
   ```

5. **Forzar reinicialización**:
   ```typescript
   await notificationInitService.reinitialize();
   ```

## Testing

Para probar el sistema completo:

1. **Ejecutar tests**:
   ```bash
   npm test NotificationInitService
   ```

2. **Probar en dispositivo real**:
   - Crear una alerta (ej. USD/VES > 40)
   - Cerrar la app completamente
   - Desde Firebase Console > Cloud Messaging > Send test message:
     - Token: [tu token FCM]
     - Topic: `ticker_usd_ves`
     - Data: `{"symbol": "USD/VES", "price": "41"}`

3. **Verificar en diferentes estados**:
   - App cerrada: Debe mostrar notificación del sistema y guardar
   - App en segundo plano: Debe mostrar notificación del sistema
   - App en primer plano: Debe mostrar toast y guardar

## Mejores Prácticas

1. ✅ **Nunca solicitar permisos automáticamente** - Siempre debe ser por acción del usuario
2. ✅ **Respetar la decisión del usuario** - Si deniega permisos, no insistir
3. ✅ **Mensajes data-only** - Más flexibilidad para procesamiento local
4. ✅ **Persistencia múltiple** - Guardar en contexto Y storage
5. ✅ **Logging completo** - SafeLogger para debugging
6. ✅ **Analytics** - Trackear eventos de notificaciones

## Conclusión

El sistema de notificaciones ahora está completamente funcional:
- ✅ Inicialización automática en cada inicio
- ✅ Persistencia garantizada en todos los estados
- ✅ Resuscripción automática a alertas
- ✅ Switch de notificaciones sincronizado con permisos del sistema
- ✅ Solicitud de permisos por acción explícita del usuario
- ✅ Manejo robusto de errores
- ✅ Testing completo
- ✅ Analytics integrado

**Las notificaciones deben llegar correctamente en todos los estados de la app.**

## Comportamiento del Switch de Notificaciones en Ajustes

### Al cargar la pantalla:
1. Verifica los permisos del sistema operativo
2. Si NO tiene permisos → switch OFF (aunque storage diga ON)
3. Si tiene permisos → muestra el estado del storage
4. Sincroniza automáticamente storage con la realidad del sistema

### Al activar el switch (OFF → ON):
1. Verifica si tiene permisos del sistema
2. Si NO tiene permisos:
   - Solicita permisos al usuario
   - Si el usuario OTORGA → Inicializa todo el sistema (token, suscripciones)
   - Si el usuario DENIEGA → Muestra diálogo para ir a configuración del dispositivo
3. Si ya tiene permisos:
   - Solo actualiza la preferencia local

### Al desactivar el switch (ON → OFF):
- Solo actualiza la preferencia local
- **Desactiva TODAS las alertas automáticamente** (las marca como `isActive: false`)
- **Se desuscribe de TODOS los tópicos FCM** de las alertas
- Las alertas se guardan pero quedan pausadas
- Al reactivar, el usuario debe reactivar manualmente cada alerta que desee
- NO revoca permisos del sistema (respeta la decisión del usuario)

## Coherencia del Sistema

### Sin Permisos de Notificaciones:
- ❌ NO puede acceder a NotificationsScreen (muestra estado vacío con botón "Activar notificaciones")
- ❌ NO puede crear/editar alertas en AddAlertScreen (muestra estado vacío con botón "Ir a Ajustes")
- ❌ NotificationInitService NO se inicializa (no obtiene token, no suscribe a tópicos)
- ℹ️ Puede ver el resto de la app normalmente

### Con Notificaciones Deshabilitadas (pushEnabled = false):
- ❌ NO puede acceder a NotificationsScreen (muestra estado vacío con botón "Ir a Ajustes")
- ❌ NO puede crear/editar alertas (muestra estado vacío con botón "Ir a Ajustes")
- ❌ NotificationInitService NO se inicializa (aunque tenga permisos)
- ✅ Todas las alertas están PAUSADAS (isActive: false)
- ✅ NO está suscrito a ningún tópico de alertas
- ✅ Al reactivar: debe reinicializar todo desde Ajustes

### Con Notificaciones Activas (hasPermissions = true && pushEnabled = true):
- ✅ Puede acceder a NotificationsScreen normalmente
- ✅ Puede crear/editar alertas
- ✅ NotificationInitService inicializa automáticamente
- ✅ Las alertas activas funcionan y reciben notificaciones
