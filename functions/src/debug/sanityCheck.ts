import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

/**
 * A completely isolated function to test the core deployment environment.
 */
export const sanityCheck = onCall((request) => {
  logger.info("Sanity check function was called successfully!");
  return { status: "ok", message: "The environment is healthy!" };
});