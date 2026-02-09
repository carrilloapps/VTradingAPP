import DeviceInfo from 'react-native-device-info';
import { storageService } from './StorageService';
import SafeLogger from '@/utils/safeLogger';

/**
 * AnonymousIdentityService
 *
 * Servicio encargado de generar y gestionar identificadores únicos
 * para usuarios que usan la app sin autenticarse.
 *
 * Formato UUID: anon_<timestamp>_<random>_<deviceId>
 * Ejemplo: anon_1738692841_x7k2m9_d4f8b
 */
class AnonymousIdentityService {
  private readonly STORAGE_KEY = 'anonymous_user_id';

  /**
   * Obtiene el UUID anónimo existente o genera uno nuevo
   * @returns UUID en formato anon_<timestamp>_<random>_<deviceId>
   */
  getAnonymousId(): string {
    try {
      // Intentar obtener UUID existente desde MMKV
      const existingId = storageService.getString(this.STORAGE_KEY);

      if (existingId && this.isValidAnonymousId(existingId)) {
        SafeLogger.info('[AnonymousIdentity] Using existing UUID:', existingId);
        return existingId;
      }

      // Si no existe o es inválido, generar nuevo
      SafeLogger.info('[AnonymousIdentity] Generating new UUID');
      const newId = this.generateAnonymousId();

      // Guardar en MMKV
      storageService.setString(this.STORAGE_KEY, newId);

      SafeLogger.info('[AnonymousIdentity] New UUID generated and saved:', newId);
      return newId;
    } catch (error) {
      SafeLogger.error('[AnonymousIdentity] Error getting UUID:', error);

      // Fallback: generar UUID temporal sin persistir
      const tempId = this.generateAnonymousId();
      SafeLogger.warn('[AnonymousIdentity] Using temporary UUID (not persisted):', tempId);
      return tempId;
    }
  }

  /**
   * Resetea el UUID anónimo (útil para testing o logout)
   * @returns Nuevo UUID generado
   */
  resetAnonymousId(): string {
    try {
      SafeLogger.info('[AnonymousIdentity] Resetting UUID');

      // Borrar UUID existente
      storageService.deleteKey(this.STORAGE_KEY);

      // Generar y persistir nuevo UUID
      const newId = this.generateAnonymousId();
      storageService.setString(this.STORAGE_KEY, newId);

      SafeLogger.info('[AnonymousIdentity] UUID reset successful:', newId);
      return newId;
    } catch (error) {
      SafeLogger.error('[AnonymousIdentity] Error resetting UUID:', error);
      return this.generateAnonymousId();
    }
  }

  /**
   * Genera un nuevo UUID anónimo
   * Formato: anon_<timestamp>_<random>_<deviceId>
   */
  private generateAnonymousId(): string {
    const timestamp = Date.now();
    const random = this.generateRandomString(6);
    const deviceId = DeviceInfo.getDeviceId()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 5);

    return `anon_${timestamp}_${random}_${deviceId}`;
  }

  /**
   * Genera una cadena aleatoria de caracteres alfanuméricos
   */
  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * Valida si un string tiene el formato correcto de UUID anónimo
   */
  private isValidAnonymousId(id: string): boolean {
    // Formato esperado: anon_<número>_<6chars>_<alphanum>
    const pattern = /^anon_\d{13}_[a-z0-9]{6}_[a-z0-9]+$/;
    return pattern.test(id);
  }

  /**
   * Verifica si un userId tiene formato de UUID anónimo
   * (útil para detectar migraciones)
   */
  isAnonymousId(userId: string | null | undefined): boolean {
    if (!userId) return false;
    return userId.startsWith('anon_');
  }

  /**
   * Obtiene metadata del dispositivo para contexto adicional
   * (útil para debugging y análisis)
   */
  getDeviceMetadata(): {
    deviceId: string;
    brand: string;
    model: string;
    systemVersion: string;
  } {
    return {
      deviceId: DeviceInfo.getDeviceId(),
      brand: DeviceInfo.getBrand(),
      model: DeviceInfo.getModel(),
      systemVersion: DeviceInfo.getSystemVersion(),
    };
  }
}

// Exportar instancia singleton
export const anonymousIdentityService = new AnonymousIdentityService();
