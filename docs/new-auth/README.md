# Sistema de Autenticación Opcional con Migración de UUID

## 📋 Índice de Documentación

Esta carpeta contiene la documentación completa para la implementación del nuevo sistema de autenticación opcional con migración de UUID anónimo.

### Documentos Principales

1. **[Arquitectura del Sistema](./01-architecture.md)** - Diseño general y componentes
2. **[Servicio de UUID Anónimo](./02-uuid-service.md)** - AnonymousIdentityService
3. **[Flujo de Migración](./03-migration-flow.md)** - Proceso de vinculación UUID → Firebase
4. **[Guía de Implementación](./04-implementation-guide.md)** - Pasos detallados de implementación
5. **[Integración Analytics](./05-analytics-integration.md)** - Configuración de servicios
6. **[Estrategia de Testing](./06-testing-strategy.md)** - Tests y validación
7. **[Troubleshooting](./07-troubleshooting.md)** - Solución de problemas comunes

---

## 🎯 Objetivo del Proyecto

Modificar el flujo de autenticación actual para permitir que los usuarios **entren directamente a la aplicación** después del onboarding, sin forzar el login/registro inicial, pero manteniendo la capacidad de autenticarse posteriormente.

### Estado Actual

```
App Start → Onboarding → [AUTH SCREEN OBLIGATORIO] → Main App
                              ↓
                   Login / Register / Guest (Anónimo)
```

### Estado Objetivo

```
App Start → Onboarding → Main App (UUID anónimo)
                              ↓
                    Usuario usa la app libremente
                              ↓
                  [Login Opcional desde Settings]
                              ↓
                    UUID se vincula con Firebase UID
```

---

## 🔑 Conceptos Clave

### UUID Anónimo

- **Qué es:** Identificador único generado localmente al instalar la app
- **Formato:** `anon_<timestamp>_<random>_<deviceId>`
- **Ejemplo:** `anon_1738692841_x7k2m9_d4f8b`
- **Persistencia:** Se guarda en MMKV y se mantiene hasta reinstalación
- **Propósito:** Trackear analytics antes de que el usuario se registre

### Firebase UID

- **Qué es:** Identificador único generado por Firebase Auth al crear usuario
- **Formato:** String alfanumérico de 28 caracteres
- **Ejemplo:** `firebase_ABC123XYZ789def456GHI`
- **Persistencia:** Permanente en Firebase, sincronizado multi-dispositivo
- **Propósito:** Identificador oficial del usuario autenticado

### Migración UUID → Firebase UID

- **Qué es:** Proceso de vincular el UUID anónimo con el Firebase UID
- **Cuándo ocurre:** Automáticamente al registrarse o hacer login
- **Resultado:** El historial de analytics se vincula mediante User Properties
- **Beneficio:** Trazabilidad completa del journey del usuario

---

## 📊 Componentes Afectados

### Archivos Nuevos (a crear)

- `src/services/AnonymousIdentityService.ts` (~120 líneas)
- `docs/new-auth/*.md` (documentación completa)

### Archivos a Modificar

- `src/navigation/AppNavigator.tsx` (eliminar validación auth inicial)
- `src/screens/OnboardingScreen.tsx` (ir directo a Main)
- `src/stores/authStore.ts` (agregar lógica de migración)
- `src/services/StorageService.ts` (agregar key de UUID)
- `App.tsx` (inicializar UUID en startup)

### Archivos NO Afectados (se mantienen)

- `src/services/firebase/AuthService.ts` ✅ Se mantiene
- `src/screens/auth/LoginScreen.tsx` ✅ Se mantiene
- `src/screens/auth/RegisterScreen.tsx` ✅ Se mantiene
- Toda la lógica de autenticación existente ✅ Se mantiene

---

## 🚀 Beneficios

### Para el Usuario

- ✅ **Cero fricción:** Entra directo a la app sin necesidad de registro
- ✅ **Explora libremente:** Usa todas las funciones sin autenticarse
- ✅ **Decide cuándo registrarse:** Login opcional cuando lo desee
- ✅ **Mantiene progreso:** Al registrarse, mantiene su historial

### Para el Negocio

- ✅ **Mejor conversión:** Usuarios prueban antes de decidir registrarse
- ✅ **Analytics completo:** Trackea journey completo (anónimo → registrado)
- ✅ **Tasa de retención:** Más usuarios completan onboarding
- ✅ **Insights de conversión:** Sabes qué hace que un usuario se registre

### Para Desarrollo

- ✅ **Código limpio:** Mantiene toda la infraestructura de auth
- ✅ **Escalable:** Fácil agregar métodos de auth adicionales
- ✅ **Debuggeable:** Trazabilidad completa de usuarios
- ✅ **Testeable:** Tests unitarios y E2E claros

