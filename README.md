# VTradingAPP 🚀

VTradingAPP es una plataforma financiera avanzada desarrollada con React Native, diseñada para ofrecer seguimiento en tiempo real de mercados de divisas y acciones, cálculos financieros complejos y una experiencia de usuario premium con soporte multiplataforma.

![Status](https://img.shields.io/badge/Status-Active-success)
![React Native](https://img.shields.io/badge/ReactNative-0.83.1-blue)
![Firebase](https://img.shields.io/badge/Firebase-Integrated-orange)
![Sentry](https://img.shields.io/badge/Sentry-Monitored-purple)

## ✨ Características Principales

-   📈 **Tasas de Cambio en Tiempo Real**: Seguimiento de divisas globales con datos actualizados y gráficos de detalle.
-   🏛️ **Tasas Bancarias**: Comparativa de tasas de interés y tipos de cambio de principales entidades financieras.
-   📊 **Mercado de Acciones**: Visualización de stocks con información detallada y métricas de rendimiento.
-   🧮 **Calculadoras Avanzadas**: Motor de cálculo financiero para inversiones, préstamos y conversiones complejas.
-   🔔 **Sistema de Notificaciones Relevantes**: Notificaciones push integradas con Firebase (FCM) segmentadas por demografía técnica.
-   🖼️ **Widgets Nativos**: Soporte para widgets en la pantalla de inicio (Android).
-   🌓 **Tema Dinámico**: Soporte completo para modo claro y oscuro basado en Material Design 3.
-   🔒 **Seguridad**: Implementación de Firebase App Check y autenticación robusta.

## 🛠️ Stack Tecnológico

### Core
-   **React Native 0.83.1** (Arquitectura actual)
-   **TypeScript** para seguridad de tipos.
-   **React Navigation v7** (Stack, Tabs, Top Tabs).
-   **React Native Paper** para UI basada en Material Design.

### Servicios de Backend & Infraestructura
-   **Firebase Suite**:
    -   **Auth**: Gestión de usuarios.
    -   **Analytics & In-App Messaging**: Análisis de comportamiento y comunicación.
    -   **FCM**: Notificaciones push.
    -   **Remote Config**: Flags de funcionalidad y configuración dinámica.
    -   **Performance Monitoring**: Trazas de red y métricas personalizadas.
    -   **Crashlytics**: Reporte de errores en tiempo real.
    -   **App Check**: Seguridad de APIs.
    -   **App Distribution**: Despliegue de versiones beta.

### Monitorización y Observabilidad
-   **Sentry**: Gestión de errores y observabilidad de rendimiento.
-   **Microsoft Clarity**: Análisis visual de la experiencia de usuario (Mapas de calor).

### Almacenamiento y Rendimiento
-   **MMKV**: Almacenamiento rápido de clave-valor.
-   **AsyncStorage**: Caché persistente de API.
-   **React Native Reanimated**: Animaciones de alto rendimiento.

## 📂 Estructura del Proyecto

```text
src/
├── assets/         # Recursos estáticos (imágenes, fuentes, lottie)
├── components/     # Componentes UI organizados por característica (auth, dashboard, etc.)
├── constants/      # Constantes globales y configuraciones
├── context/        # Proveedores de estado global (Auth, Theme, Network, etc.)
├── navigation/     # Configuración de navegadores y rutas
├── screens/        # Pantallas principales del flujo de la aplicación
├── services/       # Lógica de API, servicios Firebase y observabilidad
├── theme/          # Sistema de diseño y tokens de tema
├── utils/          # Funciones de ayuda y lógica de negocio (Calculadoras)
└── widget/         # Configuración y handlers de widgets nativos
```

## 🚀 Instalación y Setup

### Requisitos Previos
-   Node.js >= 20
-   JDK 17+ (para Android)
-   Android Studio / Xcode configurado

### Instrucciones
1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/carrilloapps/VTradingAPP.git
    cd VTradingAPP
    ```
2.  **Instalar dependencias**:
    ```bash
    npm install
    ```
3.  **Configurar Firebase**: Asegúrate de colocar `google-services.json` en `android/app/` y `GoogleService-Info.plist` en `ios/`.

## 📱 Ejecución

### Entorno de Desarrollo
```bash
# Iniciar Metro Bundler
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS (requiere macOS)
npm run ios
```

### Comandos Útiles
-   `npm run lint`: Ejecuta el linter para asegurar calidad de código.
-   `npm test`: Ejecuta la suite de pruebas con Jest.
-   `npm run android:release`: Genera el bundle de producción para Android.

## 🧪 Pruebas y Calidad

El proyecto sigue un enfoque de **TDD (Test Driven Development)** con una cobertura exhaustiva.
-   **Framework**: Jest & React Native Testing Library.
-   **Mocks**: Preconfigurados para todos los servicios nativos y Firebase.

```bash
# Ejecutar todas las pruebas
npm test

# Ver cobertura de pruebas
npm run test:coverage
```

## 📄 Documentación Detallada

Para más detalles sobre implementaciones específicas, consulta la carpeta `docs/`:
-   📘 [Integración Firebase](docs/FIREBASE_INTEGRATION.md)
-   📡 [Integración de API](docs/API_INTEGRATION.md)
-   🔐 [Guía de Autenticación](docs/AUTH_IMPLEMENTATION.md)
-   🧮 [Guía del Calculador](docs/CALCULATOR_GUIDE.md)

---
Desarrollado con ❤️ por **CarrilloApps**
