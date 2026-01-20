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
    *   `borderRadius: theme.roundness * 6` (24px) -> **ESTÁNDAR GLOBAL** para Tarjetas (Cards) y contenedores principales (Dashboard, Stocks, etc.).

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

### 5. Diseño Plano Universal (Universal Flat Design)
*   **Regla Global:** Todas las superficies elevadas (Cards, Dialogs, Modals, SearchBars, BottomSheet, TabBar) deben seguir un diseño "Flat" (Plano).
*   **Estilos Obligatorios:**
    *   `elevation: 0` (Android)
    *   `shadowOpacity: 0` (iOS)
    *   `borderWidth: 1`
    *   `borderColor: theme.colors.outline` (Color "Material Level" sutil)
    *   **Nota sobre Colores de Borde (Dark Mode):** En modo oscuro, se utilizan colores específicos (`#2A302D`) para mantener la sutileza sin perder definición.
    *   `backgroundColor`:
        *   Cards/Inputs: `theme.colors.elevation.level1` (o `surface`)
        *   **Inputs de Formulario (Dialogs):** `theme.colors.surfaceVariant` para diferenciar del fondo del diálogo.
        *   Dialogs/Modals: `theme.colors.elevation.level3`
*   **Overlay (Fondo Oscuro):**
    *   Para Modales y Diálogos, se utiliza `theme.colors.backdrop` (`rgba(0, 0, 0, 0.8)`) en ambos modos (Claro/Oscuro) para garantizar un enfoque visual total en el contenido.
*   **Prohibido:** El uso de sombras (`elevation` > 0) para denotar profundidad. La profundidad se denota exclusivamente mediante bordes y niveles de color de superficie.
*   **Excepción:** Botones flotantes (FAB) pueden mantener elevación si es crítico para la UX, pero deben evaluarse caso por caso.

### 6. Contraste y Accesibilidad de Color
*   **Estados Activos (Primary):** Cuando un elemento (Botón, Chip, Icono Activo) utiliza `theme.colors.primary` como color de fondo:
    *   **Contenido (Texto/Icono):** DEBE usar obligatoriamente `theme.colors.onPrimary`.
    *   **Razón:** En modo oscuro, `primary` puede ser un color pastel claro (para reducir fatiga visual), mientras que en modo claro es oscuro. `onPrimary` cambia dinámicamente (Negro/Blanco) para garantizar la legibilidad en ambos casos.
    *   ❌ Incorrecto: `color: 'white'` (Falla en modo oscuro si primary es claro).
    *   ✅ Correcto: `color: theme.colors.onPrimary`.
*   **Botones con Borde (Outlined Buttons):**
    *   Deben usar `borderColor: theme.colors.primary` y `textColor={theme.colors.primary}` para denotar interactividad clara. Evitar bordes grises para acciones principales o secundarias importantes.

### 7. Sistema de Espaciado (Spacing)
*   **Centralización:** Todo espaciado (padding, margin, gap) que no sea estructural (flex: 1) debe utilizar las variables definidas en `theme.spacing`.
*   **Escala:**
    *   `xs` (4px): Espaciado mínimo, ajustes finos (ej. gap entre filtro y header).
    *   `s` (8px): Espaciado pequeño, gap entre elementos relacionados.
    *   `m` (12px): Espaciado medio, márgenes estándar de componentes.
    *   `l` (16px): Padding de contenedores, separación de secciones.
    *   `xl` (20px): Padding horizontal de pantallas, gap header-contenido.
    *   `xxl` (24px): Separación mayor entre bloques grandes.
*   ❌ Incorrecto: `marginTop: 4`, `padding: 20`
*   ✅ Correcto: `marginTop: theme.spacing.xs`, `padding: theme.spacing.xl`
