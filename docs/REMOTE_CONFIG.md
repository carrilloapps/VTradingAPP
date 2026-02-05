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

#### Condiciones Básicas de Dispositivo

| Campo                  | Tipo     | Descripción                                                       |
| ---------------------- | -------- | ----------------------------------------------------------------- |
| `platform`             | string   | 'android' o 'ios'                                                 |
| `minBuild`             | number   | Build number mínimo (inclusive)                                   |
| `maxBuild`             | number   | Build number máximo (inclusive)                                   |
| `minVersion`           | string   | Versión semántica mínima (ej. "1.0.4")                            |
| `models`               | string[] | Coincidencia parcial de nombre de modelo (ej. "Pixel", "Samsung") |
| `notificationsEnabled` | boolean  | `true` si el usuario tiene permisos de notificación activos       |
| `rolloutPercentage`    | number   | 0-100. % de usuarios aleatorios que verán la feature.             |

#### Condiciones de Usuario y Autenticación

| Campo           | Tipo     | Descripción                                                             |
| --------------- | -------- | ----------------------------------------------------------------------- |
| `userIds`       | string[] | Lista de IDs de usuario permitidos (Firebase UID)                       |
| `emails`        | string[] | Lista de emails permitidos (case-insensitive)                           |
| `authProviders` | string[] | Proveedor de autenticación: 'password', 'google.com', 'apple.com'       |
| `fcmTokens`     | string[] | Lista de tokens FCM permitidos (para pruebas en dispositivo específico) |
| `planTypes`     | string[] | Tipo de plan del usuario: 'free' o 'premium'                            |

#### Condiciones de Ubicación e Idioma

| Campo             | Tipo     | Descripción                                                             |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| `countryCodes`    | string[] | Códigos ISO de país (VE, US, CO, AR, etc.) desde locale del dispositivo |
| `deviceLanguages` | string[] | Códigos de idioma (en, es, pt, etc.) desde locale del dispositivo       |

#### Condiciones de Engagement

| Campo                 | Tipo    | Descripción                                                        |
| --------------------- | ------- | ------------------------------------------------------------------ |
| `minDaysSinceInstall` | number  | Días mínimos desde la primera instalación                          |
| `maxDaysSinceInstall` | number  | Días máximos desde la primera instalación                          |
| `isFirstTimeUser`     | boolean | `true` para usuarios que no han completado onboarding (<=1 sesión) |

#### Condiciones de Fecha de Registro

| Campo                 | Tipo   | Descripción                                                    |
| --------------------- | ------ | -------------------------------------------------------------- |
| `minRegistrationDate` | string | Fecha mínima de registro del usuario (formato ISO: YYYY-MM-DD) |
| `maxRegistrationDate` | string | Fecha máxima de registro del usuario (formato ISO: YYYY-MM-DD) |

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

---

## 7. Ejemplos Avanzados de Filtros

### Ejemplo 1: Feature para Usuarios Premium de Venezuela

Activa una característica solo para usuarios con plan premium que estén en Venezuela:

```json
{
  "name": "premium_insights",
  "enabled": true,
  "rules": [
    {
      "action": "enable",
      "priority": 100,
      "conditions": {
        "planTypes": ["premium"],
        "countryCodes": ["VE"]
      }
    }
  ]
}
```

### Ejemplo 2: Beta para Usuarios con Email Específico

Permite acceso beta solo a usuarios con emails de la lista blanca:

```json
{
  "name": "beta_feature",
  "enabled": true,
  "rules": [
    {
      "action": "enable",
      "priority": 100,
      "conditions": {
        "emails": ["jose.carrillo@yummysuperapp.com", "beta.tester@example.com"]
      }
    }
  ]
}
```

### Ejemplo 3: Onboarding Mejorado para Nuevos Usuarios

Muestra un onboarding especial solo a usuarios de primera vez:

```json
{
  "name": "new_user_onboarding",
  "enabled": true,
  "rules": [
    {
      "action": "enable",
      "priority": 100,
      "conditions": {
        "isFirstTimeUser": true
      }
    }
  ]
}
```

