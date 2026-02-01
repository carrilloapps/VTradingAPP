describe('KeyService', () => {
  const loadKeyService = (options: {
    isProd: boolean;
    keychain: { getGenericPassword: jest.Mock; setGenericPassword: jest.Mock };
    logger: { log: jest.Mock; error: jest.Mock };
  }) => {
    let KeyService: { getEncryptionKey: () => Promise<string | undefined> } | null = null;

    jest.resetModules();
    jest.isolateModules(() => {
      jest.doMock('../../src/constants/AppConfig', () => ({
        AppConfig: { IS_PROD: options.isProd },
      }));

      jest.doMock('react-native-keychain', () => options.keychain);

      jest.doMock('../../src/utils/safeLogger', () => ({
        __esModule: true,
        default: options.logger,
      }));

      KeyService = require('../../src/services/KeyService').KeyService;
    });

    if (!KeyService) {
      throw new Error('KeyService not loaded');
    }

    return KeyService;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns undefined in non-production environments', async () => {
    const keychain = { getGenericPassword: jest.fn(), setGenericPassword: jest.fn() };
    const logger = { log: jest.fn(), error: jest.fn() };

    const KeyService = loadKeyService({ isProd: false, keychain, logger });

    await expect(KeyService.getEncryptionKey()).resolves.toBeUndefined();
    expect(logger.log).toHaveBeenCalledWith(
      '[KeyService] Running in DEV/Test, encryption disabled.',
    );
    expect(keychain.getGenericPassword).not.toHaveBeenCalled();
  });

  it('returns stored key when available', async () => {
    const keychain = {
      getGenericPassword: jest.fn().mockResolvedValue({ password: 'stored-key' }),
      setGenericPassword: jest.fn(),
    };
    const logger = { log: jest.fn(), error: jest.fn() };

    const KeyService = loadKeyService({ isProd: true, keychain, logger });

    await expect(KeyService.getEncryptionKey()).resolves.toBe('stored-key');
    expect(keychain.setGenericPassword).not.toHaveBeenCalled();
  });

  it('generates and stores a key when none exists', async () => {
    const keychain = {
      getGenericPassword: jest.fn().mockResolvedValue(false),
      setGenericPassword: jest.fn().mockResolvedValue(true),
    };
    const logger = { log: jest.fn(), error: jest.fn() };

    const KeyService = loadKeyService({ isProd: true, keychain, logger });

    const key = await KeyService.getEncryptionKey();

    expect(typeof key).toBe('string');
    expect(key?.length).toBe(16);
    expect(keychain.setGenericPassword).toHaveBeenCalledWith(
      'mmkv-key',
      key,
      expect.objectContaining({ service: 'app.vtrading.mmkv.key' }),
    );
  });

  it('returns undefined when keychain throws an error', async () => {
    const keychain = {
      getGenericPassword: jest.fn().mockRejectedValue(new Error('boom')),
      setGenericPassword: jest.fn(),
    };
    const logger = { log: jest.fn(), error: jest.fn() };

    const KeyService = loadKeyService({ isProd: true, keychain, logger });

    await expect(KeyService.getEncryptionKey()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      '[KeyService] Failed to get encryption key',
      expect.any(Error),
    );
  });
});
