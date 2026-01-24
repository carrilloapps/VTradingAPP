import * as Sentry from '@sentry/react-native';
import { getCrashlytics } from '@react-native-firebase/crashlytics';

class ObservabilityService {
  /**
   * Captura un error y lo envía a Sentry y Crashlytics.
   * @param error El error capturado.
   * @param context Información adicional opcional para depuración.
   */
  captureError(error: any, context?: Record<string, any>) {
    // Log en consola siempre para desarrollo y depuración local
    console.error('[Observability] Error caught:', error);
    if (context) {
      console.log('[Observability] Context:', context);
    }

    try {
      // Enviar a Sentry
      Sentry.captureException(error, {
        extra: context,
      });

      // Enviar a Crashlytics
      const crashlytics = getCrashlytics();
      crashlytics.recordError(error instanceof Error ? error : new Error(String(error)));
      
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          crashlytics.setAttribute(key, String(value));
        });
      }
    } catch (serviceError) {
      // Evitar que un fallo en el servicio de observabilidad rompa la app
      console.error('[Observability] Failed to report error:', serviceError);
    }
  }

  /**
   * Registra un mensaje de log en Sentry y Crashlytics.
   * @param message El mensaje a registrar.
   */
  log(message: string) {
    if (__DEV__) {
      console.log('[Observability] Log:', message);
    }

    try {
      Sentry.captureMessage(message);
      getCrashlytics().log(message);
    } catch (e) {
      console.error('[Observability] Failed to log message:', e);
    }
  }
}

export const observabilityService = new ObservabilityService();
