
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

/**
 * Grants or revokes admin custom claims for a user based on email.
 * Must be called by an existing admin.
 */
export const manageAdminRole = onCall(async (request) => {
  console.log("manageAdminRole function called with data:", request.data);
  console.log("Auth context:", request.auth);
  
  // 1. Check if the caller is an admin
  if (!request.auth) {
    console.error("Authentication required: No auth context provided");
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to manage roles."
    );
  }
  
  // Check if token exists before accessing admin property
  if (!request.auth.token) {
    console.error("Token missing in auth context:", request.auth);
    throw new HttpsError(
      "permission-denied",
      "Authentication token is missing or invalid."
    );
  }
  
  // Check the admin claim specifically
  if (request.auth.token.admin !== true) {
    console.error("Permission denied: Caller is not an admin", {
      uid: request.auth.uid,
      email: request.auth.token.email,
      claims: request.auth.token
    });
    throw new HttpsError(
      "permission-denied",
      "Caller must be an admin to manage roles."
    );
  }
  
  // 2. Validate input data
  const email = request.data.email;
  const makeAdmin = !!request.data.makeAdmin; // Ensure boolean
  
  console.log(`Managing admin role for email: ${email}, makeAdmin: ${makeAdmin}`);
  
  if (!email || typeof email !== "string") {
    console.error("Invalid argument: Email not provided or not a string", { email });
    throw new HttpsError(
      "invalid-argument",
      "Email must be provided and be a string."
    );
  }
  
  try {
    // 3. Get user by email
    console.log(`Attempting to get user by email: ${email}`);
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log("Retrieved userRecord:", JSON.stringify(userRecord));
    } catch (getUserError: any) {
      console.error("Error getting user by email:", getUserError);
      console.error("Error details:", {
        code: getUserError.code,
        message: getUserError.message,
        stack: getUserError.stack
      });
      
      if (getUserError.code === 'auth/user-not-found') {
        throw new HttpsError(
          "not-found", 
          `User with email ${email} not found.`
        );
      }
      throw new HttpsError(
        "internal",
        `Failed to retrieve user: ${getUserError.message}`,
        { originalError: getUserError.code }
      );
    }
    
    const uid = userRecord.uid;
    console.log(`Retrieved user with UID: ${uid}`);
    
    // 4. Set the custom claim
    try {
      console.log(`Setting custom claim for user ${uid} to admin=${makeAdmin}`);
      await admin.auth().setCustomUserClaims(uid, { admin: makeAdmin });
      console.log("Custom claims set successfully");
    } catch (setClaimsError: any) {
      console.error("Error setting custom claims:", setClaimsError);
      console.error("Error details:", {
        code: setClaimsError.code,
        message: setClaimsError.message,
        stack: setClaimsError.stack
      });
      
      throw new HttpsError(
        "internal", 
        "Failed to set custom claims",
        { error: setClaimsError.message }
      );
    }
    
    // 5. Update the Firestore list for reference
    console.log("Updating admin list in Firestore");
    const adminConfigRef = admin.firestore().collection('config').doc('admin');
    
    try {
      // First check if the document exists
      const docSnapshot = await adminConfigRef.get();
      console.log(`Admin config document exists: ${docSnapshot.exists}`);
      
      if (docSnapshot.exists) {
        if (makeAdmin) {
          console.log(`Adding ${email} to admin list`);
          await adminConfigRef.update({
            adminEmails: admin.firestore.FieldValue.arrayUnion(email)
          });
        } else {
          console.log(`Removing ${email} from admin list`);
          await adminConfigRef.update({
            adminEmails: admin.firestore.FieldValue.arrayRemove(email)
          });
        }
        console.log("Firestore admin list updated successfully");
      } else {
        // Document doesn't exist, create it
        console.log("Admin config document does not exist, creating it");
        await adminConfigRef.set({
          adminEmails: makeAdmin ? [email] : []
        });
        console.log("Admin config document created successfully");
      }
    } catch (firestoreError: any) {
      console.error("Failed to update adminEmails list in Firestore:", firestoreError);
      console.error("Firestore error details:", {
        code: firestoreError.code,
        message: firestoreError.message,
        stack: firestoreError.stack
      });
      
      // Don't throw here, since we already set the custom claims
      // Just log the error and continue with success response
      console.warn("Continuing despite Firestore error since custom claims were set successfully");
    }
    
    console.log("Admin role management completed successfully");
    return {
      success: true,
      message: `Successfully ${makeAdmin ? 'granted' : 'revoked'} admin role for ${email}.`,
    };
  } catch (error: any) {
    console.error("Error managing admin role:", error);
    
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      code: error?.code
    };
    console.error("Detailed error information:", errorDetails);
    
    if (error instanceof HttpsError) {
      // If it's already an HttpsError, just rethrow it
      throw error;
    }
    
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
      
      // Check for Auth-specific errors
      if ('code' in error) {
        if (error.code === 'auth/user-not-found') {
          throw new HttpsError(
            "not-found", 
            `User with email ${email} not found.`
          );
        }
        
        if (error.code === 'auth/invalid-email') {
          throw new HttpsError(
            "invalid-argument", 
            `The email address ${email} is not valid.`
          );
        }
      }
    }
    
    // Handle other potential errors
    throw new HttpsError(
      "internal", 
      "An unexpected error occurred while managing admin role.",
      { 
        originalError: error?.message || "Unknown error",
        details: errorDetails
      }
    );
  }
});
