# Guía para Agentes VTradingAPP

Este proyecto utiliza documentación distribuida para mantener el contexto cerca del código relevante. Por favor, consulta los archivos `AGENTS.md` en los directorios específicos para detalles de implementación.

## Principios Globales de Desarrollo
*   **Reutilización Primero:** Antes de crear un nuevo componente UI, verifica si ya existe uno similar. Si encuentras código duplicado (ej. selectores, tarjetas, botones con estilos específicos) en múltiples pantallas, **debes** refactorizarlo en un componente reutilizable dentro de `src/components/`.
*   **Centralización de Estilos:** Todos los valores de estilo (colores, roundness, espaciados) deben provenir de `src/theme/theme.ts`.

## Índice de Documentación
*   **Tema y Estilos:** [src/theme/AGENTS.md](src/theme/AGENTS.md)
*   **Componentes Dashboard:** [src/components/dashboard/AGENTS.md](src/components/dashboard/AGENTS.md)
*   **Pantallas (Screens):** [src/screens/AGENTS.md](src/screens/AGENTS.md)
*   **Servicios:** [src/services/AGENTS.md](src/services/AGENTS.md)

---
*Última actualización: 20 de Enero de 2026*
