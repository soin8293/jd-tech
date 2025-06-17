
export class PaymentIntentError extends Error {
  public code: string;
  public details: any;

  constructor(message: string, code: string = 'unknown', details: any = {}) {
    super(message);
    this.name = 'PaymentIntentError';
    this.code = code;
    this.details = details;
  }
}

export const formatPaymentError = (error: any): string => {
  if (error instanceof PaymentIntentError) {
    return error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected payment error occurred';
};
