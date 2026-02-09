# Configuración de Deep Links para VTradingAPP

Este documento describe la configuración completa de deep links para la aplicación VTradingAPP, incluyendo la configuración del dominio `vtrading.app` y `discover.vtrading.app`.

## Dominios Soportados

La aplicación soporta deep links desde los siguientes dominios:

- **vtrading.app** (dominio principal)
- **discover.vtrading.app** (subdominio para contenido)

## Esquemas de URL Soportados

### 1. Custom URL Scheme

```
vtrading://article/{slug}
vtrading://categoria/{slug}
vtrading://tag/{slug}
```

### 2. Universal Links / App Links (HTTPS)

```
https://vtrading.app/{article-slug}
https://vtrading.app/categoria/{slug}
https://vtrading.app/tag/{slug}

https://discover.vtrading.app/{article-slug}
https://discover.vtrading.app/categoria/{slug}
https://discover.vtrading.app/tag/{slug}
```

## Configuración del Servidor Web

Para que los deep links funcionen correctamente, debes configurar archivos específicos en tu servidor web.

### Para iOS (Apple App Site Association)

Debes crear un archivo `apple-app-site-association` (sin extensión) en la raíz de ambos dominios:

**Ubicación:**

- `https://vtrading.app/.well-known/apple-app-site-association`
- `https://discover.vtrading.app/.well-known/apple-app-site-association`

**Contenido del archivo:**

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.vtradingapp",
        "paths": ["*"]
      }
    ]
  }
}
```

> **Nota:** Reemplaza `TEAM_ID` con tu Apple Team ID real. Puedes encontrarlo en tu cuenta de desarrollador de Apple.

**Configuración del servidor:**

- El archivo debe servirse con el tipo MIME: `application/json`
- Debe ser accesible sin autenticación
- Debe servirse sobre HTTPS con un certificado SSL válido

### Para Android (Digital Asset Links)

Debes crear un archivo `assetlinks.json` en la raíz de ambos dominios:

**Ubicación:**

- `https://vtrading.app/.well-known/assetlinks.json`
- `https://discover.vtrading.app/.well-known/assetlinks.json`

**Contenido del archivo:**

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.vtradingapp",
      "sha256_cert_fingerprints": ["SHA256_FINGERPRINT_AQUI"]
    }
  }
]
```

> **Nota:** Reemplaza `SHA256_FINGERPRINT_AQUI` con el SHA-256 fingerprint de tu certificado de firma de Android.

#### Cómo obtener el SHA-256 Fingerprint

Para obtener el SHA-256 fingerprint de tu keystore de producción:

```bash
keytool -list -v -keystore your-release-keystore.jks -alias your-key-alias
```

Para desarrollo con debug keystore:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Configuración del servidor:**

- El archivo debe servirse con el tipo MIME: `application/json`
- Debe ser accesible sin autenticación
- Debe servirse sobre HTTPS con un certificado SSL válido

## Configuración de Nginx (Ejemplo)

Si usas Nginx, agrega esta configuración para ambos dominios:

```nginx
server {
    listen 443 ssl http2;
    server_name vtrading.app;

    # ... resto de configuración SSL ...

    location /.well-known/apple-app-site-association {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    location /.well-known/assetlinks.json {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
    }
}

server {
    listen 443 ssl http2;
    server_name discover.vtrading.app;

    # ... resto de configuración SSL ...

    location /.well-known/apple-app-site-association {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    location /.well-known/assetlinks.json {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
    }
}
```

## Verificación de la Configuración

### Verificar iOS (Apple App Site Association)

1. Visita: `https://vtrading.app/.well-known/apple-app-site-association`
2. Debe devolver el JSON sin errores
3. Usa el validador de Apple: [Branch.io AASA Validator](https://branch.io/resources/aasa-validator/)

### Verificar Android (Digital Asset Links)

1. Visita: `https://vtrading.app/.well-known/assetlinks.json`
2. Debe devolver el JSON sin errores
3. Usa el validador de Google: [Digital Asset Links Tester](https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://vtrading.app&relation=delegate_permission/common.handle_all_urls)

## Testing de Deep Links

### iOS

```bash
# Prueba desde el simulador
xcrun simctl openurl booted "https://vtrading.app/articulo-ejemplo"

# Prueba custom scheme
xcrun simctl openurl booted "vtrading://article/articulo-ejemplo"
```

### Android

```bash
# Prueba desde adb
adb shell am start -W -a android.intent.action.VIEW -d "https://vtrading.app/articulo-ejemplo" com.vtradingapp

# Prueba custom scheme
adb shell am start -W -a android.intent.action.VIEW -d "vtrading://article/articulo-ejemplo" com.vtradingapp
```

## Rutas Soportadas

| Ruta                | Tipo      | Navegación                              |
| ------------------- | --------- | --------------------------------------- |
| `/{article-slug}`   | Artículo  | ArticleDetail screen                    |
| `/categoria/{slug}` | Categoría | Discover screen con filtro de categoría |
| `/tag/{slug}`       | Tag       | Discover screen con filtro de tag       |
| `/discover`         | Discover  | Discover screen                         |

## Debugging

### Ver logs de deep links

Los deep links son registrados en Analytics con el evento `deep_link_opened`. Revisa:

1. **Firebase Analytics Console**
2. **Sentry** - Eventos de navegación
3. **Logs de desarrollo** - Busca "DeepLinkService" en los logs

### Problemas Comunes

**iOS:**

- 🔴 Links no se abren en la app
  - Verifica que el archivo AASA esté correctamente configurado
  - Verifica que el Team ID sea correcto
  - Reinstala la app después de cambios en associated domains
  - Verifica que el dominio tenga SSL válido

**Android:**

- 🔴 Links no se abren en la app
  - Verifica que assetlinks.json esté correctamente configurado
  - Verifica el SHA-256 fingerprint
  - Limpia la caché de verificación: `adb shell pm clear com.android.vending`
  - Verifica que el dominio tenga SSL válido

**Ambas plataformas:**

- 🔴 Custom scheme no funciona
  - Verifica que el esquema esté configurado en el manifiesto/plist
  - Reinicia la app después de instalar

## Configuración Adicional

### Variables de Entorno (Opcional)

Puedes personalizar los valores por defecto usando variables de entorno en `.env`:

```bash
DEEP_LINK_SCHEME=vtrading://
DEEP_LINK_HOST=discover.vtrading.app
```

### Actualización de Hosts Válidos

Si necesitas agregar más hosts, edita el array `VALID_HOSTS` en `DeepLinkService.ts`:

```typescript
private readonly VALID_HOSTS = [
  'vtrading.app',
  'discover.vtrading.app',
  'nuevo-dominio.app' // Agregar aquí
];
```

Y actualiza las configuraciones de Android (AndroidManifest.xml) e iOS (Info.plist) correspondientemente.

## Referencias

- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [React Native Linking API](https://reactnative.dev/docs/linking)

---

**Última actualización:** Febrero 2026
