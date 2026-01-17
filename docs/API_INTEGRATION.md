# Integración de API de Tasas (RNFirebase Performance)

Se ha implementado una conexión robusta a la API de tasas de cambio (`https://vt.isapp.dev/api/rates`) siguiendo las mejores prácticas de performance y monitoreo con Firebase.

## Detalles de Implementación

### 1. ApiClient (`src/services/ApiClient.ts`)
*   **Firebase Performance**: Cada petición HTTP es monitoreada automáticamente utilizando `newHttpMetric`. Se registran códigos de respuesta, tipos de contenido y tamaños de payload.
*   **Caché Persistente**: Se utiliza `AsyncStorage` para almacenar respuestas exitosas.
    *   Si la red falla, se sirve la caché ("stale-while-revalidate" strategy simplificada).
    *   Se implementa un TTL (Time To Live) configurable (por defecto 5 minutos).
*   **Headers**: Soporte para `X-API-Key` y `Accept`.
*   **App Check**: Integración automática con Firebase App Check para seguridad.

### 2. CurrencyService (`src/services/CurrencyService.ts`)
*   **Consumo de API**: Utiliza `ApiClient` para obtener las tasas.
*   **Mapeo de Datos**: Transforma la respuesta de la API (formato externo) al modelo interno `CurrencyRate`.
*   **Resiliencia**: En caso de fallo total (Red + Caché vacía), retorna datos mock para no romper la UI.
*   **Tracing**: Envuelve la lógica de negocio en un Trace personalizado de Firebase Performance (`get_currency_rates_service`).

## Uso

```typescript
import { CurrencyService } from './services/CurrencyService';

// Obtener tasas (con caché y monitoreo)
const rates = await CurrencyService.getRates();

// Buscar moneda
const results = await CurrencyService.searchCurrencies('euro');
```

## Configuración de Performance

La implementación utiliza las siguientes métricas en Firebase Console:
*   **Http Metric**: `https://vt.isapp.dev/api/rates` (GET)
    *   Attributes: Response Code, Content-Type, Payload Size.
*   **Custom Trace**: `get_currency_rates_service`
    *   Attributes: `error` (true/false).

## Manejo de Errores

| Código | Descripción | Acción |
|--------|-------------|--------|
| 200    | Éxito       | Se actualiza caché y retorna datos. |
| 401    | Unauthorized| Verificar `X-API-Key`. |
| 500+   | Server Error| Se sirve caché local si existe. |
| Network| Sin conexión| Se sirve caché local si existe. |

## Pruebas

Se han incluido pruebas unitarias en `__tests__/services/CurrencyService.test.ts` que validan:
1.  Correcta formación del Request (Headers, URL).
2.  Mapeo correcto de JSON a Entidades.
3.  Fallback a Mock en caso de error.
