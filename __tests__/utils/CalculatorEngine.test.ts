import { CalculatorEngine } from '@/utils/CalculatorEngine';
import SafeLogger from '@/utils/safeLogger';
import Decimal from 'decimal.js';

// Mock SafeLogger
jest.mock('@/utils/safeLogger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
}));

describe('CalculatorEngine', () => {
  let calculator: CalculatorEngine;
  let updateCallback: jest.Mock;

  beforeEach(() => {
    updateCallback = jest.fn();
    calculator = new CalculatorEngine();
    calculator.subscribe(updateCallback);
    jest.clearAllMocks();
  });

  it('should unsubscribe listener', () => {
        const callback = jest.fn();
        const unsubscribe = calculator.subscribe(callback);
        calculator.inputDigit('1');
        expect(callback).toHaveBeenCalledTimes(1);
        
        unsubscribe();
        calculator.inputDigit('2');
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should initialize with default state', () => {
    expect(calculator.getState().currentValue).toBe('0');
    expect(calculator.getState().previousValue).toBeNull();
    expect(calculator.getState().operation).toBeNull();
  });

  describe('inputDigit', () => {
    it('should append digits', () => {
      calculator.inputDigit('1');
      expect(calculator.getState().currentValue).toBe('1');
      calculator.inputDigit('2');
      expect(calculator.getState().currentValue).toBe('12');
    });

    it('should replace 0 with digit', () => {
      calculator.inputDigit('5');
      expect(calculator.getState().currentValue).toBe('5');
    });

    it('should start new entry after operation', () => {
      calculator.inputDigit('5');
      calculator.setOperation('+');
      calculator.inputDigit('3');
      expect(calculator.getState().currentValue).toBe('3');
      expect(calculator.getState().previousValue).toBe('5');
    });

    it('should reset and process input if error state', () => {
      (calculator as any).state.error = 'Error';
      calculator.inputDigit('5');
      // In current implementation, inputDigit with error calls reset() THEN processes input
      expect(calculator.getState().currentValue).toBe('5'); 
      expect(calculator.getState().error).toBeNull();
    });

    it('should ignore input if max length reached', () => {
      // Current implementation allows 16 chars (length > 15 check)
      (calculator as any).state.currentValue = '1234567890123456';
      (calculator as any).state.isNewEntry = false;
      calculator.inputDigit('7');
      expect(calculator.getState().currentValue).toBe('1234567890123456');
    });
    
    it('should handle dot input', () => {
      calculator.inputDigit('.');
      expect(calculator.getState().currentValue).toBe('0.');
      calculator.inputDigit('5');
      expect(calculator.getState().currentValue).toBe('0.5');
    });

    it('should ignore second dot', () => {
      calculator.inputDigit('.');
      calculator.inputDigit('5');
      calculator.inputDigit('.');
      expect(calculator.getState().currentValue).toBe('0.5');
    });
  });

  describe('reset', () => {
    it('should reset state', () => {
      calculator.inputDigit('5');
      calculator.setOperation('+');
      calculator.reset();
      expect(calculator.getState().currentValue).toBe('0');
      expect(calculator.getState().previousValue).toBeNull();
      expect(calculator.getState().operation).toBeNull();
      expect(calculator.getState().error).toBeNull();
    });
  });

  describe('setOperation', () => {
    it('should set operation', () => {
      calculator.inputDigit('5');
      calculator.setOperation('+');
      expect(calculator.getState().operation).toBe('+');
      expect(calculator.getState().previousValue).toBe('5');
    });

    it('should not set operation if error', () => {
      (calculator as any).state.error = 'Error';
      calculator.setOperation('+');
      expect(calculator.getState().operation).toBeNull();
    });

    it('should calculate pending operation', () => {
      calculator.inputDigit('5');
      calculator.setOperation('+');
      calculator.inputDigit('3');
      calculator.setOperation('-');
      expect(calculator.getState().previousValue).toBe('8');
      expect(calculator.getState().operation).toBe('-');
    });
    
    it('should update operation if no new input', () => {
      calculator.inputDigit('5');
      calculator.setOperation('+');
      calculator.setOperation('-');
      expect(calculator.getState().operation).toBe('-');
    });
  });

  describe('calculate', () => {
    it('should do nothing if parameters missing', () => {
        calculator.calculate();
        expect(calculator.getState().currentValue).toBe('0');
    });

    it('should do nothing if error state', () => {
        (calculator as any).state.error = 'Error';
        calculator.calculate();
        expect(calculator.getState().error).toBe('Error');
    });

    it('should do nothing if previousValue missing', () => {
        (calculator as any).state.operation = '+';
        (calculator as any).state.previousValue = null;
        calculator.calculate();
        expect(calculator.getState().currentValue).toBe('0');
    });

    it('should perform addition', () => {
      calculator.inputDigit('5');
      calculator.setOperation('+');
      calculator.inputDigit('3');
      calculator.calculate();
      expect(calculator.getState().currentValue).toBe('8');
      expect(calculator.getState().operation).toBeNull();
    });

    it('should perform subtraction', () => {
      calculator.inputDigit('10');
      calculator.setOperation('-');
      calculator.inputDigit('4');
      calculator.calculate();
      expect(calculator.getState().currentValue).toBe('6');
    });

    it('should perform multiplication', () => {
      calculator.inputDigit('4');
      calculator.setOperation('*');
      calculator.inputDigit('5');
      calculator.calculate();
      expect(calculator.getState().currentValue).toBe('20');
    });

    it('should perform division', () => {
      calculator.inputDigit('20');
      calculator.setOperation('/');
      calculator.inputDigit('4');
      calculator.calculate();
      expect(calculator.getState().currentValue).toBe('5');
    });

    it('should handle division by zero', () => {
      calculator.inputDigit('5');
      calculator.setOperation('/');
      calculator.inputDigit('0');
      calculator.calculate();
      expect(calculator.getState().error).toBe('División por cero');
    });

    it('should handle invalid operations', () => {
        calculator.inputDigit('5');
        calculator.calculate();
        expect(calculator.getState().currentValue).toBe('5');
    });

    it('should handle infinite result', () => {
      const originalPlus = Decimal.prototype.plus;
      // Mock returning an object that looks like a Decimal but is not finite
      const mockInfinite = {
          isFinite: () => false,
          toString: () => 'Infinity',
          plus: jest.fn(),
          minus: jest.fn(),
          times: jest.fn(),
          dividedBy: jest.fn(),
          negated: jest.fn(),
          isZero: jest.fn()
      };
      
      Decimal.prototype.plus = jest.fn().mockReturnValue(mockInfinite);

      calculator.inputDigit('5');
      calculator.setOperation('+');
      calculator.inputDigit('5');
      calculator.calculate();
      
      expect(calculator.getState().error).toBe('Error Matemático');

      Decimal.prototype.plus = originalPlus;
    });

    it('should handle errors gracefully', () => {
      // Force an error by mocking Decimal
      const originalDecimal = Decimal.prototype.plus;
      Decimal.prototype.plus = jest.fn().mockImplementation(() => {
          throw new Error('Mock Error');
      });
      
      calculator.inputDigit('5');
      calculator.setOperation('+');
      calculator.inputDigit('5');
      calculator.calculate();
      
      expect(SafeLogger.error).toHaveBeenCalled();
      expect(calculator.getState().error).toBe('Error de Cálculo');

      // Restore
      Decimal.prototype.plus = originalDecimal;
    });
  });

  describe('Memory Operations', () => {
      it('should not add to memory if error', () => {
          (calculator as any).state.error = 'Error';
          calculator.memoryAdd();
          expect(calculator.getState().memory.toString()).toBe('0');
      });

      it('should add to memory', () => {
          calculator.inputDigit('5');
          calculator.memoryAdd();
          expect(calculator.getState().memory.toString()).toBe('5');
          expect(calculator.getState().isNewEntry).toBe(true);
      });

      it('should not sub from memory if error', () => {
        (calculator as any).state.error = 'Error';
        calculator.memorySub();
        expect(calculator.getState().memory.toString()).toBe('0');
    });

      it('should subtract from memory', () => {
        calculator.inputDigit('10');
        calculator.memoryAdd();
        calculator.inputDigit('2');
        calculator.memorySub();
        expect(calculator.getState().memory.toString()).toBe('8');
    });

    it('should not recall memory if error', () => {
        (calculator as any).state.error = 'Error';
        (calculator as any).state.memory = new Decimal(5);
        calculator.memoryRecall();
        expect(calculator.getState().currentValue).toBe('0');
    });

    it('should recall memory', () => {
        calculator.inputDigit('5');
        calculator.memoryAdd();
        calculator.reset();
        calculator.memoryRecall();
        expect(calculator.getState().currentValue).toBe('5');
    });

    it('should clear memory', () => {
        calculator.inputDigit('5');
        calculator.memoryAdd();
        calculator.memoryClear();
        expect(calculator.getState().memory.toString()).toBe('0');
    });
    
    it('should handle memory errors', () => {
        const originalPlus = Decimal.prototype.plus;
        Decimal.prototype.plus = jest.fn().mockImplementation(() => {
            throw new Error('Memory Error');
        });

        calculator.inputDigit('5');
        calculator.memoryAdd();
        expect(SafeLogger.error).toHaveBeenCalled();
        expect(calculator.getState().error).toBe('Error de Memoria');
        
        Decimal.prototype.plus = originalPlus;
    });

     it('should handle memory sub errors', () => {
        const originalMinus = Decimal.prototype.minus;
        Decimal.prototype.minus = jest.fn().mockImplementation(() => {
            throw new Error('Memory Error');
        });

        calculator.inputDigit('5');
        calculator.memorySub();
        expect(SafeLogger.error).toHaveBeenCalled();
        expect(calculator.getState().error).toBe('Error de Memoria');
        
        Decimal.prototype.minus = originalMinus;
    });
  });

  describe('History', () => {
      it('should add to history on calculation', () => {
          calculator.inputDigit('5');
          calculator.setOperation('+');
          calculator.inputDigit('5');
          calculator.calculate();
          expect(calculator.getState().history.length).toBe(1);
          expect(calculator.getState().history[0].result).toBe('10');
      });

      it('should clear history', () => {
        calculator.inputDigit('5');
        calculator.setOperation('+');
        calculator.inputDigit('5');
        calculator.calculate();
        calculator.clearHistory();
        expect(calculator.getState().history.length).toBe(0);
      });
  });

  describe('Utilities', () => {
      it('should not toggle sign if error', () => {
          (calculator as any).state.error = 'Error';
          calculator.toggleSign();
          expect(calculator.getState().currentValue).toBe('0');
      });

      it('should toggle sign', () => {
          calculator.inputDigit('5');
          calculator.toggleSign();
          expect(calculator.getState().currentValue).toBe('-5');
          calculator.toggleSign();
          expect(calculator.getState().currentValue).toBe('5');
      });

      it('should not calculate percentage if error', () => {
          (calculator as any).state.error = 'Error';
          calculator.percentage();
          expect(calculator.getState().currentValue).toBe('0');
      });

      it('should calculate percentage', () => {
          calculator.inputDigit('50');
          calculator.percentage();
          expect(calculator.getState().currentValue).toBe('0.5');
      });

      it('should handle percentage errors', () => {
         const originalDiv = Decimal.prototype.dividedBy;
         Decimal.prototype.dividedBy = jest.fn().mockImplementation(() => { throw new Error('Div Error'); });

         calculator.inputDigit('50');
         calculator.percentage();
         expect(SafeLogger.error).toHaveBeenCalled();
         expect(calculator.getState().error).toBe('Error');

         Decimal.prototype.dividedBy = originalDiv;
      });
      
       it('should handle toggle sign errors', () => {
         calculator.inputDigit('50');

         // Force error by mocking notify (which is called inside try block)
         const originalNotify = (calculator as any).notify;
         (calculator as any).notify = jest.fn(() => { throw new Error('Notify Error'); });

         calculator.toggleSign();
         
         expect(SafeLogger.error).toHaveBeenCalled();
         
         // Restore
         (calculator as any).notify = originalNotify;
      });
  });
});
