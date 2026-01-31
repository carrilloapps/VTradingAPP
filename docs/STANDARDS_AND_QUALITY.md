# Estándares de Código y Calidad

Este documento define las directrices técnicas, de accesibilidad y de diseño que rigen el desarrollo de VTradingAPP.

## 1. Arquitectura y Código
VTradingAPP sigue una arquitectura modular en `src/`:
- **Hooks Personalizados**: La lógica de negocio pesada (ej: `HomeScreen`) debe extraerse a hooks para evitar componentes "clase Dios".
- **Virtualización**: Se prefiere el uso de `@shopify/flash-list` para el renderizado de listas extensas de tasas.
- **Seguridad**: Evitar el registro (logging) de Información Personal Identificable (PII) en Sentry o consola.

---

## 2. Accesibilidad (WCAG 2.1 AA)
Es obligatorio que todos los elementos interactivos sigan estos patrones:
- **Etiquetado**: Todos los botones de iconos DEBEN tener `accessibilityLabel`.
- **Roles**: Los elementos interactivos deben tener `accessibilityRole="button"`.
- **Áreas Táctiles**: Mantener un área mínima de 44x44 dp (usar `hitSlop` si es necesario).

### Ejemplo de Header Accesible
```tsx
<IconButton
  icon="arrow-left"
  accessibilityLabel="Regresar"
  onPress={handleBack}
/>
```

---

## 3. Diseño y UI (Material 3)
Se utiliza `react-native-paper` como sistema de diseño base.
- **Theming**: Todos los componentes deben usar `useTheme()` para garantizar soporte nativo de modo Claro y Oscuro.
- **Skeleton UI**: Usar componentes de carga (Skeletons) para transiciones de red suaves.

---

## 4. Hoja de Ruta de Mejora
1. **Refactorización de Home**: Fragmentar en sub-componentes (RatesSection, StocksSection).
2. **Auditoría de Logs**: Sanitizar errores antes de enviarlos a servicios de monitoreo.
3. **Consistencia de Diálogos**: Usar `CustomDialog` para todos los modales de confirmación.
