import { CalculatorEngine, INITIAL_STATE } from '../../src/utils/CalculatorEngine';
import SafeLogger from '../../src/utils/safeLogger';
import Decimal from 'decimal.js';

// Mock SafeLogger
jest.mock('../../src/utils/safeLogger', () => ({
  error: jest.fn(),
}));

describe('CalculatorEngine', () => {
  let engine: CalculatorEngine;
  let listener: jest.Mock;
  let unsubscribe: () => void;

  beforeEach(() => {
    engine = new CalculatorEngine();
    listener = jest.fn();
    unsubscribe = engine.subscribe(listener);
    jest.clearAllMocks();
  });

  afterEach(() => {
    unsubscribe();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      expect(engine.getState()).toEqual(INITIAL_STATE);
    });

    it('should allow custom initial state', () => {
      const customState = { ...INITIAL_STATE, currentValue: '10' };
      const customEngine = new CalculatorEngine(customState);
      expect(customEngine.getState().currentValue).toBe('10');
    });
  });

  describe('Subscription', () => {
    it('should notify subscribers on change', () => {
      engine.inputDigit('5');
      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ currentValue: '5' }));
    });

    it('should stop notifying after unsubscribe', () => {
      unsubscribe();
      engine.inputDigit('5');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Input', () => {
    it('should input digits', () => {
      engine.inputDigit('1');
      expect(engine.getState().currentValue).toBe('1');
      engine.inputDigit('2');
      expect(engine.getState().currentValue).toBe('12');
    });

    it('should handle decimal point', () => {
      engine.inputDigit('1');
      engine.inputDigit('.');
      engine.inputDigit('5');
      expect(engine.getState().currentValue).toBe('1.5');
    });

    it('should prevent multiple decimals', () => {
      engine.inputDigit('1');
      engine.inputDigit('.');
      engine.inputDigit('.');
      expect(engine.getState().currentValue).toBe('1.');
    });

    it('should handle initial decimal', () => {
      engine.inputDigit('.');
      expect(engine.getState().currentValue).toBe('0.');
    });

    it('should reset error on input', () => {
      // Force error state
      (engine as any).setError('Test Error');
      expect(engine.getState().error).toBe('Test Error');

      engine.inputDigit('5');
      expect(engine.getState().error).toBeNull();
      expect(engine.getState().currentValue).toBe('5');
    });

    it('should limit input length', () => {
      for (let i = 0; i < 20; i++) {
        engine.inputDigit('1');
      }
      expect(engine.getState().currentValue.length).toBeLessThanOrEqual(16); // 15 check + 1
    });
  });

  describe('Operations', () => {
    it('should set operation', () => {
      engine.inputDigit('5');
      engine.setOperation('+');
      const state = engine.getState();
      expect(state.operation).toBe('+');
      expect(state.previousValue).toBe('5');
      expect(state.isNewEntry).toBe(true);
    });

    it('should calculate pending operation when setting new one', () => {
      engine.inputDigit('5');
      engine.setOperation('+');
      engine.inputDigit('5');
      engine.setOperation('-');

      const state = engine.getState();
      expect(state.previousValue).toBe('10');
      expect(state.operation).toBe('-');
    });

    it('should not set operation if error exists', () => {
      (engine as any).setError('Error');
      engine.setOperation('+');
      expect(engine.getState().operation).toBeNull();
    });
  });

  describe('Calculation', () => {
    it('should add', () => {
      engine.inputDigit('5');
      engine.setOperation('+');
      engine.inputDigit('3');
      engine.calculate();
      expect(engine.getState().currentValue).toBe('8');
    });

    it('should subtract', () => {
      engine.inputDigit('10');
      engine.setOperation('-');
      engine.inputDigit('4');
      engine.calculate();
      expect(engine.getState().currentValue).toBe('6');
    });

    it('should multiply', () => {
      engine.inputDigit('4');
      engine.setOperation('*');
      engine.inputDigit('3');
      engine.calculate();
      expect(engine.getState().currentValue).toBe('12');
    });

    it('should divide', () => {
      engine.inputDigit('10');
      engine.setOperation('/');
      engine.inputDigit('2');
      engine.calculate();
      expect(engine.getState().currentValue).toBe('5');
    });

    it('should handle division by zero', () => {
      engine.inputDigit('10');
      engine.setOperation('/');
      engine.inputDigit('0');
      engine.calculate();
      expect(engine.getState().error).toBe('División por cero');
    });

    it('should handle floating point precision', () => {
      engine.inputDigit('0.1');
      engine.setOperation('+');
      engine.inputDigit('0.2');
      engine.calculate();
      expect(engine.getState().currentValue).toBe('0.3');
    });

    it('should ignore calculate if no op or previous value', () => {
      engine.inputDigit('5');
      engine.calculate();
      expect(engine.getState().currentValue).toBe('5');
    });

    it('should handle exception during calculation', () => {
      // Mock Decimal to throw error
      jest.spyOn(Decimal.prototype, 'plus').mockImplementation(() => {
        throw new Error('Mock Error');
      });

      engine.inputDigit('5');
      engine.setOperation('+');
      engine.inputDigit('5');
      engine.calculate();

      expect(engine.getState().error).toBe('Error de Cálculo');
      expect(SafeLogger.error).toHaveBeenCalled();

      // Restore
      (Decimal.prototype.plus as any).mockRestore(); // Restore logic depends on jest setup, easier to just assume isolation or manually restore
      // Since we modified prototype, we MUST restore it.
      // Or we can mock the module entirely. But we want real logic for other tests.
      // Actually, jest.spyOn restores with mockRestore().
      // Wait, I assigned originalDecimal but jest.spyOn replaces it.
      // Correct way:
      // const spy = jest.spyOn(...);
      // spy.mockRestore();
    });
    it('should handle infinite result', () => {
      // Mock plus to return Infinity
      jest.spyOn(Decimal.prototype, 'plus').mockImplementation(() => new Decimal(Infinity));

      engine.inputDigit('1');
      engine.setOperation('+');
      engine.inputDigit('1');
      engine.calculate();

      expect(engine.getState().error).toBe('Error Matemático');
      (Decimal.prototype.plus as any).mockRestore();
    });

    it('should handle invalid operation (default case)', () => {
      engine.inputDigit('5');
      engine.setOperation('invalid' as any); // Force invalid op
      // To trigger calculate with invalid op, we need prev value and op
      // But setOperation sets op.
      // If we force state:
      (engine as any).state.operation = 'invalid';
      (engine as any).state.previousValue = '5';
      (engine as any).state.currentValue = '5';

      engine.calculate();

      // Should return early, no change
      expect(engine.getState().currentValue).toBe('5');
    });
  });

  describe('Memory', () => {
    it('should add to memory', () => {
      engine.inputDigit('5');
      engine.memoryAdd();
      expect(engine.getState().memory.toString()).toBe('5');

      engine.inputDigit('3');
      engine.memoryAdd();
      expect(engine.getState().memory.toString()).toBe('8');
    });

    it('should subtract from memory', () => {
      engine.inputDigit('10');
      engine.memoryAdd();

      engine.inputDigit('2');
      engine.memorySub();
      expect(engine.getState().memory.toString()).toBe('8');
    });

    it('should recall memory', () => {
      engine.inputDigit('5');
      engine.memoryAdd();
      engine.inputDigit('0'); // Clear current
      engine.memoryRecall();
      expect(engine.getState().currentValue).toBe('5');
      expect(engine.getState().isNewEntry).toBe(true);
    });

    it('should clear memory', () => {
      engine.inputDigit('5');
      engine.memoryAdd();
      engine.memoryClear();
      expect(engine.getState().memory.toString()).toBe('0');
    });

    it('should handle memory errors', () => {
      jest.spyOn(Decimal.prototype, 'plus').mockImplementation(() => {
        throw new Error('Mem Error');
      });
      engine.inputDigit('5');
      engine.memoryAdd();
      expect(engine.getState().error).toBe('Error de Memoria');
      (Decimal.prototype.plus as any).mockRestore();
    });

    it('should handle memorySub errors', () => {
      jest.spyOn(Decimal.prototype, 'minus').mockImplementation(() => {
        throw new Error('Mem Error');
      });
      engine.inputDigit('5');
      engine.memorySub();
      expect(engine.getState().error).toBe('Error de Memoria');
      (Decimal.prototype.minus as any).mockRestore();
    });
  });

  describe('History', () => {
    it('should add calculations to history', () => {
      engine.inputDigit('1');
      engine.setOperation('+');
      engine.inputDigit('2');
      engine.calculate();

      const history = engine.getState().history;
      expect(history.length).toBe(1);
      expect(history[0].expression).toContain('1 + 2');
      expect(history[0].result).toBe('3');
    });

    it('should clear history', () => {
      engine.inputDigit('1');
      engine.setOperation('+');
      engine.inputDigit('2');
      engine.calculate();

      engine.clearHistory();
      expect(engine.getState().history.length).toBe(0);
    });

    it('should limit history items', () => {
      // Add 15 items
      for (let i = 0; i < 15; i++) {
        engine.inputDigit('1');
        engine.setOperation('+');
        engine.inputDigit('1');
        engine.calculate();
      }
      expect(engine.getState().history.length).toBe(10);
    });
  });

  describe('Utilities', () => {
    it('should toggle sign', () => {
      engine.inputDigit('5');
      engine.toggleSign();
      expect(engine.getState().currentValue).toBe('-5');
      engine.toggleSign();
      expect(engine.getState().currentValue).toBe('5');
    });

    it('should calculate percentage', () => {
      engine.inputDigit('50');
      engine.percentage();
      expect(engine.getState().currentValue).toBe('0.5');
    });

    it('should handle percentage error', () => {
      jest.spyOn(Decimal.prototype, 'dividedBy').mockImplementation(() => {
        throw new Error('Pct Error');
      });
      engine.inputDigit('50');
      engine.percentage();
      expect(engine.getState().error).toBe('Error');
      (Decimal.prototype.dividedBy as any).mockRestore();
    });

    it('should handle toggleSign error', () => {
      // negated()
      jest.spyOn(Decimal.prototype, 'negated').mockImplementation(() => {
        throw new Error('Sign Error');
      });
      engine.inputDigit('5');
      engine.toggleSign();
      expect(SafeLogger.error).toHaveBeenCalled();
      (Decimal.prototype.negated as any).mockRestore();
    });
    it('should ignore operations if error exists', () => {
      (engine as any).setError('Error');

      engine.memoryAdd();
      expect(engine.getState().memory.toString()).toBe('0');

      engine.memorySub();
      expect(engine.getState().memory.toString()).toBe('0');

      engine.memoryRecall();
      expect(engine.getState().currentValue).toBe('Error'); // Unchanged

      engine.toggleSign();
      expect(engine.getState().currentValue).toBe('Error');

      engine.percentage();
      expect(engine.getState().currentValue).toBe('Error');
    });
  });

  describe('Reset', () => {
    it('should reset state but keep memory and history', () => {
      engine.inputDigit('5');
      engine.memoryAdd(); // Memory = 5
      engine.setOperation('+');
      engine.inputDigit('5');
      engine.calculate(); // History has item

      engine.reset();

      const state = engine.getState();
      expect(state.currentValue).toBe('0');
      expect(state.operation).toBeNull();
      expect(state.memory.toString()).toBe('5');
      expect(state.history.length).toBe(1);
    });
  });
});
