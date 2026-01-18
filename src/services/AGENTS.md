# Estándares de Servicios

## Reglas de Implementación
*   Los servicios deben ser **stateless** o **singletons** manejados cuidadosamente.
*   Para datos financieros críticos (Tasas), desactivar caché de cliente (`useCache: false`) o usar TTL muy corto.
*   **Mapeo de Datos:** Transformar respuestas de API a interfaces internas dentro del servicio, nunca en la UI. La UI solo debe recibir datos listos para renderizar (ej. `CurrencyRate`).