### Ejemplo 4: Feature Regional con Idioma

Activa una característica solo en países de habla hispana:

```json
{
  "name": "latam_payment_methods",
  "enabled": true,
  "rules": [
    {
      "action": "enable",
      "priority": 100,
      "conditions": {
        "countryCodes": ["VE", "CO", "AR", "MX", "CL", "PE"],
        "deviceLanguages": ["es"]
      }
    }
  ]
}
```

### Ejemplo 5: Retención - Feature para Usuarios de 7 a 30 Días

Activa una feature para usuarios que instalaron la app hace 7-30 días:

```json
{
  "name": "retention_boost",
  "enabled": true,
  "rules": [
    {
      "action": "enable",
      "priority": 100,
      "conditions": {
        "minDaysSinceInstall": 7,
        "maxDaysSinceInstall": 30
      }
    }
  ]
}
```

### Ejemplo 6: Segmentación por Proveedor de Autenticación

Activa una feature solo para usuarios que ingresaron con Google:

```json
{
  "name": "google_sync",
  "enabled": true,
  "rules": [
    {
      "action": "enable",
      "priority": 100,
      "conditions": {
        "authProviders": ["google.com"]
      }
    }
  ]
}
```

### Ejemplo 7: Combinación Avanzada - A/B Test Regional

Rollout progresivo del 50% solo en Venezuela para usuarios premium:

```json
{
  "name": "advanced_charts_ve",
  "enabled": true,
  "rules": [
    {
      "action": "enable",
      "priority": 100,
      "conditions": {
        "countryCodes": ["VE"],
        "planTypes": ["premium"],
        "rolloutPercentage": 50
      }
    }
  ]
}
```

### Ejemplo 8: Feature para Usuarios Registrados desde una Fecha

Activa una característica solo para usuarios que se registraron a partir del 1 de enero de 2026:

```json
{
  "name": "new_year_promotion",
  "enabled": true,
  "rules": [
    {
      "action": "enable",
      "priority": 100,
      "conditions": {
        "minRegistrationDate": "2026-01-01"
      }
    }
  ]
}
```

### Ejemplo 9: Feature para Early Adopters

Activa una feature solo para usuarios que se registraron antes del 31 de diciembre de 2025:

```json
{
  "name": "early_adopter_badge",
  "enabled": true,
  "rules": [
    {
      "action": "enable",
      "priority": 100,
      "conditions": {
        "maxRegistrationDate": "2025-12-31"
      }
    }
  ]
}
```

### Ejemplo 10: Campaña por Cohorte de Registro

Activa una campaña solo para usuarios registrados en enero de 2026:

```json
{
  "name": "january_cohort_campaign",
  "enabled": true,
  "rules": [
    {
      "action": "enable",
      "priority": 100,
      "conditions": {
        "minRegistrationDate": "2026-01-01",
        "maxRegistrationDate": "2026-01-31"
      }
    }
  ]
}
```

---

## 8. Notas Técnicas

### Detección de País

- El país se detecta desde el **locale del dispositivo** (ej: `es-VE` → `VE`)
- NO requiere permisos de ubicación
- Alternativa futura: Detección por IP con servicio externo

### Tipos de Plan

- El plan del usuario se lee desde MMKV: `user_plan_type`
- Valor por defecto: `'free'`
- Debe ser actualizado por el sistema de suscripciones

### Proveedor de Autenticación

- Se obtiene desde `user.providerData[].providerId`
- Valores: `'password'` (email/password), `'google.com'`, `'apple.com'`

### First Time User

- Se determina por:
  - `has_completed_onboarding === false`
  - `session_count <= 1`

### Fecha de Registro

- Se obtiene desde `user.metadata.creationTime` de Firebase Auth
- Formato de entrada: ISO 8601 (`YYYY-MM-DD`)
- La comparación se hace por día completo (ignora horas/minutos)
- Permite segmentar por:
  - Usuarios nuevos desde una fecha específica
  - Early adopters (registrados antes de una fecha)
  - Cohortes específicas (rango de fechas)
