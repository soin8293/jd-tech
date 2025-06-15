
// Export only the sanity check function for testing the deployment environment
import { sanityCheck } from "./debug/sanityCheck";

export { 
  sanityCheck
  // Comment out other functions for now to isolate the test
  // processBooking,
  // createPaymentIntent,
  // sendBookingConfirmation,
  // manageAdminRole,
  // setInitialAdmin,
  // setupDynamicAdmin,
  // inviteAdmin,
  // acceptInvitation,
  // updateRoomAvailability,
  // seedDatabase
};
