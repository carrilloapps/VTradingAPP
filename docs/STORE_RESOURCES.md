# Recursos de Tienda y Lanzamiento

Este documento centraliza los activos y notas necesarios para la publicación de la aplicación en las tiendas (Google Play Store / Apple App Store).

## Novedades de la Versión (v1.0.0)
- **Experiencia Mejorada**: Flujo de inicio con Skeleton UI.
- **Datos Reales**: Monitoreo de latencia para info de mercado precisa.
- **Estabilidad**: Migración a infraestructura Firebase de última generación.
- **Correcciones**: Optimización de consumo de batería y errores menores.

## Metadatos (Google Play Console)
- **Título**: VTradingAPP: Mercado y Finanzas
- **Descripción Corta**: Cotizaciones, divisas y análisis financiero en tiempo real.
- **Descripción Larga**: 
  VTradingAPP es la herramienta definitiva para el inversor moderno. 
  - Datos de mercado en tiempo real.
  - Monitor de divisas (BCV, Paralelo, Crypto).
  - Diseño Material 3 con modo oscuro.
  - Seguridad reforzada con Firebase App Check.

---

## checklist Pre-Lanzamiento
- [/] Ejecutar `npm run test:coverage` (asegurar cobertura de lógica crítica).
- [ ] Verificar que `SENTRY_AUTH_TOKEN` no esté en `.env`.
- [ ] Probar flujo de actualización forzada (Force Update) en servidor de staging.
- [ ] Validar etiquetas de accesibilidad en el Header principal.
