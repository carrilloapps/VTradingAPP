# Configuración de Deep Links - Próximos Pasos

**Fecha:** 8 de Febrero de 2026  
**Estado:** Configuración de la app completada ✅

## Resumen de Cambios Realizados

Se ha configurado la aplicación VTradingAPP para soportar deep links desde los dominios:

- ✅ `vtrading.app` (dominio principal)
- ✅ `discover.vtrading.app` (subdominio existente)

### Archivos Modificados

1. **DeepLinkService.ts**

   - Agregado soporte para múltiples hosts válidos
   - Array `VALID_HOSTS` incluye ambos dominios
   - Lógica de parsing actualizada para validar contra todos los hosts

2. **AndroidManifest.xml**

   - Agregado intent-filter con `android:autoVerify="true"` para `vtrading.app`
   - Mantiene configuración existente para `discover.vtrading.app`

3. **Info.plist (iOS)**

   - Agregado `applinks:vtrading.app` a associated domains
   - Mantiene configuración existente para `discover.vtrading.app`

4. **Tests**

   - Agregados tests para validar URLs desde `vtrading.app`
   - Todos los tests pasan correctamente (12/12) ✅

5. **Documentación**
   - Creado `docs/DEEPLINKS_SETUP.md` con guía completa
   - Creados archivos de ejemplo en `docs/examples/`

## ⚠️ ACCIÓN REQUERIDA - Configuración del Servidor

Para que los deep links funcionen completamente, **DEBES** configurar los siguientes archivos en tu servidor web:

### 1. Para iOS (Apple App Site Association)

**Ubicaciones:**

```
https://vtrading.app/.well-known/apple-app-site-association
https://discover.vtrading.app/.well-known/apple-app-site-association
```

**Archivo:** `docs/examples/apple-app-site-association`

**Pasos:**

1. Reemplaza `TEAM_ID` con tu Apple Team ID real
   - Encuentra tu Team ID en: https://developer.apple.com/account
2. Sube el archivo a ambas ubicaciones en tu servidor
3. Configura el servidor para servir el archivo como `application/json`
4. Verifica que sea accesible por HTTPS con SSL válido

### 2. Para Android (Digital Asset Links)

**Ubicaciones:**

```
https://vtrading.app/.well-known/assetlinks.json
https://discover.vtrading.app/.well-known/assetlinks.json
```

**Archivo:** `docs/examples/assetlinks.json`

**Pasos:**

1. Obtén el SHA-256 fingerprint de tu keystore de producción:

   ```bash
   keytool -list -v -keystore your-release-keystore.jks -alias your-key-alias
   ```

2. Reemplaza `SHA256_FINGERPRINT_AQUI` con el valor obtenido
3. Sube el archivo a ambas ubicaciones en tu servidor
4. Configura el servidor para servir el archivo como `application/json`
5. Verifica que sea accesible por HTTPS con SSL válido

### 3. Configuración del Servidor (Nginx Ejemplo)

Si usas Nginx, agrega esta configuración:

```nginx
# Para vtrading.app
location /.well-known/apple-app-site-association {
    default_type application/json;
    add_header Access-Control-Allow-Origin *;
}

location /.well-known/assetlinks.json {
    default_type application/json;
    add_header Access-Control-Allow-Origin *;
}
```

Repite lo mismo para el servidor de `discover.vtrading.app`.

## Verificación

Una vez configurado el servidor, verifica:

### iOS

1. Visita: https://vtrading.app/.well-known/apple-app-site-association
2. Usa el validador: https://branch.io/resources/aasa-validator/
3. En dispositivo/simulador:
   ```bash
   xcrun simctl openurl booted "https://vtrading.app/test-article"
   ```

### Android

1. Visita: https://vtrading.app/.well-known/assetlinks.json
2. Usa el validador de Google:
   ```
   https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://vtrading.app&relation=delegate_permission/common.handle_all_urls
   ```
3. En dispositivo/emulador:
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "https://vtrading.app/test-article" com.vtradingapp
   ```

## URLs de Prueba

Una vez configurado, prueba con estas URLs:

- `https://vtrading.app/mi-articulo`
- `https://vtrading.app/categoria/tecnologia`
- `https://vtrading.app/tag/bitcoin`
- `https://discover.vtrading.app/otro-articulo`

## Rutas Soportadas

| Esquema | Ruta                                     | Navegación            |
| ------- | ---------------------------------------- | --------------------- |
| HTTPS   | `vtrading.app/{slug}`                    | Artículo              |
| HTTPS   | `vtrading.app/categoria/{slug}`          | Categoría en Discover |
| HTTPS   | `vtrading.app/tag/{slug}`                | Tag en Discover       |
| HTTPS   | `vtrading.app/discover`                  | Pantalla Discover     |
| HTTPS   | `discover.vtrading.app/{slug}`           | Artículo              |
| HTTPS   | `discover.vtrading.app/categoria/{slug}` | Categoría en Discover |
| HTTPS   | `discover.vtrading.app/tag/{slug}`       | Tag en Discover       |
| Custom  | `vtrading://article/{slug}`              | Artículo              |
| Custom  | `vtrading://categoria/{slug}`            | Categoría             |
| Custom  | `vtrading://tag/{slug}`                  | Tag                   |

## Debugging

Si los links no funcionan:

1. **iOS:**

   - Reinstala la app después de configurar el servidor
   - Verifica que el Team ID sea correcto
   - Revisa los logs del dispositivo en Xcode
   - El archivo AASA debe servirse sin autenticación

2. **Android:**

   - Limpia caché: `adb shell pm clear com.android.vending`
   - Verifica el SHA-256 fingerprint
   - Reinstala la app
   - Verifica que `android:autoVerify="true"` esté presente

3. **Ambos:**
   - Verifica que el dominio tenga SSL válido (HTTPS)
   - Los archivos deben ser accesibles públicamente
   - Verifica el tipo MIME: `application/json`
   - Revisa Firebase Analytics para eventos `deep_link_opened`

## Referencias

- Documentación completa: `docs/DEEPLINKS_SETUP.md`
- Ejemplos de archivos: `docs/examples/`
- Tests: `__tests__/services/DeepLinkService.test.ts`

---

**Estado Final:**

- ✅ Código de la app actualizado
- ✅ Configuraciones de Android e iOS actualizadas
- ✅ Tests pasando correctamente
- ✅ Documentación creada
- ⏳ **Pendiente:** Configuración del servidor web
- ⏳ **Pendiente:** Verificación de deep links en producción

**Próxima Acción:** Configurar archivos `.well-known` en ambos dominios según las instrucciones anteriores.
