import Decimal from 'decimal.js';

export type Operation = '+' | '-' | '*' | '/' | null;

export interface HistoryItem {
  expression: string;
  result: string;
  timestamp: number;
}

export interface CalculatorState {
  currentValue: string;
  previousValue: string | null;
  operation: Operation;
  memory: Decimal;
  history: HistoryItem[];
  isNewEntry: boolean;
  error: string | null;
}

export const INITIAL_STATE: CalculatorState = {
  currentValue: '0',
  previousValue: null,
  operation: null,
  memory: new Decimal(0),
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

    try {
      const prev = new Decimal(this.state.previousValue);
      const current = new Decimal(this.state.currentValue);
      let result: Decimal;

      switch (this.state.operation) {
        case '+':
          result = prev.plus(current);
          break;
        case '-':
          result = prev.minus(current);
          break;
        case '*':
          result = prev.times(current);
          break;
        case '/':
          if (current.isZero()) {
            this.setError('División por cero');
            return;
          }
          result = prev.dividedBy(current);
          break;
        default:
          return;
      }

      // Check for finite/overflow handled by Decimal.js but good to catch
      if (!result.isFinite()) {
         this.setError('Error Matemático');
         return;
      }

      const resultStr = result.toString();
      this.addToHistory(`${prev} ${this.state.operation} ${current} = ${resultStr}`, resultStr);

      this.state.currentValue = resultStr;
      this.state.previousValue = null;
      this.state.operation = null;
      this.state.isNewEntry = true;
      this.notify();
    } catch (e) {
      this.setError('Error de Cálculo');
    }
  }

  // Memory Operations
  memoryAdd() {
    if (this.state.error) return;
    try {
        const val = new Decimal(this.state.currentValue);
        this.state.memory = this.state.memory.plus(val);
        this.state.isNewEntry = true;
        this.notify();
    } catch (e) {
        this.setError('Error de Memoria');
    }
  }

  memorySub() {
    if (this.state.error) return;
    try {
        const val = new Decimal(this.state.currentValue);
        this.state.memory = this.state.memory.minus(val);
        this.state.isNewEntry = true;
        this.notify();
    } catch (e) {
        this.setError('Error de Memoria');
    }
  }

  memoryRecall() {
    if (this.state.error) return;
    this.state.currentValue = this.state.memory.toString();
    this.state.isNewEntry = true;
    this.notify();
  }

  memoryClear() {
    this.state.memory = new Decimal(0);
    this.notify();
  }

  // History
  private addToHistory(expression: string, result: string) {
    const item: HistoryItem = {
        expression,
        result,
        timestamp: Date.now()
    };
    this.state.history = [item, ...this.state.history].slice(0, 10); // Keep last 10
  }

  clearHistory() {
    this.state.history = [];
    this.notify();
  }

  // Utilities
  toggleSign() {
    if (this.state.error) return;
    try {
        const val = new Decimal(this.state.currentValue);
        this.state.currentValue = val.negated().toString();
        this.notify();
    } catch (e) {
        // Ignore invalid values
    }
  }

  percentage() {
    if (this.state.error) return;
    try {
        const val = new Decimal(this.state.currentValue);
        this.state.currentValue = val.dividedBy(100).toString();
        this.state.isNewEntry = true;
        this.notify();
    } catch (e) {
        this.setError('Error');
    }
  }
}
