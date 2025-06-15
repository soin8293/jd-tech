
/**
 * =================================================================
 * DEBUGGING STEP 1: Isolate the problem
 * We are commenting out all other functions to see if the deployment
 * succeeds with just one. If it does, the problem is in one of
 * the commented-out files.
 * =================================================================
 */

// COMMENTED OUT FOR DEBUGGING
// import { processBooking } from "./payment/processBooking";
// import { sendBookingConfirmation } from "./email/sendBookingConfirmation";
// import { manageAdminRole } from "./admin/manageAdmin";
// import { setInitialAdmin } from "./admin/initialAdmin";
// import { setupDynamicAdmin } from "./admin/dynamicAdminSetup";
// import { inviteAdmin } from "./admin/inviteAdmin";
// import { acceptInvitation } from "./admin/acceptInvitation";
// import { updateRoomAvailability } from "./rooms/updateRoomAvailability";
// import { seedDatabase } from "./admin/seedDatabase";

// --- DEPLOY ONLY THE SANITY CHECK ---
import { sanityCheck } from "./debug/sanityCheck";

export { sanityCheck };
