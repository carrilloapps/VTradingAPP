# Implementación de la Pestaña de Ajustes

## Resumen
Se ha implementado una nueva pestaña de "Ajustes" en la aplicación, basada en el diseño proporcionado en `template/ajustes.html`. Esta implementación sigue la arquitectura del proyecto React Native 0.83, utilizando `react-native-paper` para los estilos y temas, y `react-native-safe-area-context` para la gestión de áreas seguras.

## Análisis de Componentes Reutilizados
Basado en `template/ajustes.html`, se identificaron los siguientes patrones y componentes reutilizables:

1.  **Layout General**: Estructura de cabecera, contenido con scroll y barra de navegación inferior (ya gestionada por `AppNavigator`).
2.  **Tarjetas de Información**: Contenedores con bordes redondeados, sombras suaves y colores de fondo dependientes del tema.
3.  **Elementos de Lista**: Botones y opciones con iconos a la izquierda, texto principal y controles (switches, flechas) a la derecha.
4.  **Badges**: Indicadores de estado (ej. "PRO", "Sube", "Baja") con colores de fondo y texto específicos.

## Nuevos Componentes Desarrollados
Para mantener la modularidad y reutilización, se crearon los siguientes componentes en `src/components/settings/`:

### 1. `UserProfileCard`
- **Responsabilidad**: Muestra la información del usuario (avatar, nombre, correo) y el badge "PRO".
- **Características**:
  - Avatar con borde y sombra.
  - Botón de edición.
  - Adaptable al tema claro/oscuro.

### 2. `AlertItem`
- **Responsabilidad**: Representa una alerta de precio individual.
- **Props**: `symbol`, `status` (Sube/Baja), `target` (precio objetivo), `isActive`, `onToggle`, `iconName`, `iconColor`, `iconBgColor`.
- **Características**:
  - Icono con fondo coloreado.
  - Indicador de tendencia visual.
  - Switch para activar/desactivar.

### 3. `ThemeSelector`
- **Responsabilidad**: Permite seleccionar el tema de la aplicación (Claro, Oscuro, Sistema).
- **Características**:
  - Visualización gráfica de las opciones.
  - Integración directa con `ThemeContext` para aplicar cambios en tiempo real.

### 4. `MenuButton`
- **Responsabilidad**: Botones de acción genéricos para el menú (ej. "Seguridad", "Cerrar Sesión").
- **Props**: `icon`, `label`, `onPress`, `isDanger` (para acciones destructivas), `hasTopBorder`.

## Integración
- **Pantalla Principal**: `src/screens/SettingsScreen.tsx`
  - Integra todos los componentes anteriores.
  - Utiliza `ScrollView` para contenido desplazable.
  - Gestiona el estado local para alertas y notificaciones (mocks por ahora).
  - Implementa `useSafeAreaInsets` para garantizar que el contenido no se solape con la barra de estado o gestos del sistema.
- **Navegación**: Se registró `SettingsScreen` en `src/navigation/AppNavigator.tsx` dentro del `BottomTabNavigator`.

## Validación
Se realizaron pruebas unitarias y de integración:
- **Archivo de prueba**: `__tests__/SettingsScreen.test.tsx`
- **Resultados**:
  - Renderizado correcto de todos los componentes.
  - Funcionamiento de los selectores de tema.
  - Interacción con los switches de alertas.
  - Verificación de textos y etiquetas de accesibilidad.

## Notas Técnicas
- **Accesibilidad**: Se añadieron etiquetas `accessibilityLabel` y roles apropiados para lectores de pantalla.
- **Temas**: Todos los componentes utilizan `useTheme` de `react-native-paper` para garantizar coherencia visual en modos claro y oscuro.
- **Safe Area**: Se ajustaron los paddings superiores e inferiores utilizando los insets del sistema.
