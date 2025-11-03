/**
 * Simple logging utility that respects environment settings
 */
export class Logger {
  private static readonly IS_PRODUCTION = process.env.NODE_ENV === 'production';
  private static readonly IS_TEST = process.env.NODE_ENV === 'test';

  static log(message: string): void {
    if (!this.IS_TEST) {
      console.log(message);
    }
  }

  static warn(message: string): void {
    if (!this.IS_TEST) {
      console.warn(message);
    }
  }

  static error(message: string, error?: unknown): void {
    if (!this.IS_TEST) {
      if (error) {
        console.error(message, error);
      } else {
        console.error(message);
      }
    }
  }

  static info(message: string): void {
    if (!this.IS_TEST) {
      console.info(message);
    }
  }
}