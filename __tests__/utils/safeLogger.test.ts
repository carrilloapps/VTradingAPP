import SafeLogger from '../../src/utils/safeLogger';

describe('SafeLogger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  const originalDev = (globalThis as any).__DEV__;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (globalThis as any).__DEV__ = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
    (globalThis as any).__DEV__ = originalDev;
  });

  describe('sanitize', () => {
    it('should return primitives as is', () => {
      // Access private method via any casting or testing public side effects
      // We'll test side effects via log to verify sanitization
      SafeLogger.log('test', 123, 'normal string', null, undefined);
      expect(consoleLogSpy).toHaveBeenCalledWith('test', 123, 'normal string', null, undefined);
    });

    it('should mask sensitive keys in objects', () => {
      const sensitiveObj = {
        password: 'supersecretpassword',
        email: 'test@example.com',
        nested: {
          apiKey: '1234567890abcdef',
        },
        public: 'visible',
      };

      SafeLogger.log('sensitive', sensitiveObj);

      const expectedObj = {
        password: 'supe...word',
        email: 'test....com',
        nested: {
          apiKey: '1234...cdef',
        },
        public: 'visible',
      };

      expect(consoleLogSpy).toHaveBeenCalledWith('sensitive', expectedObj);
    });

    it('should mask short sensitive values with ****', () => {
      const sensitiveObj = {
        password: 'short',
      };
      SafeLogger.log('short', sensitiveObj);
      expect(consoleLogSpy).toHaveBeenCalledWith('short', { password: '****' });
    });

    it('should sanitize arrays', () => {
      const sensitiveArray = [{ password: 'secretpassword' }, 'normal'];
      SafeLogger.log('array', sensitiveArray);
      expect(consoleLogSpy).toHaveBeenCalledWith('array', [{ password: 'secr...word' }, 'normal']);
    });
  });

  describe('logging methods', () => {
    it('should log info', () => {
      SafeLogger.info('info message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('info message');
    });

    it('should log warn', () => {
      SafeLogger.warn('warn message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('warn message');
    });

    it('should log error', () => {
      SafeLogger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('error message');
    });

    it('should log args', () => {
      SafeLogger.log('log message', { data: 1 });
      expect(consoleLogSpy).toHaveBeenCalledWith('log message', { data: 1 });
    });
  });

  describe('environment behavior', () => {
    it('should not log "log" level in production', () => {
      (globalThis as any).__DEV__ = false;
      SafeLogger.log('should not appear');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log "info", "warn", "error" in production', () => {
      (globalThis as any).__DEV__ = false;
      SafeLogger.info('info prod');
      SafeLogger.warn('warn prod');
      SafeLogger.error('error prod');
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('sensitive', () => {
    it('should mask string in DEV', () => {
      SafeLogger.sensitive('Context', 'supersecretstring');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Context] (SENSITIVE - DEV ONLY):',
        'supe...ring',
      );
    });

    it('should mask short string in DEV', () => {
      SafeLogger.sensitive('Context', 'short');
      expect(consoleLogSpy).toHaveBeenCalledWith('[Context] (SENSITIVE - DEV ONLY):', '****');
    });

    it('should mask object in DEV', () => {
      SafeLogger.sensitive('Context', {
        key: 'value',
        password: 'secretpassword',
      });
      expect(consoleLogSpy).toHaveBeenCalledWith('[Context] (SENSITIVE - DEV ONLY):', {
        key: 'value',
        password: 'secr...word',
      });
    });

    it('should hide completely in PROD', () => {
      (globalThis as any).__DEV__ = false;
      SafeLogger.sensitive('Context', 'secret');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Context] Sensitive data received (hidden in production)',
      );
    });
  });

  describe('looksLikeToken', () => {
    it('should identify tokens', () => {
      expect(SafeLogger.looksLikeToken('Bearer abcdef123456')).toBe(true);
      expect(SafeLogger.looksLikeToken('abcdef1234567890abcdef1234567890')).toBe(true); // 32 chars
      expect(SafeLogger.looksLikeToken('ya29.abcdefg')).toBe(true);
      expect(SafeLogger.looksLikeToken('short')).toBe(false);
    });
  });

  describe('safeLog', () => {
    it('should mask token-like strings', () => {
      const token = 'Bearer abcdef123456';
      SafeLogger.safeLog('Token:', token);
      expect(consoleLogSpy).toHaveBeenCalledWith('Token:', 'Bear...3456');
    });

    it('should sanitize objects', () => {
      SafeLogger.safeLog({ password: 'secretpassword' });
      expect(consoleLogSpy).toHaveBeenCalledWith({ password: 'secr...word' });
    });

    it('should do nothing in PROD', () => {
      (globalThis as any).__DEV__ = false;
      SafeLogger.safeLog('test');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
