/**
 * Safe Logger Utility
 * 
 * Provides secure logging that:
 * - Only logs in development mode
 * - Sanitizes sensitive data
 * - Prevents token/secret exposure
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info';

class SafeLogger {
    private static readonly SENSITIVE_KEYS = [
        //'token',
        'password',
        'secret',
        'apiKey',
        'api_key',
        'accessToken',
        'refreshToken',
        'idToken',
        'credential',
        'email',
        'phone',
        'address',
        'accountNumber',
    ];

    /**
     * Sanitize object by masking sensitive values
     */
    private static sanitize(obj: any): any {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitize(item));
        }

        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();
            const isSensitive = this.SENSITIVE_KEYS.some(sensitiveKey =>
                lowerKey.includes(sensitiveKey.toLowerCase())
            );

            if (isSensitive && typeof value === 'string') {
                // Show only first 4 and last 4 characters
                if (value.length > 8) {
                    sanitized[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
                } else {
                    sanitized[key] = '****';
                }
            } else if (typeof value === 'object') {
                sanitized[key] = this.sanitize(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Mask sensitive string data
     */
    private static maskString(str: string): string {
        if (str.length <= 8) return '****';
        return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
    }

    /**
     * Log with automatic sanitization
     */
    static log(message: string, ...args: any[]): void {
        this.write('log', message, ...args);
    }

    /**
     * Info log
     */
    static info(message: string, ...args: any[]): void {
        this.write('info', message, ...args);
    }

    /**
     * Warning log
     */
    static warn(message: string, ...args: any[]): void {
        this.write('warn', message, ...args);
    }

    /**
     * Error log
     */
    static error(message: string, ...args: any[]): void {
        this.write('error', message, ...args);
    }

    /**
     * Log sensitive data (only in dev, fully masked in prod)
     */
    static sensitive(context: string, data: any): void {
        if (__DEV__) {
            // In development, show masked version
            const masked = typeof data === 'string' ? this.maskString(data) : this.sanitize(data);
            console.log(`[${context}] (SENSITIVE - DEV ONLY):`, masked);
        } else {
            // In production, just log that we received sensitive data
            console.log(`[${context}] Sensitive data received (hidden in production)`);
        }
    }

    /**
     * Internal write method
     */
    private static write(level: LogLevel, message: string, ...args: any[]): void {
        if (!__DEV__ && level === 'log') {
            // Skip regular logs in production
            return;
        }

        const sanitizedArgs = args.map(arg => this.sanitize(arg));

        if (sanitizedArgs.length > 0) {
            console[level](message, ...sanitizedArgs);
        } else {
            console[level](message);
        }
    }

    /**
     * Check if a value has a token-like pattern
     */
    static looksLikeToken(value: string): boolean {
        // Common token patterns
        const tokenPatterns = [
            /^[A-Za-z0-9_-]{20,}$/, // Generic token
            /^ya29\.[A-Za-z0-9_-]+$/, // Google OAuth token
            /^[A-Za-z0-9]{32,}$/, // Random hash-like token
            /^Bearer\s+/i, // Bearer token
        ];

        return tokenPatterns.some(pattern => pattern.test(value));
    }

    /**
     * Safe console.log replacement that checks for tokens
     */
    static safeLog(...args: any[]): void {
        if (!__DEV__) return;

        const sanitizedArgs = args.map(arg => {
            if (typeof arg === 'string' && this.looksLikeToken(arg)) {
                return this.maskString(arg);
            }
            if (typeof arg === 'object') {
                return this.sanitize(arg);
            }
            return arg;
        });

        console.log(...sanitizedArgs);
    }
}

export default SafeLogger;
