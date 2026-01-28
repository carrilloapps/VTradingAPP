Análisis Integral del Proyecto VTradingAPP
Este documento proporciona una visión detallada de la arquitectura, tecnologías y patrones de diseño utilizados en VTradingAPP. Ha sido generado tras un análisis exhaustivo del código fuente paso a paso.

1. Visión General y Stack Tecnológico
VTradingAPP es una aplicación financiera robusta desarrollada en React Native (v0.83.1) con React 19, enfocada en el monitoreo de tasas de cambio (fiat, cripto, fronterizas) y herramientas de cálculo financiero.

Tecnologías Clave:
Lenguaje: TypeScript (Tipado fuerte en todo el proyecto).
Motor UI: react-native-paper (Theming y componentes base) + react-native-reanimated.
Navegación: react-navigation v7 (Stack y Material Top Tabs para navegación principal).
Backend/Servicios: Integración profunda con Firebase (Auth, Crashlytics, Performance, Remote Config, App Check).
Monitoreo: Sentry + Firebase Performance + Clarity.
Gestión de Estado: Context API (
AuthContext
, 
ThemeContext
, ToastContext).
Persistencia: AsyncStorage (vía @react-native-async-storage/async-storage) y MMKV (mencionado en docs).
2. Arquitectura del Proyecto
El proyecto sigue una estructura modular y organizada por responsabilidades en src/:

A. Capa de Servicios (src/services)
Es el núcleo de la lógica de negocio y comunicación de datos.

ApiClient.ts: Cliente HTTP personalizado que envuelve fetch. Maneja automáticamente:
Coché Local: Persistencia de respuestas GET en AsyncStorage para funcionamiento offline.
Seguridad: Inyección de tokens de Firebase App Check y API Keys.
Observabilidad: Instrumentación automática con trazas de Sentry y métricas HTTP de Firebase Performance.
CurrencyService.ts: Servicio crítico para tasas de cambio.
Unifica fuentes de datos: BCV (Fiat), Fronterizo y Cripto (P2P).
Lógica de "Inversión Fronteriza": Calcula tasas inversas (VES/COP vs COP/VES) para consistencia.
Reglas de Conversión: Define qué monedas pueden convertirse entre sí (ej. getAvailableTargetRates).
RemoteConfigService.ts: Abstracción sobre Firebase Remote Config para Feature Flags y configuraciones dinámicas (ej. forceUpdate).
B. Capa de Navegación (src/navigation)
AppNavigator.tsx: Gestor de rutas principal.
Controla el flujo de autenticación (AuthStack vs MainTabNavigator).
Maneja Deep Linking (ArticleDetail).
Integra OnboardingScreen como primera vista condicionada.
C. Capa de UI y Pantallas (src/screens)
Organización Principal:
Home: Dashboard principal (HomeScreen).
Mercados: Acciones y bolsas (StocksScreen).
Tasas: Lista detallada de cambios (ExchangeRatesScreen).
Calculadora: Herramienta avanzada (AdvancedCalculatorScreen).
Detalles: Pantallas específicas como CurrencyDetailScreen y StockDetailScreen.
D. Gestión de Estado Global (src/context)
AuthContext: Gestiona el ciclo de vida del usuario (Login, Registro, Google Auth). Sincroniza el ID de usuario con Crashlytics y Analytics.
ThemeContext: Maneja el tema (Claro/Oscuro/Sistema) y lo persiste. Integra react-native-paper.
3. Flujos de Datos Críticos
Flujo de Tasas de Cambio (Currency Rates)
Solicitud: CurrencyService.getRates() es llamado desde la UI.
Caché en Memoria: Si los datos tienen menos de X tiempo, se retornan inmediatamente.
Llamada API: Se usa ApiClient para pedir api/rates.
Procesamiento:
Normalización de nombres e iconos.
Inyección de tasa base "VES".
Cálculo de promedios para tasas fronterizas.
Notificación: Los componentes suscritos (listeners) reciben la actualización.
Flujo de Autenticación
Inicio: AuthMain verifica estado en Firebase.
Persistencia: Si hay usuario, AppNavigator monta el MainTabNavigator.
Seguridad: Cada petición HTTP subsiguiente incluye el token de App Check validado.
4. Puntos de Atención y Calidad
Tipado: El proyecto hace un excelente uso de TypeScript, definiendo interfaces claras para respuestas de API (ApiRatesResponse, ApiRateItem).
Observabilidad: Cada servicio crítico (getRates, peticiones HTTP) está instrumentado. Si algo falla, se reporta a Sentry y console.
Resiliencia: El ApiClient está diseñado para devolver datos de caché (stale-while-revalidate) si la red falla, crucial para una app financiera en entornos inestables.
5. Recomendaciones Iniciales
Basado en el análisis:

Gestión de Estado: Para una app financiera compleja, considerar migrar de Context puro a una librería como Zustand o TanStack Query podría simplificar la lógica de caché y revalidación que actualmente se hace manual en ApiClient y CurrencyService.
Testing: La estructura __tests__ existe, pero es crucial asegurar cobertura en lógica de negocio compleja como CurrencyService.ts.