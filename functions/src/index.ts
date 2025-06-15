
// Comment out all existing function exports for isolation testing
// import { processBooking } from "./payment/processBooking";
// import { createPaymentIntent } from "./payment/createPaymentIntent";
// import { sendBookingConfirmation } from "./email/sendBookingConfirmation";
// import { manageAdminRole } from "./admin/manageAdmin";
// import { setInitialAdmin } from "./admin/initialAdmin";
// import { setupDynamicAdmin } from "./admin/dynamicAdminSetup";
// import { inviteAdmin } from "./admin/inviteAdmin";
// import { acceptInvitation } from "./admin/acceptInvitation";
// import { updateRoomAvailability } from "./rooms/updateRoomAvailability";
// import { seedDatabase } from "./admin/seedDatabase";

// Only export the sanity check for isolation testing
import { sanityCheck } from "./debug/sanityCheck";

export { 
  sanityCheck
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
