# Referencia de API e Integración de Notificaciones

Este documento detalla los endpoints disponibles en **VTradingAPI** y el protocolo de integración para notificaciones Push (FCM) que la aplicación móvil espera recibir.

## Configuración Base

*   **Base URL (Ejemplo):** `https://api.vtrading.app`
*   **Autenticación:** `X-API-Key` (Header)

---

## 1. Endpoints de Datos (REST)

Estos son los comandos CURL para consultar los datos de mercado que consume la aplicación.

### 1.1. Obtener Tasas de Cambio (BCV, Paralelo, Crypto)
Obtiene el resumen general de tasas, incluyendo BCV, Enparalelo, y principales criptomonedas.

```bash
curl -X GET "{{BASE_URL}}/api/rates" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Respuesta Esperada (Estructura):**
```json
{
  "rates": [
    { "currency": "USD", "source": "BCV", "rate": 36.5, ... },
    { "currency": "EUR", "source": "BCV", "rate": 39.2, ... }
  ],
  "border": [...],
  "crypto": [...]
}
```

### 1.2. Obtener Mercado Bursátil (BVC)
Obtiene datos de la Bolsa de Valores de Caracas (Renta Variable).

```bash
curl -X GET "{{BASE_URL}}/api/bvc/market" \
  -H "X-API-Key: YOUR_API_KEY"
```

### 1.3. Obtener Datos P2P (Crypto)
Consulta ofertas P2P (ej. Binance) con filtros específicos.

**Parámetros:**
*   `asset`: Activo (USDT, BTC, etc.) - Default: USDT
*   `fiat`: Moneda Fiduciaria (VES, USD) - Default: VES
*   `tradeType`: Tipo de operación (BUY, SELL) - Default: BUY
*   `limit`: Cantidad de resultados - Default: 10

```bash
# Ejemplo: Comprar USDT con Bolívares (VES)
curl -X GET "{{BASE_URL}}/api/crypto?asset=USDT&fiat=VES&tradeType=BUY&limit=10" \
  -H "X-API-Key: YOUR_API_KEY"
```

### 1.4. Health Check
Verificar estado del sistema.

```bash
curl -X GET "{{BASE_URL}}/health"
```

---

## 2. Sistema de Notificaciones (FCM Integration)

La aplicación VTrading utiliza un sistema de **Alertas de Precio Locales** activadas por **Mensajes de Datos (Data Messages)** silenciosos enviados desde el backend.

### 2.1. Arquitectura
1.  **VTradingAPI** detecta un cambio de precio en un par (ej. USD/VES).
2.  **VTradingAPI** envía un mensaje FCM al topic correspondiente al símbolo (`ticker_{symbol}`).
3.  **VTrading App** (suscrita al topic) recibe el mensaje silencioso en segundo plano.
4.  **VTrading App** verifica si el nuevo precio cumple alguna alerta configurada por el usuario.
5.  Si se cumple, la App muestra una notificación local (`TopToast` o Notificación de Sistema).

### 2.2. Protocolo de Topics
Los clientes se suscriben a topics normalizados basados en el símbolo del par.
*   Formato: `ticker_{symbol_sanitized}`
*   Sanitización: Minúsculas, caracteres no alfanuméricos reemplazados por `_`.

**Ejemplos:**
*   `USD/VES` -> `ticker_usd_ves`
*   `BTC/USD` -> `ticker_btc_usd`

### 2.3. Schema del Payload (Data Message)
El backend debe enviar un mensaje con **solo** el campo `data` (sin `notification` para evitar alertas visuales automáticas no deseadas).

```json
{
  "to": "/topics/ticker_usd_ves",
  "data": {
    "symbol": "USD/VES",
    "price": "205.50",
    "timestamp": "1705780000"
  }
}
```

### 2.4. Simulación de Backend (Testing via CURL)
Para probar la recepción de alertas en la App sin esperar un cambio real de mercado, utiliza este CURL contra la API de Firebase (Legacy HTTP).

> **Nota:** Requiere la `SERVER_KEY` de Firebase Console > Project Settings > Cloud Messaging.

```bash
# Simular que el USD/VES subió a 205.50
curl -X POST "https://fcm.googleapis.com/fcm/send" \
     -H "Authorization: key=TU_SERVER_KEY_DE_FIREBASE" \
     -H "Content-Type: application/json" \
     -d '{
       "to": "/topics/ticker_usd_ves",
       "data": {
         "symbol": "USD/VES",
         "price": "205.50"
       }
     }'
```

**Comportamiento Esperado en la App:**
1.  Si el usuario tiene una alerta activa: "USD/VES Mayor a 200".
2.  Y la App recibe este payload (Price: 205.50).
3.  Se disparará una notificación visual (TopToast en Foreground, Notificación de Sistema en Background).
