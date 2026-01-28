# Informe de Auditoría de Accesibilidad WCAG 2.1 - VTradingAPP

**Fecha:** 28 de Enero de 2026
**Proyecto:** VTradingAPP (React Native)
**Estándar:** WCAG 2.1 Nivel AA

## Resumen Ejecutivo
Este informe detalla los hallazgos tras un análisis del código fuente de VTradingAPP, centrado en la accesibilidad para usuarios con discapacidades visuales, motoras y cognitivas. Si bien la aplicación utiliza muchos componentes estándar que facilitan la accesibilidad, se han identificado áreas críticas de mejora, especialmente en el etiquetado de elementos interactivos (botones de iconos) y la gestión de roles semánticos.

## Hallazgos Principales

### 1. Elementos Interactivos sin Etiqueta (Criterio 1.1.1 y 4.1.2)
**Severidad: ALTA**
Varios botones que solo contienen iconos no tienen una etiqueta de accesibilidad (`accessibilityLabel`). Los lectores de pantalla (TalkBack/VoiceOver) anunciarán estos elementos simplemente como "botón" o "sin etiqueta", impidiendo que los usuarios sepan su función.

*   **Archivo:** `src/components/ui/UnifiedHeader.tsx`
    *   **Botón "Atrás":** Línea 225. `<TouchableRipple onPress={onBackPress} ...>`. Falta `accessibilityLabel="Regresar"`.
    *   **Botón de Acción (Menú/Refrescar):** Línea 242. Falta `accessibilityLabel`. Debería ser dinámico según la acción (ej. "Menú de opciones" o "Refrescar datos").
    *   **Botón de Acción Secundaria:** Línea 265. Falta `accessibilityLabel`.
    *   **Avatar:** Línea 142. La imagen del avatar no tiene texto alternativo. Debería tener `accessibilityLabel={`Perfil de ${userName}`}`.

### 2. Roles Semánticos Faltantes (Criterio 4.1.2)
**Severidad: MEDIA**
Algunos elementos que funcionan como botones están implementados con `TouchableOpacity` pero no declaran explícitamente su rol. Esto evita que el usuario sepa que puede interactuar con ellos de la misma manera que con un botón nativo.

*   **Archivo:** `src/components/ui/UnifiedHeader.tsx` (Sección Perfil, Línea 180) y `src/screens/ExchangeRatesScreen.tsx` (Botón "Ver Mesas de Cambio", Línea 271).
    *   **Problema:** Se usan como botones pero no tienen `accessibilityRole="button"`.
    *   **Solución:** Agregar `accessibilityRole="button"` a estos contenedores interactivos.

### 3. Contraste y Dependencia del Color (Criterio 1.4.1)
**Severidad: BAJA (PASA con observación)**
La aplicación maneja bien la información de tendencias (subida/bajada) usando tanto color (rojo/verde) como iconos (flechas), lo cual cumple con el criterio de no depender únicamente del color.
*   **Observación:** Asegurar que los colores usados para texto (`theme.colors.onSurfaceVariant`) sobre los fondos tengan un ratio de contraste de al menos 4.5:1. Los colores actuales de React Native Paper suelen cumplirlo por defecto, pero es vital verificarlo en modo oscuro.

### 4. Áreas Táctiles Pequeñas (Criterio 2.5.5)
**Severidad: MEDIA**
Algunos elementos interactivos podrían ser difíciles de activar para usuarios con dificultades motoras debido a un tamaño reducido.
*   **Archivo:** `src/screens/ExchangeRatesScreen.tsx`
    *   **Botón "Ver Mesas de Cambio":** El contenedor tiene padding pequeño (4px vertical).
    *   **Solución:** Usar `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` en el `TouchableOpacity` para extender el área táctil sin afectar el diseño visual, o aumentar el padding interno.

## Recomendaciones Técnicas

### 1. Implementar `accessibilityLabel` en Header
Modificar `UnifiedHeader.tsx` para aceptar props de accesibilidad o definirlos por defecto:

```typescript
// Ejemplo de corrección en UnifiedHeader.tsx
<TouchableRipple
  onPress={onBackPress}
  accessibilityLabel="Regresar"
  accessibilityRole="button"
  // ...
>
```

### 2. Estandarizar Botones Personalizados
Revisar `CustomButton.tsx`. Aunque Paper maneja muchas cosas, asegurar que si se usa solo con icono, se pase una etiqueta explícita.

### 3. Auditoría Dinámica
Se recomienda instalar y ejecutar **Accessibility Inspector** (iOS) y **Accessibility Scanner** (Android) en un dispositivo real para detectar problemas de contraste y orden de foco que no son visibles en el código estático.

## Próximos Pasos Sugeridos
1.  Aplicar las correcciones de etiquetado en `UnifiedHeader.tsx` (componente crítico usado en toda la app).
2.  Agregar `accessibilityRole="button"` a las tarjetas interactivas y botones personalizados.
3.  Verificar el contraste de colores en el tema oscuro.
