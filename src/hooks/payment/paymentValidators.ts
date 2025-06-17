
import type { BookingDetails } from '@/types/hotel.types';

export class PaymentValidators {
  static validatePaymentReadiness(
    stripe: any,
    elements: any,
    bookingDetails: BookingDetails | null,
    paymentIntentId: string | null
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!stripe) errors.push('Stripe not loaded');
    if (!elements) errors.push('Stripe elements not loaded');
    if (!bookingDetails) errors.push('No booking details');
    if (!paymentIntentId) errors.push('No payment intent');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateBookingDetails(bookingDetails: BookingDetails): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!bookingDetails.rooms || bookingDetails.rooms.length === 0) {
      errors.push('No rooms selected');
    }

    if (!bookingDetails.period?.checkIn || !bookingDetails.period?.checkOut) {
      errors.push('Invalid booking period');
    }

    if (!bookingDetails.guests || bookingDetails.guests < 1) {
      errors.push('Invalid guest count');
    }

    if (!bookingDetails.totalPrice || bookingDetails.totalPrice <= 0) {
      errors.push('Invalid total price');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
