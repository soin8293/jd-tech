
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

/**
 * Set initial admin user.
 * This function should be called once to set up the first admin.
 */
export const setInitialAdmin = functions.https.onCall(async (data, context) => {
  const targetEmail = "amirahcolorado@gmail.com";
  
  try {
    // Find the user by email
    const userRecord = await admin.auth().getUserByEmail(targetEmail);
    
    // Set admin claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    // Create or update the admin config document
    const adminConfigRef = admin.firestore().collection('config').doc('admin');
    await adminConfigRef.set({
      adminEmails: [targetEmail]
    }, { merge: true });
    
    return {
      success: true,
      message: `Successfully set ${targetEmail} as the initial admin.`
    };
  } catch (error: unknown) {
    console.error("Error setting initial admin:", error);
    throw new functions.https.HttpsError("internal", "Failed to set initial admin user.");
  }
});
