import api from '../services/api';
import { Platform } from 'react-native';

export class ErrorHandler {
  static async log(
    service: string,
    message: string,
    level: 'CRITICAL' | 'ERROR' | 'WARNING' = 'ERROR',
    error?: any
  ) {
    console.error(`[${service}] ${message}`, error);

    const stackTrace = error instanceof Error
      ? error.stack
      : typeof error === 'object'
        ? JSON.stringify(error, null, 2)
        : String(error);

    try {
      await api.logError({
        service: `${service} (${Platform.OS})`,
        error_level: level,
        message,
        stack_trace: stackTrace
      });
      console.log('✅ Error logged to database successfully');
    } catch (e) {
      console.warn('❌ Failed to log error to database:', e);
    }
  }

  static async critical(service: string, message: string, error?: any) {
    return this.log(service, message, 'CRITICAL', error);
  }

  static async error(service: string, message: string, error?: any) {
    return this.log(service, message, 'ERROR', error);
  }

  static async warn(service: string, message: string, error?: any) {
    return this.log(service, message, 'WARNING', error);
  }
}
