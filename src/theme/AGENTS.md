# Estándares de Tematización

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
*   **Skeletons y Estados de Carga**
*   **Colores Definidos en Tema:** Los componentes de carga (Skeleton) **DEBEN** usar los colores semánticos definidos en el tema, nunca valores hardcodeados.
    *   Propiedad base: `theme.colors.skeleton`
    *   Propiedad brillo/highlight: `theme.colors.skeletonHighlight`
*   Esto asegura que el modo oscuro/claro funcione automáticamente sin lógica condicional en el componente.

## Reglas de Directorio
*   **Única fuente de verdad** para colores, radios y tipografía.
*   Si se necesita un nuevo color semántico (ej. `skeletonDark`), agregarlo aquí, no en el componente.
*   Usar `theme.roundness` como unidad base para bordes (multiplicadores 3, 4, 5).
