
// Export all Firebase Functions for the hotel booking system
import { sanityCheck } from "./debug/sanityCheck";
import { createPaymentIntent } from "./payment/createPaymentIntent";
import { processBooking } from "./payment/processBooking";
import { sendBookingConfirmation } from "./email/sendBookingConfirmation";
import { manageAdminRole } from "./admin/manageAdmin";
import { setInitialAdmin } from "./admin/initialAdmin";
import { setupDynamicAdmin } from "./admin/dynamicAdminSetup";
import { inviteAdmin } from "./admin/inviteAdmin";
import { acceptInvitation } from "./admin/acceptInvitation";
import { updateRoomAvailability } from "./rooms/updateRoomAvailability";
import { seedDatabase } from "./admin/seedDatabase";
import { getUserBookings } from "./booking/getUserBookings";
import { checkInBooking } from "./checkin/checkInBooking";
import { createCheckoutSession } from "./payment/createCheckoutSession";
import { stripeCheckoutWebhook } from "./webhooks/stripeCheckoutWebhook";
import { updateAvailability } from "./availability/updateAvailability";
import { getAvailabilityCalendar } from "./availability/getAvailabilityCalendar";
import { validateAvailabilityChange } from "./availability/validateAvailabilityChange";
import { getBulkAvailability } from "./availability/getBulkAvailability";

export { 
  sanityCheck,
  createPaymentIntent,
  createCheckoutSession,
  processBooking,
  sendBookingConfirmation,
  manageAdminRole,
  setInitialAdmin,
  setupDynamicAdmin,
  inviteAdmin,
  acceptInvitation,
  updateRoomAvailability,
  seedDatabase,
  getUserBookings,
  checkInBooking,
  stripeCheckoutWebhook,
  updateAvailability,
  getAvailabilityCalendar,
  validateAvailabilityChange,
  getBulkAvailability
};
