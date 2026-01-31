import { AppConfig } from '../constants/AppConfig';
import SafeLogger from '../utils/safeLogger';

export const KeyService = {
  /**
   * Retrieves or generates a secure key for MMKV encryption.
   * Returns null if encryption should be disabled (DEV) or if secure storage is unavailable.
   */
  getEncryptionKey: async (): Promise<string | undefined> => {
    // 1. If not PROD, don't use encryption to make debugging easier (optional)
    // Or strictly test encryption in DEV too. Let's stick to PROD for now as requested.
    if (!AppConfig.IS_PROD) {
        SafeLogger.log('[KeyService] Running in DEV/Test, encryption disabled.');
        return undefined;
    }

    try {
        const Keychain = require('react-native-keychain');
        const SERVICE_ID = 'app.vtrading.mmkv.key';
        
        // Try to retrieve existing key
        const credentials = await Keychain.getGenericPassword({ service: SERVICE_ID });
        if (credentials) {
            return credentials.password;
        }

        // Generate new key
        const newKey = generateRandomKey(16); // 16 chars = 128 bit
        await Keychain.setGenericPassword('mmkv-key', newKey, { service: SERVICE_ID });
        return newKey;
    } catch (error) {
      SafeLogger.error('[KeyService] Failed to get encryption key', error as any);
      return undefined;
    }
  }
};

// Helper for future implementation (keep until keychain is active)
const generateRandomKey = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
