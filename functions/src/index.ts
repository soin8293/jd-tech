
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

export { 
  sanityCheck,
  createPaymentIntent,
  processBooking,
  sendBookingConfirmation,
  manageAdminRole,
  setInitialAdmin,
  setupDynamicAdmin,
  inviteAdmin,
  acceptInvitation,
  updateRoomAvailability,
  seedDatabase
};
