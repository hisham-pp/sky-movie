/**
 * Simple logging utility for consistent debug output across services
 */

interface Logger {
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  debug(...args: any[]): void;
}

export function logger(name: string): Logger {
  const prefix = `[${name}]`;

  return {
    info(...args: any[]) {
      console.log(prefix, ...args);
    },
    warn(...args: any[]) {
      console.warn(prefix, ...args);
    },
    error(...args: any[]) {
      console.error(prefix, ...args);
    },
    debug(...args: any[]) {
      if (process.env.DEBUG) {
        console.debug(prefix, ...args);
      }
    }
  };
}