---

## 📈 Métricas y Analytics

### Métricas Nuevas Disponibles

1. **Conversión Anónimo → Registrado**

   - Porcentaje de UUID que se convierten en usuarios
   - Tiempo promedio hasta conversión
   - Features usados antes de registrarse

2. **Engagement Pre-Registro**

   - Sesiones promedio antes de registrarse
   - Pantallas más visitadas por usuarios anónimos
   - Features que impulsan el registro

3. **Journey Completo**
   - Tiempo desde instalación hasta primer login
   - Comportamiento pre y post autenticación
   - Retención por cohorte de conversión

---

## ⚙️ Requisitos Técnicos

### Dependencias Necesarias

- ✅ `react-native-mmkv` - Ya instalada (para MMKV storage)
- ✅ `react-native-device-info` - Ya instalada (para device ID)
- ✅ `@react-native-firebase/analytics` - Ya instalada
- ✅ `@react-native-firebase/crashlytics` - Ya instalada
- ✅ `@react-native-firebase/auth` - Ya instalada (se mantiene)

### Versiones Mínimas

- React Native: >= 0.70
- Firebase Android: >= 32.0.0
- Firebase iOS: >= 10.0.0

---

## 🔒 Consideraciones de Privacidad

### Cumplimiento GDPR/CCPA

- ✅ UUID no contiene información personal identificable (PII)
- ✅ Usuario no está obligado a proporcionar datos personales
- ✅ Opt-in explícito para crear cuenta
- ✅ Datos anónimos no se comparten con terceros
- ✅ Usuario puede usar la app indefinidamente sin registrarse

### Datos Almacenados Localmente

- UUID anónimo (MMKV)
- Preferencias de usuario (MMKV)
- Alertas creadas (MMKV)
- Mapeo UUID → Firebase UID (solo si se registra)

### Datos Enviados a Firebase

- UUID como userId (antes del registro)
- Eventos de analytics (screen_view, etc.)
- Crashes y errores (si ocurren)
- Firebase UID (solo después del registro)

---

## 📖 Cómo Usar Esta Documentación

### Para Implementar

1. Lee [Arquitectura del Sistema](./01-architecture.md) para entender el diseño
2. Sigue la [Guía de Implementación](./04-implementation-guide.md) paso a paso
3. Implementa el [Servicio de UUID](./02-uuid-service.md)
4. Configura la [Integración Analytics](./05-analytics-integration.md)
5. Ejecuta los tests de la [Estrategia de Testing](./06-testing-strategy.md)

### Para Entender el Flujo

1. Lee el [Flujo de Migración](./03-migration-flow.md) con ejemplos visuales
2. Revisa los diagramas de secuencia
3. Consulta los casos de uso específicos

### Para Resolver Problemas

1. Consulta [Troubleshooting](./07-troubleshooting.md)
2. Revisa los logs específicos por servicio
3. Verifica la configuración de Firebase Console

---

## 🎓 Glosario

| Término              | Definición                                                                |
| -------------------- | ------------------------------------------------------------------------- |
| **UUID Anónimo**     | Identificador único generado localmente para usuarios sin autenticar      |
| **Firebase UID**     | Identificador único generado por Firebase Auth para usuarios autenticados |
| **Migración**        | Proceso de vincular UUID anónimo con Firebase UID                         |
| **User Property**    | Metadata asociada a un usuario en Firebase Analytics                      |
| **Conversion Event** | Evento que marca cuando un usuario anónimo se convierte en registrado     |
| **MMKV**             | Sistema de storage key-value rápido usado para persistencia local         |

---

## 📞 Contacto y Soporte

**Tech Lead:** José Carrillo (jose.carrillo@yummysuperapp.com)  
**Equipo:** Financial Backoffice - Yummy Inc.  
**Fecha Creación:** 4 de Febrero, 2026  
**Última Actualización:** 4 de Febrero, 2026

---

## 🔄 Estado del Proyecto

| Fase                  | Estado        | Fecha      |
| --------------------- | ------------- | ---------- |
| **Documentación**     | ✅ Completada | 04/02/2026 |
| **Implementación**    | ⏳ Pendiente  | -          |
| **Testing**           | ⏳ Pendiente  | -          |
| **QA**                | ⏳ Pendiente  | -          |
| **Deploy Staging**    | ⏳ Pendiente  | -          |
| **Deploy Production** | ⏳ Pendiente  | -          |

---

## 📚 Referencias Adicionales

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Analytics User Properties](https://firebase.google.com/docs/analytics/user-properties)
- [MMKV Documentation](https://github.com/mrousavy/react-native-mmkv)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking)

---

_Esta documentación es un documento vivo y se actualizará conforme avance la implementación._
