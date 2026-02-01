import { observabilityService } from '../../src/services/ObservabilityService';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  startInactiveSpan: jest.fn(),
}));

jest.mock('@react-native-firebase/crashlytics', () => ({
  getCrashlytics: jest.fn(),
}));

jest.mock('@/utils/safeLogger', () => ({
  __esModule: true,
  default: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    sanitize: jest.fn((value: unknown) => value),
  },
}));

const Sentry = jest.requireMock('@sentry/react-native') as {
  captureException: jest.Mock;
  captureMessage: jest.Mock;
  startInactiveSpan: jest.Mock;
  startTransaction?: jest.Mock;
};

const crashlyticsModule = jest.requireMock('@react-native-firebase/crashlytics') as {
  getCrashlytics: jest.Mock;
};

const SafeLogger = jest.requireMock('@/utils/safeLogger').default as {
  log: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  sanitize: jest.Mock;
};

const loadServiceWithSentry = (sentryOverrides: Record<string, unknown>) => {
  jest.resetModules();
  jest.doMock('@sentry/react-native', () => ({
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    ...sentryOverrides,
  }));
  jest.doMock('@react-native-firebase/crashlytics', () => ({
    getCrashlytics: jest.fn(() => ({
      recordError: jest.fn(),
      setAttribute: jest.fn(),
      log: jest.fn(),
    })),
  }));
  jest.doMock('@/utils/safeLogger', () => ({
    __esModule: true,
    default: SafeLogger,
  }));

  return require('../../src/services/ObservabilityService')
    .observabilityService as typeof observabilityService;
};

describe('ObservabilityService', () => {
  const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;

  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    crashlyticsModule.getCrashlytics.mockReturnValue({
      recordError: jest.fn(),
      setAttribute: jest.fn(),
      log: jest.fn(),
    });
  });

  afterAll(() => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
  });

  it('logs errors in dev and skips reporting', () => {
    observabilityService.captureError(new Error('boom'), { feature: 'test' });

    expect(SafeLogger.error).toHaveBeenCalledWith(
      '[Observability] Error caught:',
      expect.any(Error),
    );
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('ignores known non-critical errors in prod', () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;

    observabilityService.captureError(new Error('Network request failed'));

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('reports errors to Sentry and Crashlytics in prod', () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    const crashlytics = crashlyticsModule.getCrashlytics();

    observabilityService.captureError(new Error('boom'), { feature: 'test' });

    expect(Sentry.captureException).toHaveBeenCalled();
    expect(crashlytics.recordError).toHaveBeenCalledWith(expect.any(Error));
    expect(crashlytics.setAttribute).toHaveBeenCalledWith('feature', 'test');
  });

  it('handles reporting failures gracefully', () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    Sentry.captureException.mockImplementation(() => {
      throw new Error('sentry down');
    });

    observabilityService.captureError(new Error('boom'), { feature: 'test' });

    expect(SafeLogger.error).toHaveBeenCalledWith(
      '[Observability] Failed to report error:',
      expect.objectContaining({
        originalError: 'boom',
        context: { feature: 'test' },
      }),
    );
  });

  it('logs messages and reports them', () => {
    const crashlytics = crashlyticsModule.getCrashlytics();

    observabilityService.log('hello');

    expect(SafeLogger.log).toHaveBeenCalledWith('[Observability] Log:', 'hello');
    expect(Sentry.captureMessage).toHaveBeenCalledWith('hello');
    expect(crashlytics.log).toHaveBeenCalledWith('hello');
  });

  it('handles log failures', () => {
    Sentry.captureMessage.mockImplementation(() => {
      throw new Error('sentry down');
    });

    observabilityService.log('hello');

    expect(SafeLogger.error).toHaveBeenCalledWith(
      '[Observability] Failed to log message:',
      expect.objectContaining({ message: 'hello' }),
    );
  });

  it('starts and finishes transactions with fallbacks', () => {
    const span = { end: jest.fn(), setStatus: jest.fn() };
    Sentry.startInactiveSpan.mockReturnValue(span);

    const transaction = observabilityService.startTransaction('name', 'op');

    expect(transaction).toBe(span);

    observabilityService.finishTransaction(transaction, 'ok');
    expect(span.setStatus).toHaveBeenCalledWith('ok');
    expect(span.end).toHaveBeenCalled();
  });

  it('logs when startTransaction fails', () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    Sentry.startInactiveSpan.mockImplementation(() => {
      throw new Error('boom');
    });

    const transaction = observabilityService.startTransaction('name', 'op');

    expect(transaction).toBeNull();
    expect(SafeLogger.warn).toHaveBeenCalledWith(
      '[Observability] Failed to start transaction:',
      expect.objectContaining({ name: 'name', op: 'op' }),
    );
  });

  it('falls back to legacy startTransaction', () => {
    const service = loadServiceWithSentry({
      startInactiveSpan: undefined,
      startTransaction: jest.fn().mockReturnValue('legacy'),
    });

    const transaction = service.startTransaction('name', 'op');

    expect(transaction).toBe('legacy');
  });

  it('handles missing transaction starters', () => {
    const service = loadServiceWithSentry({
      startInactiveSpan: undefined,
      startTransaction: undefined,
    });

    const transaction = service.startTransaction('name', 'op');

    expect(transaction).toBeNull();
  });

  it('finishes transactions with legacy finish and logs failures', () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    const legacy = {
      finish: jest.fn(() => {
        throw new Error('finish failed');
      }),
    };

    observabilityService.finishTransaction(legacy, 'ok');

    expect(SafeLogger.warn).toHaveBeenCalledWith(
      '[Observability] Failed to finish transaction:',
      expect.objectContaining({ status: 'ok' }),
    );
  });

  it('sets transaction attributes with fallback methods', () => {
    const span = { setAttribute: jest.fn() };
    observabilityService.setTransactionAttribute(span, 'key', 'value');
    expect(span.setAttribute).toHaveBeenCalledWith('key', 'value');

    const tagSpan = { setTag: jest.fn() };
    observabilityService.setTransactionAttribute(tagSpan, 'key', 'value');
    expect(tagSpan.setTag).toHaveBeenCalledWith('key', 'value');

    const dataSpan = { setData: jest.fn() };
    observabilityService.setTransactionAttribute(dataSpan, 'key', 'value');
    expect(dataSpan.setData).toHaveBeenCalledWith('key', 'value');
  });

  it('handles failures when setting transaction attributes', () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    const span = {
      setAttribute: jest.fn(() => {
        throw new Error('fail');
      }),
    };

    observabilityService.setTransactionAttribute(span, 'key', 'value');

    expect(SafeLogger.warn).toHaveBeenCalledWith(
      '[Observability] Failed to set transaction attribute:',
      expect.objectContaining({ key: 'key', value: 'value' }),
    );
  });
});
