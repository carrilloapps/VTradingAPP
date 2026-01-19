# Estándares de Servicios

## Reglas de Implementación
*   Los servicios deben ser **stateless** o **singletons** manejados cuidadosamente.
*   Para datos financieros críticos (Tasas, Acciones), desactivar caché de cliente (`useCache: false`) o usar TTL muy corto.
*   **Mapeo de Datos:** Transformar respuestas de API a interfaces internas dentro del servicio, nunca en la UI. La UI solo debe recibir datos listos para renderizar (ej. `CurrencyRate`, `StockData`).

## Servicios Principales

### CurrencyService
*   Maneja tasas de cambio (Fiat y Cripto).
*   Combina fuentes oficiales (BCV) y P2P (Binance).
*   Provee suscripción a actualizaciones en tiempo real.
*   **Constantes Centralizadas:** Mantiene la lista oficial de stablecoins (`STABLECOINS = ['USDT', 'USDC', 'DAI', 'FDUSD']`) para su uso unificado en toda la app.
*   **Lógica de Negocio Centralizada:** Implementa `getAvailableTargetRates` para validar pares de conversión:
    1.  **VES/Bs:** -> Todas las divisas.
    2.  **Fiat (BCV):** -> VES/Bs o Cripto (incluyendo Stablecoins). *Permite comparar oficial vs mercado digital.*
    3.  **Frontera (Border):** -> VES/Bs o Stablecoins. *Evita pares ilógicos como COP->USD.*
    4.  **Cripto:** -> VES/Bs, Frontera o Cripto.

### StocksService
*   Maneja datos del mercado bursátil (Acciones, Índices).
*   Provee datos de cierre, apertura y volumen.
*   Calcula índices de mercado (ej. IBC).

### FCMService
*   Maneja la integración con Firebase Cloud Messaging.
*   **Suscripción Demográfica:** Automáticamente suscribe al dispositivo a topics técnicos (OS, Versión, Build, Tema, Cohorte) al obtener permisos, permitiendo segmentación de notificaciones masivas.
*   **Gestión de Topics:** Expone métodos para suscribir/desuscribir a alertas de precios (`ticker_xxx`).
