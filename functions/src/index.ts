
// Export payment functions for debugging
import { processBooking } from "./payment/processBooking";
import { createPaymentIntent } from "./payment/createPaymentIntent";
import { sanityCheck } from "./debug/sanityCheck";

export { 
  sanityCheck,
  processBooking,
  createPaymentIntent
  // Comment out other functions for now to isolate payment issues
  // sendBookingConfirmation,
  // manageAdminRole,
  // setInitialAdmin,
  // setupDynamicAdmin,
  // inviteAdmin,
  // acceptInvitation,
  // updateRoomAvailability,
  // seedDatabase
};
