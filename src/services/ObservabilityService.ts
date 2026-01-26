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

    // Filtro para ignorar errores de conectividad o plataforma (ya manejados o irrelevantes)
    const errorMsg = String(error?.message || error || '').toLowerCase();
    const isIgnoredError = errorMsg.includes('network request failed') ||
      errorMsg.includes('connection error') ||
      errorMsg.includes('service_not_available') ||
      errorMsg.includes('app distribution') ||
      errorMsg.includes('not supported') ||
      errorMsg.includes('app check') ||
      errorMsg.includes('app not registered') ||
      errorMsg.includes('token-error');

    if (isIgnoredError) {
      if (__DEV__) console.log('[Observability] Non-critical error ignored for reporting:', errorMsg);
      return;
    }

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

  /**
   * Inicia una transacción de rendimiento (Performance Transaction) en Sentry.
   * Nota: En versiones recientes del SDK, se prefiere startInactiveSpan o startSpan.
   * Adaptado para @sentry/react-native ~7.9.0
   * @param name Nombre de la transacción (ej: "GET /api/v1/users")
   * @param op Operación (ej: "http.client")
   */
  startTransaction(name: string, op: string) {
    try {
      // Usamos startInactiveSpan que es el reemplazo moderno para startTransaction en trazas manuales
      // sin callbacks.
      if (typeof Sentry.startInactiveSpan === 'function') {
        return Sentry.startInactiveSpan({ name, op });
      }

      // Fallback para versiones antiguas (aunque startTransaction no existe en esta version)
      if (typeof (Sentry as any).startTransaction === 'function') {
        return (Sentry as any).startTransaction({ name, op });
      }

      return null;
    } catch (e) {
      if (__DEV__) {
        console.warn('[Observability] Failed to start transaction:', e);
      }
      return null;
    }
  }

  /**
   * Finaliza una transacción de rendimiento.
   * @param transaction La transacción a finalizar.
   * @param status Estado final (opcional).
   */
  finishTransaction(transaction: any, status?: string) {
    if (!transaction) return;
    try {
      // Mapear status de string a span status si es necesario, o usar setStatus
      if (status) {
        // Sentry Span status handling
        if (typeof transaction.setStatus === 'function') {
          transaction.setStatus(status);
        }
      }

      // En la nueva API, end() reemplaza a finish(), pero finish() suele mantenerse por compatibilidad en objetos Span
      if (typeof transaction.end === 'function') {
        transaction.end();
      } else if (typeof transaction.finish === 'function') {
        transaction.finish();
      }
    } catch (e) {
      if (__DEV__) {
        console.warn('[Observability] Failed to finish transaction:', e);
      }
    }
  }

  /**
   * Establece un atributo o etiqueta en una transacción/span de forma segura y compatible.
   * @param transaction La transacción o span.
   * @param key La clave del atributo.
   * @param value El valor del atributo.
   */
  setTransactionAttribute(transaction: any, key: string, value: string | number | boolean) {
    if (!transaction) return;
    try {
      // Modern Sentry / OpenTelemetry Span
      if (typeof transaction.setAttribute === 'function') {
        transaction.setAttribute(key, value);
        return;
      }

      // Legacy Sentry Transaction (setTag para strings, setData para otros)
      if (typeof transaction.setTag === 'function') {
        // setTag solo suele aceptar strings en versiones antiguas
        transaction.setTag(key, String(value));
        return;
      }

      // Fallback muy antiguo
      if (typeof transaction.setData === 'function') {
        transaction.setData(key, value);
        return;
      }
    } catch (e) {
      if (__DEV__) {
        console.warn('[Observability] Failed to set transaction attribute:', e);
      }
    }
  }
}

export const observabilityService = new ObservabilityService();
