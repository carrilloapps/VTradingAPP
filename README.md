<div align="center">
  <img src="src/assets/images/logotipo.png" alt="VTrading Logo" width="300" />
  <br />
  <p><b>Plataforma Financiera Avanzada</b></p>
</div>

VTrading es una plataforma financiera avanzada desarrollada con React Native, diseñada para ofrecer seguimiento en tiempo real de mercados de divisas y acciones, cálculos financieros complejos y una experiencia de usuario premium con soporte multiplataforma.

---

## 🚀 Características Principales

Esta aplicación ha sido optimizada para un alto rendimiento y estabilidad en producción:

- **Arquitectura de Alto Rendimiento:** Migración a **MMKV** para almacenamiento (20x más rápido) y **FlashList** para virtualización de listas.
- **Seguridad Robusta:** Protección de API mediante **Firebase App Check** y gestión segura de variables de entorno.
- **Observabilidad:** Integración profunda con **Sentry** para monitoreo de rendimiento y errores en tiempo real.
- **Widgets Nativos:** Widgets de Android rediseñados con motor de tendencias de 3 estados (Subida, Bajada, Neutral) y sincronización en segundo plano.
- **Diseño Premium:** Interfaz basada en **Material Design 3** con soporte nativo para modo Claro/Oscuro y animaciones fluidas.

## � Documentación

La documentación técnica detallada se encuentra distribuida en la carpeta `docs/`.

### Guías Principales

- 📘 **[Guía de API](docs/API_GUIDE.md)**: Arquitectura de red, caché y referencia técnica de endpoints.
- 🔔 **[Notificaciones](docs/NOTIFICATIONS_GUIDE.md)**: Configuración de Push (FCM), alertas de precio y resolución de problemas.
- 🔥 **[Integración de Firebase](docs/FIREBASE_INTEGRATION.md)**: Índice maestro de servicios y configuración global.
- 🛡️ **[Estándares y Calidad](docs/STANDARDS_AND_QUALITY.md)**: Buenas prácticas, accesibilidad (WCAG) y optimización de UI.
- 🔐 **[Analítica y Privacidad](docs/ANALYTICS_AND_PRIVACY.md)**: Política de datos, eventos de GA4 y monitoreo de sesiones.

### Guías de Características Específicas

- 👤 [Autenticación](docs/AUTH_IMPLEMENTATION.md): Flujo de inicio de sesión y perfiles.
- 🧮 [Calculadora](docs/CALCULATOR_GUIDE.md): Lógica del motor matemático y UI.
- ⚙️ [Remote Config](docs/REMOTE_CONFIG.md): Feature Flags y Force Update.
- 📰 [WordPress Integration](docs/WORDPRESS_INTEGRATION.md): Consumo de noticias via Headless CMS.

## �️ Instalación y Configuración

### Prerrequisitos

- Node.js >= 18
- JDK 17
- Android Studio / Xcode (macOS)

### Pasos de Instalación

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/carrilloapps/VTradingAPP.git
   cd VTradingAPP
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configuración de Entorno:**
   Asegúrate de configurar los archivos `.env` y añadir los archivos de configuración de Firebase:

   - Android: `android/app/google-services.json`
   - iOS: `ios/GoogleService-Info.plist`

4. **Ejecutar la aplicación:**

   ```bash
   # Iniciar Metro Bundler
   npm start

   # Ejecutar en Android
   npm run android

   # Ejecutar en iOS (macOS)
   npm run ios
   ```

## 🧪 Testing

El proyecto utiliza Jest para pruebas unitarias y de integración.

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con reporte de cobertura
npm run test:coverage
```

## 🤝 Contribución

Por favor, consulta la guía de [Estándares y Calidad](docs/STANDARDS_AND_QUALITY.md) antes de enviar un Pull Request.

**Principios Clave:**

- **Validación:** Ejecutar `npx tsc` para asegurar cero errores de tipo antes de cualquier commit.
- **Accesibilidad:** Cumplir con WCAG 2.1 AA (etiquetas, roles, áreas táctiles).
- **Estilos:** Usar siempre `src/theme/theme.ts` para mantener la consistencia visual.
- **Componentes:** Priorizar `react-native-paper` y componentes reutilizables.

## � Licencia

Este proyecto es propiedad de VTrading. Todos los derechos reservados.
