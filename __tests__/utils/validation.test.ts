import {
  validateEmail,
  validatePassword,
  validatePrice,
  validatePositiveInteger,
  sanitizeInput,
  validateCurrencyCode,
  validatePhoneNumber,
  validateURL,
  validatePercentage,
  validateFutureDate,
  validateSearchQuery,
  validateRegistrationForm,
  validateAlertForm,
} from '../../src/utils/validation';

describe('validation', () => {
  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should invalidate incorrect emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false); // Basic regex might allow this depending on strictness, checking implementation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      expect(validateEmail('user@domain')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should return valid for strong passwords', () => {
      expect(validatePassword('StrongP@ss1').isValid).toBe(true);
    });

    it('should fail if too short', () => {
      const result = validatePassword('Weak1!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('8 caracteres');
    });

    it('should fail if no uppercase', () => {
      const result = validatePassword('weakpass1!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('mayúscula');
    });

    it('should fail if no lowercase', () => {
      const result = validatePassword('WEAKPASS1!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('minúscula');
    });

    it('should fail if no number', () => {
      const result = validatePassword('WeakPass!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('número');
    });
  });

  describe('validatePrice', () => {
    it('should validate positive numbers', () => {
      expect(validatePrice('10.5')).toBe(true);
      expect(validatePrice('100')).toBe(true);
    });

    it('should invalidate non-positive numbers or strings', () => {
      expect(validatePrice('0')).toBe(false);
      expect(validatePrice('-10')).toBe(false);
      expect(validatePrice('abc')).toBe(false);
      expect(validatePrice('Infinity')).toBe(false); // isFinite check
    });
  });

  describe('validatePositiveInteger', () => {
    it('should validate positive integers', () => {
      expect(validatePositiveInteger('10')).toBe(true);
    });

    // NOTE: Current implementation uses parseInt which truncates floats.
    // '10.5' becomes 10, which is an integer. This might be an inconsistency.
    it('should behave as current implementation for floats', () => {
      expect(validatePositiveInteger('10.5')).toBe(true);
    });

    it('should invalidate non-numeric or non-positive', () => {
      expect(validatePositiveInteger('0')).toBe(false);
      expect(validatePositiveInteger('-5')).toBe(false);
      expect(validatePositiveInteger('abc')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags brackets', () => {
      // Current implementation removes < and > but leaves content
      expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
    });

    it('should remove javascript: protocol', () => {
      // eslint-disable-next-line no-script-url
      expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
    });

    it('should remove event handlers', () => {
      expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });
  });

  describe('validateCurrencyCode', () => {
    it('should validate 3 uppercase letters', () => {
      expect(validateCurrencyCode('USD')).toBe(true);
      expect(validateCurrencyCode('VES')).toBe(true);
    });

    it('should invalidate other formats', () => {
      expect(validateCurrencyCode('usd')).toBe(false);
      expect(validateCurrencyCode('US')).toBe(false);
      expect(validateCurrencyCode('USDT')).toBe(false);
      expect(validateCurrencyCode('123')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('+1234567890')).toBe(true);
      expect(validatePhoneNumber('1234567890')).toBe(true);
      expect(validatePhoneNumber('(123) 456-7890')).toBe(true);
    });

    it('should invalidate incorrect phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false); // Too short
      expect(validatePhoneNumber('1234567890123456')).toBe(false); // Too long
      expect(validatePhoneNumber('abcdefghij')).toBe(false);
    });
  });

  describe('validateURL', () => {
    it('should validate correct URLs', () => {
      expect(validateURL('https://google.com')).toBe(true);
      expect(validateURL('http://example.com')).toBe(true);
    });

    it('should invalidate incorrect URLs', () => {
      expect(validateURL('ftp://example.com')).toBe(false);
      expect(validateURL('invalid-url')).toBe(false);
    });
  });

  describe('validatePercentage', () => {
    it('should validate 0-100', () => {
      expect(validatePercentage('0')).toBe(true);
      expect(validatePercentage('50.5')).toBe(true);
      expect(validatePercentage('100')).toBe(true);
    });

    it('should invalidate out of range', () => {
      expect(validatePercentage('-1')).toBe(false);
      expect(validatePercentage('101')).toBe(false);
      expect(validatePercentage('abc')).toBe(false);
    });
  });

  describe('validateFutureDate', () => {
    it('should return true for future date', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(validateFutureDate(future)).toBe(true);
    });

    it('should return false for past date', () => {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);
      expect(validateFutureDate(past)).toBe(false);
    });
  });

  describe('validateSearchQuery', () => {
    it('should return valid for normal query', () => {
      const result = validateSearchQuery('bitcoin');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('bitcoin');
    });

    it('should truncate long query', () => {
      const longQuery = 'a'.repeat(150);
      const result = validateSearchQuery(longQuery);
      expect(result.isValid).toBe(false);
      expect(result.sanitized.length).toBe(100);
    });

    it('should detect SQL injection keywords', () => {
      const result = validateSearchQuery('DROP TABLE users');
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBe('');
    });
  });

  describe('validateRegistrationForm', () => {
    it('should return valid for correct data', () => {
      const data = {
        email: 'test@example.com',
        password: 'StrongP@ss1',
        confirmPassword: 'StrongP@ss1',
        displayName: 'User',
      };
      const result = validateRegistrationForm(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid email', () => {
      const data = {
        email: 'invalid',
        password: 'StrongP@ss1',
        confirmPassword: 'StrongP@ss1',
      };
      const result = validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email inválido');
    });

    it('should detect weak password', () => {
      const data = {
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak',
      };
      const result = validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
    });

    it('should detect password mismatch', () => {
      const data = {
        email: 'test@example.com',
        password: 'StrongP@ss1',
        confirmPassword: 'StrongP@ss2',
      };
      const result = validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Las contraseñas no coinciden');
    });

    it('should validate display name length', () => {
      const data = {
        email: 'test@example.com',
        password: 'StrongP@ss1',
        confirmPassword: 'StrongP@ss1',
        displayName: 'a',
      };
      const result = validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El nombre debe tener al menos 2 caracteres');
    });

    it('should validate display name max length', () => {
      const data = {
        email: 'test@example.com',
        password: 'StrongP@ss1',
        confirmPassword: 'StrongP@ss1',
        displayName: 'a'.repeat(51),
      };
      const result = validateRegistrationForm(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El nombre no puede exceder 50 caracteres');
    });
  });

  describe('validateAlertForm', () => {
    it('should return valid for correct data', () => {
      const result = validateAlertForm({
        targetPrice: '100',
        condition: 'above',
      });
      expect(result.isValid).toBe(true);
    });

    it('should detect invalid price', () => {
      const result = validateAlertForm({
        targetPrice: 'abc',
        condition: 'above',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El precio objetivo debe ser un número positivo válido');
    });

    it('should detect invalid condition', () => {
      const result = validateAlertForm({
        targetPrice: '100',
        condition: 'invalid' as any,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Condición de alerta inválida');
    });
  });
});
