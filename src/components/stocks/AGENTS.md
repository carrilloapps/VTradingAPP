# Notas de Implementación Stocks UI

Este documento registra estándares de UI/UX y decisiones técnicas para componentes de la sección Mercado Bursátil (Stocks).

## Estados de Carga (Skeleton Loading)

Para garantizar una percepción de rendimiento fluido y evitar saltos de contenido (layout shifts), se ha implementado un sistema de Skeleton Loading específico para esta sección en `StocksSkeleton.tsx`.

### StocksSkeleton

Este componente replica la estructura exacta de `StocksScreen` mientras se cargan los datos.

*   **Estructura Replicada:**
    1.  **Header:** Título y botones de acción (Search, Filter).
    2.  **Search Bar:** Input de búsqueda inactivo.
    3.  **Market Status:** Estado del mercado (Abierto/Cerrado).
    4.  **Index Hero:** Tarjeta destacada del índice principal.
    5.  **Stock List:** Lista de acciones (`StockItem`).

*   **Sincronización Visual:**
    *   **StockItem Skeleton:** Usa las mismas dimensiones, padding y `borderRadius` que el componente `StockItem` real.
    *   **Elevación y Bordes:**
        *   **Global (Light/Dark):** Aplica `elevation: 0` (Flat), borde `theme.colors.outline` (o transparente en dark mode si se prefiere, pero el estándar es mantener borde sutil) y fondo `theme.colors.elevation.level1`.
    *   **Animación:** Utiliza el componente base `Skeleton` (gradiente animado) para indicar actividad.

### Componentes Relacionados
*   `src/components/ui/Skeleton.tsx`: Componente base animado.
*   `src/components/stocks/StockItem.tsx`: Componente "vivo" que se imita.

---
*Última actualización: 20 de Enero de 2026*
