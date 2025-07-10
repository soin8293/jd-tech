import { z } from "zod";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "./logger";

/**
 * Validates request data against a Zod schema
 */
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    logger.debug("Validating request data", { schema: schema.description || "unknown", data });
    
    const result = schema.parse(data);
    
    logger.debug("Request validation successful");
    return result;
  } catch (error: any) {
    logger.error("Request validation failed", error);
    
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      
      throw new HttpsError(
        'invalid-argument',
        `Validation error: ${errorMessage}`,
        { type: 'validation_error', details: error.errors }
      );
    }
    
    throw new HttpsError(
      'invalid-argument',
      'Invalid request data',
      { type: 'validation_error' }
    );
  }
};

// Common validation schemas
export const schemas = {
  createPaymentIntent: z.object({
    rooms: z.array(z.object({
      id: z.string().min(1, "Room ID is required"),
      name: z.string().optional(),
      price: z.number().positive("Room price must be positive")
    })).min(1, "At least one room is required"),
    period: z.object({
      checkIn: z.string().or(z.date()),
      checkOut: z.string().or(z.date())
    }),
    guests: z.number().int().min(1, "At least 1 guest is required").max(20, "Maximum 20 guests allowed"),
    currency: z.string().length(3, "Currency must be 3 characters").optional().default("usd"),
    transaction_id: z.string().optional(),
    booking_reference: z.string().optional()
  }),
  
  processBooking: z.object({
    paymentIntentId: z.string().min(1, "Payment Intent ID is required"),
    paymentMethodId: z.string().optional(),
    clientSecret: z.string().optional(),
    paymentType: z.string().optional(),
    transaction_id: z.string().optional(),
    userEmail: z.string().email("Valid email is required").optional(),
    userId: z.string().optional(),
    timestamp: z.string().optional(),
    serverCalculatedAmount: z.number().optional(),
    bookingDetails: z.object({
      period: z.object({
        checkIn: z.string().or(z.date()),
        checkOut: z.string().or(z.date())
      }),
      guests: z.number().int().min(1),
      rooms: z.array(z.object({
        id: z.string(),
        name: z.string().optional(),
        price: z.number().positive()
      })),
      totalPrice: z.number().positive(),
      userEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      specialRequests: z.string().optional()
    })
  }),

  manageAdmin: z.object({
    email: z.string().email("Valid email is required"),
    makeAdmin: z.boolean()
  }),

  setInitialAdmin: z.object({}).optional(),

  sendBookingConfirmation: z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
    userEmail: z.string().email("Valid email is required"),
    paymentIntentId: z.string().optional(),
    bookingDetails: z.object({
      rooms: z.array(z.object({
        id: z.string(),
        name: z.string().optional(),
        bed: z.string().optional()
      })),
      period: z.object({
        startDate: z.object({
          seconds: z.number()
        }).optional(),
        endDate: z.object({
          seconds: z.number()
        }).optional(),
        checkIn: z.string().optional(),
        checkOut: z.string().optional()
      })
    }).optional(),
    guests: z.number().optional(),
    userName: z.string().optional()
  })
};