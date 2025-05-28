
import * as admin from "firebase-admin";
import { createPaymentIntent } from "./payment/createPaymentIntent";
import { processBooking } from "./payment/processBooking";
import { sendBookingConfirmation } from "./email/sendBookingConfirmation";
import { manageAdminRole } from "./admin/manageAdmin";
import { setInitialAdmin } from "./admin/initialAdmin";
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
  updateRoomAvailability
};
