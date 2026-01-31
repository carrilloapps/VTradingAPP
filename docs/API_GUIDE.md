# Guía de API y Referencia Técnica

Este documento describe la arquitectura de integración con la API de VTrading y la referencia técnica de los endpoints disponibles.

## 1. Arquitectura de Integración

VTradingAPP utiliza un cliente HTTP centralizado para garantizar seguridad, rendimiento y resiliencia.

### ApiClient (`src/services/ApiClient.ts`)
- **Seguridad**: Inyecta automáticamente tokens de Firebase App Check y API Keys.
- **Rendimiento**: Monitorea cada petición con **Firebase Performance** (`newHttpMetric`).
- **Resiliencia**: Implementa "Stale-While-Revalidate" usando `AsyncStorage`. Si la red falla, sirve datos de caché con un TTL configurable (5 min por defecto).

### CurrencyService (`src/services/CurrencyService.ts`)
- Unifica fuentes de datos (Fiat, Crypto, Fronterizos).
- Maneja la lógica de inversión de tasas y promedios.
- Instrumentado con trazas personalizadas de Firebase Performance.

---

## 2. Referencia de Endpoints (REST)

**Base URL:** `https://api.vtrading.app`  
**Autenticación:** Header `X-API-Key`

### 2.1. Tasas de Cambio
Obtiene un resumen general de tasas (BCV, Paralelo, Crypto).
```bash
curl -X GET "https://api.vtrading.app/api/rates" -H "X-API-Key: YOUR_KEY"
```

### 2.2. Mercado Bursátil (BVC)
Datos de la Bolsa de Valores de Caracas.
```bash
curl -X GET "https://api.vtrading.app/api/bvc/market" -H "X-API-Key: YOUR_KEY"
```

### 2.3. Datos P2P (Crypto)
Consulta ofertas P2P (ej. Binance).
- **Parámetros**: `asset` (USDT), `fiat` (VES), `tradeType` (BUY/SELL).
```bash
curl -X GET "https://api.vtrading.app/api/crypto?asset=USDT&fiat=VES" -H "X-API-Key: YOUR_KEY"
```

---

## 3. Manejo de Errores y Fallback

| Código | Descripción | Acción de la App |
|--------|-------------|------------------|
| 200    | Éxito       | Actualiza caché y retorna datos. |
| 401    | No Autorizado| Notifica al usuario / loguea error. |
| 500+   | Error Server| Retorna caché local (si existe). |
| Red    | Sin Conexión| Retorna caché local + Toast informativo. |

---

## 4. Pruebas
Los servicios cuentan con pruebas unitarias en `__tests__/services/` que validan el mapeo de datos y la lógica de fallback.
