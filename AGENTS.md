# Notas de Implementación UI/UX y Guía para Agentes

Este documento registra mejoras de diseño, estándares de UI/UX adoptados y decisiones técnicas relevantes para mantener la consistencia en VTradingAPP.

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

---
*Última actualización: 17 de Enero de 2026*

## Estándares de Tematización y React Native Paper

Para garantizar la consistencia visual y la mantenibilidad del código, se establecen las siguientes reglas estrictas sobre el uso de estilos y componentes de UI:

### 1. Centralización en `theme.ts`
*   **Fuente Única de Verdad:** Todo valor de estilo reutilizable (colores, bordes, tipografía, formas) **DEBE** estar definido en `src/theme/theme.ts`.
*   **Prohibido Hardcoding:** No se permite "quemar" (hardcode) valores de colores hexadecimales o radios de borde numéricos en los archivos de componentes.
    *   ❌ Incorrecto: `borderRadius: 12`, `backgroundColor: '#f2f5f8'`
    *   ✅ Correcto: `borderRadius: theme.roundness * 3`, `backgroundColor: theme.colors.background`

### 2. Uso de `theme.roundness`
*   La propiedad global `roundness` está configurada en **4**.
*   Para definir bordes redondeados, se deben usar multiplicadores de este valor base:
    *   `borderRadius: theme.roundness * 3` (12px) -> Estándar para tarjetas y contenedores pequeños.
    *   `borderRadius: theme.roundness * 4` (16px) -> Estándar para modales y contenedores grandes.
    *   `borderRadius: theme.roundness * 5` (20px) -> **OBLIGATORIO** para elementos circulares (avatares, iconos de moneda) de tamaño estándar (40px).

### 3. Componentes de React Native Paper
*   Priorizar el uso de componentes de `react-native-paper` (`Text`, `Surface`, `Button`, `IconButton`) sobre los nativos de `react-native` (`View`, `Text` básico) cuando se requiera integración con el tema.
*   Utilizar el hook `useTheme()` para acceder a las propiedades del tema en componentes funcionales.

### 4. Skeletons y Estados de Carga
*   **Colores Definidos en Tema:** Los componentes de carga (Skeleton) **DEBEN** usar los colores semánticos definidos en el tema, nunca valores hardcodeados.
    *   Propiedad base: `theme.colors.skeleton`
    *   Propiedad brillo/highlight: `theme.colors.skeletonHighlight`
*   Esto asegura que el modo oscuro/claro funcione automáticamente sin lógica condicional en el componente.

---
*Última actualización: 20 de Enero de 2026*
