import { anonymousIdentityService } from '@/services/AnonymousIdentityService';
import { storageService } from '@/services/StorageService';
import * as DeviceInfo from 'react-native-device-info';

// Mocks
jest.mock('@/services/StorageService');
jest.mock('react-native-device-info', () => ({
  getDeviceId: jest.fn(),
  getBrand: jest.fn(),
  getModel: jest.fn(),
  getSystemVersion: jest.fn(),
}));
jest.mock('@/utils/SafeLogger');

describe('AnonymousIdentityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DeviceInfo methods
    (DeviceInfo.getDeviceId as jest.Mock).mockReturnValue('test-device-123');
    (DeviceInfo.getBrand as jest.Mock).mockReturnValue('Apple');
    (DeviceInfo.getModel as jest.Mock).mockReturnValue('iPhone 14');
    (DeviceInfo.getSystemVersion as jest.Mock).mockReturnValue('17.0');

    // Reset storage mock
    (storageService.getString as jest.Mock).mockReturnValue(undefined);
  });

  describe('getAnonymousId', () => {
    it('debe generar nuevo UUID si no existe en storage', () => {
      (storageService.getString as jest.Mock).mockReturnValue(null);

      const id = anonymousIdentityService.getAnonymousId();

      // Verificar formato correcto
      expect(id).toMatch(/^anon_\d{13}_[a-z0-9]{6}_[a-z0-9]+$/);

      // Verificar que se guardó en storage
      expect(storageService.setString).toHaveBeenCalledWith(
        'anonymous_user_id',
        expect.stringMatching(/^anon_/),
      );
    });

    it('debe retornar UUID existente si ya está guardado', () => {
      const existingId = 'anon_1738692841123_x7k2m9_test1';
      (storageService.getString as jest.Mock).mockReturnValueOnce(existingId);

      const id = anonymousIdentityService.getAnonymousId();

      expect(id).toBe(existingId);

      // No debe generar nuevo UUID
      expect(storageService.setString).not.toHaveBeenCalled();
    });

    it('debe generar nuevo UUID si el existente tiene formato inválido', () => {
      (storageService.getString as jest.Mock).mockReturnValue('invalid-format');

      const id = anonymousIdentityService.getAnonymousId();

      expect(id).toMatch(/^anon_/);
      expect(storageService.setString).toHaveBeenCalled();
    });

    it('debe incluir deviceId en el UUID generado', () => {
      (storageService.getString as jest.Mock).mockReturnValue(null);
      (DeviceInfo.getDeviceId as jest.Mock).mockReturnValue('TEST-DEVICE-XYZ');

      const id = anonymousIdentityService.getAnonymousId();

      // Device ID se sanitiza: "TEST-DEVICE-XYZ" → "testd"
      expect(id).toContain('testd');
    });

    it('debe generar UUID temporal si storage falla', () => {
      (storageService.getString as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const id = anonymousIdentityService.getAnonymousId();

      // Debe retornar UUID válido aunque falle storage
      expect(id).toMatch(/^anon_/);

      // No debe guardar (porque falló storage)
      expect(storageService.setString).not.toHaveBeenCalled();
    });
  });

  describe('resetAnonymousId', () => {
    it('debe borrar UUID existente y generar uno nuevo', () => {
      const newId = anonymousIdentityService.resetAnonymousId();

      // Verificar que se borró el anterior
      expect(storageService.deleteKey).toHaveBeenCalledWith('anonymous_user_id');

      // Verificar que se generó y guardó uno nuevo
      expect(newId).toMatch(/^anon_/);
      expect(storageService.setString).toHaveBeenCalledWith('anonymous_user_id', newId);
    });

    it('debe generar UUID válido incluso si deleteKey falla', () => {
      (storageService.deleteKey as jest.Mock).mockImplementation(() => {
        throw new Error('Delete error');
      });

      const newId = anonymousIdentityService.resetAnonymousId();

      expect(newId).toMatch(/^anon_/);
    });
  });

  describe('isAnonymousId', () => {
    it('debe retornar true para UUID anónimo válido', () => {
      expect(anonymousIdentityService.isAnonymousId('anon_1738692841_x7k2m9_test1')).toBe(true);
      expect(anonymousIdentityService.isAnonymousId('anon_1234567890123_abcdef_xyz')).toBe(true);
    });

    it('debe retornar false para UUID de Firebase', () => {
      expect(anonymousIdentityService.isAnonymousId('firebase_ABC123XYZ')).toBe(false);
      expect(anonymousIdentityService.isAnonymousId('aBc123dEf456')).toBe(false);
    });

    it('debe retornar false para null/undefined', () => {
      expect(anonymousIdentityService.isAnonymousId(null)).toBe(false);
      expect(anonymousIdentityService.isAnonymousId(undefined)).toBe(false);
    });

    it('debe retornar false para string vacío', () => {
      expect(anonymousIdentityService.isAnonymousId('')).toBe(false);
    });
  });

  describe('getDeviceMetadata', () => {
    it('debe retornar metadata correcta del dispositivo', () => {
      const metadata = anonymousIdentityService.getDeviceMetadata();

      expect(metadata).toEqual({
        deviceId: 'test-device-123',
        brand: 'Apple',
        model: 'iPhone 14',
        systemVersion: '17.0',
      });
    });
  });

  describe('formato UUID', () => {
    it('debe generar UUIDs únicos en múltiples llamadas', () => {
      (storageService.getString as jest.Mock).mockReturnValue(null);

      const id1 = anonymousIdentityService.getAnonymousId();
      jest.clearAllMocks();
      (storageService.getString as jest.Mock).mockReturnValue(null);

      const id2 = anonymousIdentityService.getAnonymousId();

      expect(id1).not.toBe(id2);
    });

    it('timestamp debe ser unix timestamp de 13 dígitos', () => {
      (storageService.getString as jest.Mock).mockReturnValue(null);

      const id = anonymousIdentityService.getAnonymousId();
      const parts = id.split('_');
      const timestamp = parseInt(parts[1], 10);

      // Verificar que es timestamp válido (entre 2020 y 2030)
      expect(timestamp).toBeGreaterThan(1577836800000); // 1 Jan 2020
      expect(timestamp).toBeLessThan(1893456000000); // 1 Jan 2030
    });

    it('parte aleatoria debe tener exactamente 6 caracteres alfanuméricos', () => {
      (storageService.getString as jest.Mock).mockReturnValue(null);

      const id = anonymousIdentityService.getAnonymousId();
      const parts = id.split('_');
      const randomPart = parts[2];

      expect(randomPart).toHaveLength(6);
      expect(randomPart).toMatch(/^[a-z0-9]{6}$/);
    });
  });
});
