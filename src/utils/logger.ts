export interface LogContext {
  [key: string]: any;
}

export class Logger {
  private static instance: Logger;
  private context: LogContext = {};

  static getInstance(): Logger {
    if (!this.instance) {
      this.instance = new Logger();
    }
    return this.instance;
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  info(message: string, data?: any): void {
    console.log(`[INFO] ${message}`, { ...this.context, ...data });
  }

  warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}`, { ...this.context, ...data });
  }

  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, { ...this.context, error });
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, { ...this.context, ...data });
    }
  }
}

export const logger = Logger.getInstance();