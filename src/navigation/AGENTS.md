# Estándares de Navegación

## Tab Navigation Global
Se utiliza `createMaterialTopTabNavigator` (con `tabBarPosition: 'bottom'`) en lugar de `createBottomTabNavigator` para permitir gestos de deslizamiento (Swipe) entre pestañas, mejorando la fluidez y ergonomía de la aplicación.

### Configuración Clave
*   **Gestos:** `swipeEnabled: true` debe estar activo para permitir cambiar de pestaña deslizando lateralmente.
*   **Animación:** Las transiciones entre pestañas son animadas gracias a `react-native-pager-view` y `react-native-reanimated`.
*   **Posición:** Se fuerza la posición inferior con `tabBarPosition: 'bottom'`.
*   **Tab Bar Personalizado:** Se utiliza el componente `ModernTabBar` adaptado para recibir `MaterialTopTabBarProps`.

### ModernTabBar
El componente `ModernTabBar` ha sido actualizado para ser compatible con `MaterialTopTabBarProps`.
*   **Compatibilidad:** Mantiene la misma estética visual (diseño flotante, animaciones de escala) pero se integra con el sistema de eventos y estado de `MaterialTopTabs`.
*   **Insets:** Gestiona manualmente los insets de seguridad (`useSafeAreaInsets`) ya que el navegador de pestañas superiores no inyecta `insets` en las props por defecto como lo hace el `BottomTabNavigator`.

## Transiciones y Pantallas de Carga
*   **Eliminación de Splash Screen:** Se ha eliminado la pantalla `SplashScreen` dedicada y su lógica de bloqueo.
*   **Skeleton Screens:** Se prioriza el uso de "Skeleton Screens" (ej. `DashboardSkeleton`) y estados de carga integrados en las pantallas (ej. `LottieView` en `ExchangeRatesScreen`) para una percepción de carga más rápida y fluida.
*   **Animaciones Lottie:** Se utilizan animaciones Lottie (ej. `splash.json` como loader) para reemplazar indicadores de carga estáticos (`ActivityIndicator`) donde sea posible, mejorando la experiencia visual.
