
import { z } from 'zod';
import DOMPurify from 'dompurify';

// Sanitization utilities
export const sanitizeString = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
};

// Common validation schemas
export const validationSchemas = {
  // Room validation
  roomName: z.string()
    .min(1, "Room name is required")
    .max(100, "Room name must be less than 100 characters")
    .refine(val => sanitizeString(val) === val, "Invalid characters in room name"),

  roomDescription: z.string()
    .max(1000, "Description must be less than 1000 characters")
    .transform(val => sanitizeHtml(val)),

  price: z.number()
    .min(0, "Price must be positive")
    .max(10000, "Price must be less than $10,000"),

  capacity: z.number()
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(20, "Capacity cannot exceed 20"),

  size: z.number()
    .min(0, "Size must be positive")
    .max(5000, "Size must be less than 5000 sq ft"),

  bedType: z.string()
    .min(1, "Bed type is required")
    .max(50, "Bed type must be less than 50 characters")
    .refine(val => sanitizeString(val) === val, "Invalid characters in bed type"),

  // Booking validation
  guestCount: z.number()
    .int("Guest count must be a whole number")
    .min(1, "At least 1 guest required")
    .max(20, "Maximum 20 guests allowed"),

  dateRange: z.object({
    checkIn: z.date(),
    checkOut: z.date()
  }).refine(data => data.checkOut > data.checkIn, "Check-out must be after check-in"),

  // User input validation
  email: z.string()
    .email("Invalid email address")
    .max(254, "Email must be less than 254 characters")
    .transform(val => sanitizeString(val)),

  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .refine(val => sanitizeString(val) === val, "Invalid characters in name"),

  // File upload validation
  imageUrl: z.string()
    .url("Invalid URL format")
    .refine(url => {
      const allowedDomains = ['firebasestorage.googleapis.com', 'images.unsplash.com', 'cdn.jsdelivr.net'];
      try {
        const urlObj = new URL(url);
        return allowedDomains.some(domain => urlObj.hostname.includes(domain));
      } catch {
        return false;
      }
    }, "Image must be from allowed domains"),

  // Amenity validation
  amenity: z.string()
    .min(1, "Amenity name is required")
    .max(50, "Amenity name must be less than 50 characters")
    .refine(val => sanitizeString(val) === val, "Invalid characters in amenity name")
};

// Combined schemas for complex forms
export const roomFormSchema = z.object({
  name: validationSchemas.roomName,
  description: validationSchemas.roomDescription.optional(),
  price: validationSchemas.price,
  capacity: validationSchemas.capacity,
  size: validationSchemas.size,
  bed: validationSchemas.bedType,
  amenities: z.array(validationSchemas.amenity).max(20, "Maximum 20 amenities allowed"),
  images: z.array(validationSchemas.imageUrl).max(10, "Maximum 10 images allowed"),
  availability: z.boolean()
});

export const bookingFormSchema = z.object({
  guests: validationSchemas.guestCount,
  dateRange: validationSchemas.dateRange
});

export type RoomFormData = z.infer<typeof roomFormSchema>;
export type BookingFormData = z.infer<typeof bookingFormSchema>;
