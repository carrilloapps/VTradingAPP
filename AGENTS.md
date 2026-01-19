# Guía para Agentes VTradingAPP

Este proyecto utiliza documentación distribuida para mantener el contexto cerca del código relevante. Por favor, consulta los archivos `AGENTS.md` en los directorios específicos para detalles de implementación.

## Principios Globales de Desarrollo
*   **Validación Obligatoria:** Antes de considerar una tarea completada, **siempre ejecuta `npx tsc`** y corrige cualquier error de compilación. No entregar código que no compile.
*   **Reutilización Primero:** Antes de crear un nuevo componente UI, verifica si ya existe uno similar. Si encuentras código duplicado (ej. selectores, tarjetas, botones con estilos específicos) en múltiples pantallas, **debes** refactorizarlo en un componente reutilizable dentro de `src/components/`.
*   **Centralización de Estilos:** Todos los valores de estilo (colores, roundness, espaciados) deben provenir de `src/theme/theme.ts`.
*   **Estilo de Tarjetas (Cards):** Todas las tarjetas deben usar un diseño "Flat" (Plano) sin elevación (`elevation: 0`), con bordes ligeros (`theme.colors.outline`, `borderWidth: 1`) y esquinas redondeadas estándar (`borderRadius: theme.roundness * 6` = 24px).
*   **Firebase API Modular:** Está estrictamente prohibido usar las APIs con namespace de Firebase (ej. `auth()`, `perf()`). Se debe usar siempre la API modular (ej. `getAuth()`, `getPerformance()`) para asegurar compatibilidad futura con React Native Firebase v22+.

## Estándares de Navegación y UI Global
*   **Barra de Navegación (Tab Bar):**
    *   Se utiliza `ModernTabBar` como componente estándar para la navegación inferior.
    *   **Estilo:** Diseño limpio sin bordes superiores (`borderTopWidth: 0`), con elevación/sombra suave y animaciones de escala/elevación en la pestaña activa.
    *   **Iconografía:** Se estandariza el uso de `MaterialCommunityIcons` para todas las pestañas (`currency-usd`, `candlestick`, `wallet`, `cog`) para mayor consistencia y profesionalismo.
    *   **Tab Central (Home):** El tab de inicio se posiciona en el centro. Para la representación de "Bolívares", se utiliza un icono tipográfico personalizado ("Bs") centrado en un contenedor `View` de 32x32 para evitar deformaciones.
    *   **Alineación de Iconos:** Todos los iconos de la barra de navegación deben estar envueltos en un `View` con dimensiones fijas (ej. 24x24) y alineación centrada (`justifyContent: 'center'`, `alignItems: 'center'`) para evitar distorsiones visuales en las animaciones.

## Índice de Documentación
*   **Tema y Estilos:** [src/theme/AGENTS.md](src/theme/AGENTS.md)
*   **Componentes Dashboard:** [src/components/dashboard/AGENTS.md](src/components/dashboard/AGENTS.md)
*   **Componentes Stocks:** [src/components/stocks/AGENTS.md](src/components/stocks/AGENTS.md)
*   **Componentes Notificaciones:** [src/components/notifications/AGENTS.md](src/components/notifications/AGENTS.md)
*   **Componentes UI (Globales):** [src/components/ui/AGENTS.md](src/components/ui/AGENTS.md)
*   **Pantallas (Screens):** [src/screens/AGENTS.md](src/screens/AGENTS.md)
*   **Navegación:** [src/navigation/AGENTS.md](src/navigation/AGENTS.md)
*   **Servicios:** [src/services/AGENTS.md](src/services/AGENTS.md)

---
*Última actualización: 20 de Enero de 2026*
