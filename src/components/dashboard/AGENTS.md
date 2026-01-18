# Notas de Implementación UI/UX para Dashboard

Este documento registra estándares de UI/UX y decisiones técnicas para componentes del Dashboard.

## Mejoras en CurrencyPickerModal (Selección de Divisas)

Se ha realizado una refactorización visual del modal de selección de divisas (`CurrencyPickerModal.tsx`) para corregir problemas de espaciado, márgenes y jerarquía visual.

### Cambios Realizados
1.  **Márgenes y Espaciado (Spacing & Margins):**
    *   Se estandarizaron los márgenes laterales (`marginHorizontal`) en **20px** para la barra de búsqueda y **16px** para los elementos de la lista, alineándolos visualmente con el título del modal.
    *   Se aumentó el `paddingVertical` de los ítems de lista a **12px** para mejorar el área táctil (touch target) y dar "aire" al contenido.
    *   Se añadió `marginHorizontal: 24` a los encabezados de sección ("PRINCIPALES", "OTRAS MONEDAS") para alinearlos con el inicio visual del contenido.

2.  **Estilo de Lista (List Style):**
    *   Se eliminaron las líneas separadoras (`borderBottomWidth`) que chocaban con el estilo de "tarjeta" (`borderRadius`).
    *   Se adoptó un estilo de **Tarjetas Flotantes (Floating Cards)** para los ítems:
        *   `borderRadius: 12`
        *   Fondo transparente por defecto.
        *   Fondo `theme.colors.secondaryContainer` para el ítem seleccionado, mejorando la visibilidad y consistencia con el tema Material Design 3.

3.  **Barra de Búsqueda (Searchbar):**
    *   Se añadió `marginHorizontal: 20`.
    *   Se definió una altura explícita de `50` y `borderRadius: 12` para coincidir con la estética redondeada de la app.
    *   Se eliminó la elevación (`elevation: 0`) para un look más limpio y plano ("flat").

4.  **Tipografía y Feedback Visual:**
    *   El código de la moneda seleccionada ahora se muestra con `fontWeight: '700'` (bold).
    *   Los iconos de las monedas seleccionadas usan `theme.colors.onPrimary` sobre un fondo `primary`, asegurando contraste accesible.

### Estándares a Seguir (Guidelines)
Para futuros modales o listas de selección:
*   **Contenedores:** Usar `paddingHorizontal` de **16px a 24px** para evitar que el contenido toque los bordes.
*   **Ítems de Lista:** Preferir estilos de tarjeta con bordes redondeados (`borderRadius: 12-16`) sobre listas planas con separadores, a menos que sea una lista muy densa.
*   **Selección:** Usar cambios de color de fondo (`secondaryContainer` o `primaryContainer`) y peso de fuente (`bold`) para indicar el estado activo, además del checkmark.
*   **Áreas Táctiles:** Asegurar altura mínima de 48px (padding vertical 12px+ con contenido) para elementos interactivos.

## Tarjetas de Cambio (ExchangeCard) y Gráficos

Para mantener la consistencia en la visualización de tendencias de mercado en `HomeScreen` y otros dashboards:

*   **Líneas de Tendencia (Charts):**
    *   **Variación 0%:** Si el cambio porcentual es 0 (o "0.00%"), se debe renderizar una **línea recta horizontal** centrada.
        *   Path SVG: `M0 20 L 100 20` (asumiendo viewBox 0 0 100 40).
        *   Color: `theme.colors.onSurfaceVariant` (Neutro).
    *   **Variación Positiva/Negativa:** Usar curvas Bézier suaves.
        *   Positiva: `M0 30 C 30 30, 50 10, 100 5` (Ascendente).
        *   Negativa: `M0 10 C 30 10, 50 30, 100 35` (Descendente).
    *   **Doble Tendencia (Compra/Venta):** Para tarjetas que muestran tasas de Compra y Venta simultáneamente (ej. Binance P2P):
        *   Renderizar **dos líneas superpuestas** en el mismo contenedor SVG.
        *   **Línea de Compra:** Opacidad 0.8, color basado en `buyChangePercent`.
        *   **Línea de Venta:** Opacidad 0.8, color basado en `sellChangePercent`.
        *   Esto permite visualizar divergencias entre la oferta y la demanda.

*   **Colores de Tendencia:**
    *   Positivo (> 0%): `theme.colors.success` (Verde).
    *   Negativo (< 0%): `theme.colors.error` (Rojo).
    *   Neutro (= 0%): `theme.colors.onSurfaceVariant` (Gris).
    *   **Nota:** Validar siempre contra strings como "0.00%", "+0.00%", "0%" para detectar el estado neutro correctamente.

## Estándares de Componentes
*   Los componentes deben ser puramente presentacionales siempre que sea posible.
*   Evitar lógica de negocio compleja (cálculos de tasas, fetch de datos) dentro de los componentes visuales (`ExchangeCard`, `RateCard`). Pasar estos datos como props.
