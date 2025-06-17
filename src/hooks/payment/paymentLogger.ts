
export class PaymentLogger {
  private static prefix = '🔧 PaymentProcess';

  static logProcessStart(paymentType: 'card' | 'google_pay', paymentMethodId: string) {
    console.log(`${this.prefix}: Starting payment processing`, {
      paymentType,
      paymentMethodId: paymentMethodId.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });
  }

  static logPaymentSuccess(bookingId: string, message?: string) {
    console.log(`${this.prefix}: Payment successful`, {
      bookingId,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static logPaymentError(error: any, context?: string) {
    console.error(`${this.prefix}: Payment failed`, {
      error: error.message || error,
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
  }

  static logStateChange(from: string, to: string, context?: any) {
    console.log(`${this.prefix}: State change: ${from} → ${to}`, context);
  }

  static logValidationError(message: string, missingData: any) {
    console.error(`${this.prefix}: Validation failed: ${message}`, missingData);
  }
}
