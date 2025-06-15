
import * as admin from "firebase-admin";
import { createPaymentIntent } from "./payment/createPaymentIntent";
import { processBooking } from "./payment/processBooking";
import { sendBookingConfirmation } from "./email/sendBookingConfirmation";
import { manageAdminRole } from "./admin/manageAdmin";
import { setInitialAdmin } from "./admin/initialAdmin";
import { setupDynamicAdmin } from "./admin/dynamicAdminSetup";
import { inviteAdmin } from "./admin/inviteAdmin";
import { acceptInvitation } from "./admin/acceptInvitation";
import { updateRoomAvailability } from "./rooms/updateRoomAvailability";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export all the functions
export {
  createPaymentIntent,
  processBooking,
  sendBookingConfirmation,
  manageAdminRole,
  setInitialAdmin,
  setupDynamicAdmin,
  inviteAdmin,
  acceptInvitation,
  updateRoomAvailability
};
