# Guía de Uso: Componente Calculadora Rápida

Esta guía describe la arquitectura, uso e integración del componente `Calculator` y su motor lógico `CalculatorEngine`.

## 1. Arquitectura

El sistema de la calculadora sigue el patrón **Separation of Concerns (SoC)**, dividiendo la lógica de negocio de la interfaz de usuario.

### Módulos

- **CalculatorEngine.ts**: Maneja el estado, las operaciones matemáticas, la memoria y el historial. Es agnóstico a la UI (React, Vue, CLI).
- **Calculator.tsx**: Componente visual en React Native que consume `CalculatorEngine`.

## 2. CalculatorEngine (API)

El motor lógico expone los siguientes métodos y propiedades:

### Estado (`CalculatorState`)

```typescript
interface CalculatorState {
  currentValue: string; // Valor mostrado en pantalla
  previousValue: string | null; // Valor anterior (operando izquierdo)
  operation: Operation; // Operación actual (+, -, *, /)
  memory: number; // Valor en memoria
  history: string[]; // Lista de últimas operaciones
  isNewEntry: boolean; // Flag para limpiar pantalla al escribir
  error: string | null; // Mensaje de error si existe
}
```

### Métodos Principales

- `inputDigit(digit: string)`: Ingresa un número o punto decimal.
- `setOperation(op: Operation)`: Establece la operación actual (+, -, \*, /).
- `calculate()`: Ejecuta la operación pendiente.
- `reset()`: Limpia la calculadora (AC).
- `subscribe(listener)`: Permite escuchar cambios de estado.

### Memoria

- `memoryAdd()`: M+
- `memorySub()`: M-
- `memoryRecall()`: MR
- `memoryClear()`: MC

### Utilidades

- `toggleSign()`: Cambia el signo del número actual.
- `percentage()`: Divide el valor actual entre 100.
- `clearHistory()`: Borra el historial de operaciones.

## 3. Integración en React

El componente `Calculator.tsx` se integra fácilmente en cualquier pantalla. Utiliza un patrón de suscripción para actualizarse automáticamente cuando el estado del motor cambia.

```tsx
import Calculator from './components/dashboard/Calculator';

const MyScreen = () => {
  return (
    <View>
      <Calculator />
    </View>
  );
};
```

### Personalización

El componente utiliza el tema de `react-native-paper` (`useTheme`), por lo que se adaptará automáticamente a los colores de la aplicación (Modo Claro/Oscuro).

## 4. Accesibilidad (a11y)

El componente implementa etiquetas ARIA y roles para garantizar la accesibilidad:

- `accessibilityRole="button"` en todos los botones interactivos.
- `accessibilityLabel` descriptivos para lectores de pantalla.
- Contraste de colores verificado mediante el sistema de temas.

## 5. Manejo de Errores

El motor captura errores comunes como:

- **División por cero**: Muestra "Error" y previene operaciones subsiguientes hasta reiniciar.
- **Overflow**: Limita la longitud de entrada para evitar desbordamientos de UI.
- **NaN/Infinity**: Capturados y manejados de forma segura.

## 6. Pruebas (Estrategia)

Para probar este componente, se recomienda:

1. **Unit Testing**: Probar `CalculatorEngine.ts` de forma aislada (Jest).
   - Verificar sumas, restas, multiplicación, división.
   - Verificar precedencia de operaciones.
   - Verificar manejo de memoria.
2. **Component Testing**: Probar `Calculator.tsx` (React Native Testing Library).
   - Verificar que los botones disparen las acciones correctas.
   - Verificar que la pantalla muestre el estado actual.

---

**Desarrollado para VTradingAPP**
