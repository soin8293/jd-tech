
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

/**
 * Grants or revokes admin custom claims for a user based on email.
 * Must be called by an existing admin.
 */
export const manageAdminRole = functions.https.onCall(async (data, context) => {
  console.log("manageAdminRole function called with data:", data);
  console.log("Auth context:", context.auth);
  
  // 1. Check if the caller is an admin
  if (!context.auth?.token?.admin) {
    console.error("Permission denied: Caller is not an admin", context.auth?.token);
    throw new functions.https.HttpsError(
      "permission-denied",
      "Caller must be an admin to manage roles."
    );
  }
  
  // 2. Validate input data
  const email = data.email;
  const makeAdmin = !!data.makeAdmin; // Ensure boolean
  
  console.log(`Managing admin role for email: ${email}, makeAdmin: ${makeAdmin}`);
  
  if (!email || typeof email !== "string") {
    console.error("Invalid argument: Email not provided or not a string", { email });
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email must be provided and be a string."
    );
  }
  
  try {
    // 3. Get user by email
    console.log(`Attempting to get user by email: ${email}`);
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log("Retrieved userRecord:", JSON.stringify(userRecord));
    const uid = userRecord.uid;
    
    // 4. Set the custom claim
    try {
      await admin.auth().setCustomUserClaims(uid, { admin: makeAdmin });
    } catch (setClaimsError: any) {
      console.error("Error setting custom claims:", setClaimsError);
      throw new functions.https.HttpsError("internal", "Failed to set custom claims", { error: setClaimsError.message });
    }
    
    // 5. Update the Firestore list for reference
    console.log("Updating admin list in Firestore");
    const adminConfigRef = admin.firestore().collection('config').doc('admin');
    
    try {
      if (makeAdmin) {
        await adminConfigRef.update({
          adminEmails: admin.firestore.FieldValue.arrayUnion(email)
        });
      } else {
        await adminConfigRef.update({
          adminEmails: admin.firestore.FieldValue.arrayRemove(email)
        });
      }
      console.log("Firestore admin list updated successfully");
      
    } catch (firestoreError) {
      console.error("Failed to update adminEmails list in Firestore:", firestoreError);
      
      // Try to create the document if it doesn't exist
      try {
        console.log("Attempting to create admin config document");
        await adminConfigRef.set({
          adminEmails: makeAdmin ? [email] : []
        });
        console.log("Admin config document created successfully");
      } catch (setError) {
        console.error("Failed to create admin config document:", setError);
        // Continue anyway since we already set the claims
      }
    }
    
    console.log("Admin role management completed successfully");
    return {
      success: true,
      message: `Successfully ${makeAdmin ? 'granted' : 'revoked'} admin role for ${email}.`,
    };
  } catch (error) {
    console.error("Error managing admin role:", error);
    
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
      
      // Check for Auth-specific errors
      if ('code' in error) {
        if (error.code === 'auth/user-not-found') {
          throw new functions.https.HttpsError(
            "not-found", 
            `User with email ${email} not found.`
          );
        }
        
        if (error.code === 'auth/invalid-email') {
          throw new functions.https.HttpsError(
            "invalid-argument", 
            `The email address ${email} is not valid.`
          );
        }
      }
    }
    
    // Handle other potential errors
    throw new functions.https.HttpsError(
      "internal", 
      "An unexpected error occurred while managing admin role."
    );
  }
});

