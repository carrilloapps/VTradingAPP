# Remote Config & Feature Flags

Este documento detalla la arquitectura de configuración remota, segmentación de características (Feature Flags) y el sistema de actualización forzada (Force Update) implementados en VTradingAPP.

## 1. Arquitectura General

El sistema se basa en **Firebase Remote Config** para obtener configuraciones desde la nube, pero delega la lógica de segmentación compleja a un motor de reglas local (`FeatureFlagService`).

**Componentes Principales:**

- **RemoteConfigService**: Wrapper de Firebase que obtiene y cachéa la configuración.
- **FeatureFlagService**: Evalúa reglas JSON complejas contra el contexto del dispositivo/usuario.
- **ForceUpdateModal**: Bloquea la app si la versión es obsoleta.

---

## 2. Configuración Remota (JSON SChema)

Toda la configuración avanzada reside bajo la clave `settings` en Firebase Remote Config.

### Estructura del Objeto `settings`

```json
{
  "features": [
    {
      "name": "discover",
      "enabled": false,
      "rules": [
        {
          "action": "enable",
          "priority": 100,
          "conditions": {
            "platform": "android",
            "minBuild": 15,
            "rolloutPercentage": 20
          }
        }
      ]
    }
  ]
}
```

### Condiciones Disponibles

Todas las condiciones en una regla actúan como **AND** (todas deben cumplirse).

| Campo                  | Tipo     | Descripción                                                             |
| ---------------------- | -------- | ----------------------------------------------------------------------- |
| `platform`             | string   | 'android' o 'ios'                                                       |
| `minBuild`             | number   | Build number mínimo (inclusive)                                         |
| `maxBuild`             | number   | Build number máximo (inclusive)                                         |
| `minVersion`           | string   | Versión semántica mínima (ej. "1.0.4")                                  |
| `userIds`              | string[] | Lista de IDs de usuario permitidos                                      |
| `fcmTokens`            | string[] | Lista de tokens FCM permitidos (para pruebas en dispositivo específico) |
| `models`               | string[] | Coincidencia parcial de nombre de modelo (ej. "Pixel", "Samsung")       |
| `notificationsEnabled` | boolean  | `true` si el usuario tiene permisos de notificación activos             |
| `rolloutPercentage`    | number   | 0-100. % de usuarios aleatorios que verán la feature.                   |

---

## 3. Force Update

El sistema de actualización forzada impide el uso de versiones obsoletas de la app.

### Configuración

Se define bajo la clave `strings` (JSON) en Remote Config:

```json
{
  "forceUpdate": {
    "version": "1.0.5",
    "build": 10,
    "storeUrl": "https://..." // Opcional
  }
}
```

### Comportamiento

1. Al iniciar la app, `AppNavigator` consulta `remoteConfigService`.
2. Si `device.buildNumber < forceUpdate.build`, se muestra `ForceUpdateModal`.
3. El modal **no se puede cerrar** y redirige a la tienda de aplicaciones.

---

## 4. Implementación en Código

### Verificar una Feature Flag

```typescript
import { remoteConfigService } from '../services/firebase/RemoteConfigService';

const checkFeature = async () => {
  // Asegura tener la última config
  await remoteConfigService.fetchAndActivate();

  // Evalúa reglas localmente
  const isEnabled = await remoteConfigService.getFeature('discover');

  if (isEnabled) {
    // Mostrar nueva funcionalidad
  }
};
```

### Añadir una Nueva Feature

1. Definir la feature en el JSON de Firebase (`settings`).
2. Consumirla en el código usando `getFeature('nombre_feature')`.

---

## 5. Rollout Progresivo

Para realizar un despliegue gradual (Phased Rollout):

1. Crear una regla en Firebase con `rolloutPercentage`.
2. `FeatureFlagService` genera un ID aleatorio (0-99) persistente por dispositivo.
3. Si `rolloutId < rolloutPercentage`, la condición se cumple.

Ejemplo: Activar al 10% de usuarios.

```json
{
  "conditions": {
    "rolloutPercentage": 10
  }
}
```

## 6. Feature flags

```
{
  "features": [
    {
      "name": "news",
      "enabled": false,
      "rules": [
        {
          "action": "enable",
          "priority": 100,
          "conditions": {
            "platform": "android",
            "minBuild": 5,
            "maxBuild": 10,
            "minVersion": "1.0.4",
            "userIds": [
              "ABC-123",
              "XYZ-789"
            ],
            "fcmTokens": [
              "token1..."
            ],
            "models": [
              "Pixel 6",
              "iPhone 13"
            ],
            "notificationsEnabled": true,
            "rolloutPercentage": 10
          }
        },
        {
          "action": "disable",
          "priority": 50,
          "conditions": {
            "models": [
              "Emulator"
            ]
          }
        }
      ]
    }
  ]
}
```
