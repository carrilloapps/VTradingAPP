# VTradingAPP

Este proyecto es una aplicación React Native inicial configurada con `react-native-paper` y navegación básica.

## Requisitos Previos

- Node.js >= 18
- JDK 17 (para Android)
- Android Studio configurado

## Instalación

1. Clonar el repositorio (si aplica).
2. Instalar dependencias:
   ```bash
   npm install
   ```

## Configuración de Dependencias Nativas

### Android
El proyecto ya está configurado para usar `react-native-vector-icons`. Se ha modificado `android/app/build.gradle` para incluir las fuentes.

### iOS
Si estás en macOS, recuerda instalar los pods:
```bash
cd ios
pod install
cd ..
```

## Estructura del Proyecto

```
src/
  components/  # Componentes reutilizables
  screens/     # Pantallas de la aplicación (HomeScreen, DiscoverScreen)
  navigation/  # Configuración de navegación (AppNavigator)
  theme/       # Configuración del tema (Paper Theme)
  utils/       # Utilidades
```

## Ejecución

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## Pruebas

El proyecto incluye configuración de Jest y React Native Testing Library.

Para ejecutar las pruebas:
```bash
npm test
```

## Características Integradas

- **React Native 0.83**: Última versión estable.
- **React Native Paper**: Biblioteca de componentes UI Material Design.
- **React Navigation**: Navegación entre pantallas.
- **Vector Icons**: Iconos listos para usar.
- **Jest & Testing Library**: Configuración lista para pruebas unitarias.
