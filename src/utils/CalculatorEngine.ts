/**
 * CalculatorEngine.ts
 * 
 * Módulo lógico para manejar las operaciones de la calculadora.
 * Separa la lógica de negocio de la interfaz de usuario.
 */

export type Operation = '+' | '-' | '*' | '/' | null;

export interface CalculatorState {
  currentValue: string;
  previousValue: string | null;
  operation: Operation;
  memory: number;
  history: string[];
  isNewEntry: boolean;
  error: string | null;
}

export const INITIAL_STATE: CalculatorState = {
  currentValue: '0',
  previousValue: null,
  operation: null,
  memory: 0,
  history: [],
  isNewEntry: true,
  error: null,
};

export class CalculatorEngine {
  private state: CalculatorState;
  private listeners: ((state: CalculatorState) => void)[] = [];

  constructor(initialState: CalculatorState = INITIAL_STATE) {
    this.state = { ...initialState };
  }

  getState(): CalculatorState {
    return { ...this.state };
  }

  subscribe(listener: (state: CalculatorState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach(l => l(currentState));
  }

  private setError(msg: string) {
    this.state.error = msg;
    this.state.currentValue = 'Error';
    this.notify();
  }

  reset() {
    this.state = { ...INITIAL_STATE, memory: this.state.memory, history: this.state.history };
    this.notify();
  }

  inputDigit(digit: string) {
    if (this.state.error) this.reset();

    const { currentValue, isNewEntry } = this.state;

    if (isNewEntry) {
      this.state.currentValue = digit === '.' ? '0.' : digit;
      this.state.isNewEntry = false;
    } else {
      if (digit === '.') {
        if (currentValue.includes('.')) return; // Prevent double decimals
      }
      // Prevent overflow (simple length check, can be improved)
      if (currentValue.length > 15) return;

      this.state.currentValue = currentValue === '0' && digit !== '.' ? digit : currentValue + digit;
    }
    this.notify();
  }

  setOperation(op: Operation) {
    if (this.state.error) return;

    if (this.state.operation && !this.state.isNewEntry) {
      this.calculate();
    }

    this.state.previousValue = this.state.currentValue;
    this.state.operation = op;
    this.state.isNewEntry = true;
    this.notify();
  }

  calculate() {
    if (this.state.error || !this.state.operation || !this.state.previousValue) return;

    const prev = parseFloat(this.state.previousValue);
    const current = parseFloat(this.state.currentValue);
    let result = 0;

    switch (this.state.operation) {
      case '+':
        result = prev + current;
        break;
      case '-':
        result = prev - current;
        break;
      case '*':
        result = prev * current;
        break;
      case '/':
        if (current === 0) {
          this.setError('División por cero');
          return;
        }
        result = prev / current;
        break;
    }

    // Handle floating point precision issues
    result = parseFloat(result.toPrecision(12));

    // Check for Infinity/NaN
    if (!isFinite(result) || isNaN(result)) {
      this.setError('Error Matemático');
      return;
    }

    // Check for Overflow
    if (Math.abs(result) > Number.MAX_SAFE_INTEGER) {
      this.setError('Número demasiado grande');
      return;
    }

    const resultStr = String(result);
    this.addToHistory(`${prev} ${this.state.operation} ${current} = ${resultStr}`);

    this.state.currentValue = resultStr;
    this.state.previousValue = null;
    this.state.operation = null;
    this.state.isNewEntry = true;
    this.notify();
  }

  // Memory Operations
  memoryAdd() {
    if (this.state.error) return;
    this.state.memory += parseFloat(this.state.currentValue);
    this.state.isNewEntry = true;
    this.notify();
  }

  memorySub() {
    if (this.state.error) return;
    this.state.memory -= parseFloat(this.state.currentValue);
    this.state.isNewEntry = true;
    this.notify();
  }

  memoryRecall() {
    if (this.state.error) return;
    this.state.currentValue = String(this.state.memory);
    this.state.isNewEntry = true;
    this.notify();
  }

  memoryClear() {
    this.state.memory = 0;
    this.notify();
  }

  // History
  private addToHistory(entry: string) {
    this.state.history = [entry, ...this.state.history].slice(0, 10); // Keep last 10
  }

  clearHistory() {
    this.state.history = [];
    this.notify();
  }

  // Utilities
  toggleSign() {
    if (this.state.error) return;
    const val = parseFloat(this.state.currentValue);
    this.state.currentValue = String(val * -1);
    this.notify();
  }

  percentage() {
    if (this.state.error) return;
    const val = parseFloat(this.state.currentValue);
    this.state.currentValue = String(val / 100);
    this.state.isNewEntry = true; // Usually percentage acts as a result
    this.notify();
  }
}
