
export const debugLog = (context: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${context}] ${message}`);
  if (data) {
    console.log(`[${timestamp}] [${context}] Data:`, JSON.stringify(data, null, 2));
  }
};

export const debugError = (context: string, message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${context}] ERROR: ${message}`);
  if (error) {
    console.error(`[${timestamp}] [${context}] Error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      type: typeof error,
      constructor: error.constructor?.name,
      fullError: error
    });
  }
};

export const debugStep = (context: string, step: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${context}] STEP: ${step}`);
  if (data) {
    console.log(`[${timestamp}] [${context}] Step data:`, JSON.stringify(data, null, 2));
  }
};
