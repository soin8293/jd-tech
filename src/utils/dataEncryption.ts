
import { AES, enc } from 'crypto-js';

// Get encryption key from environment or generate a fallback
const getEncryptionKey = (): string => {
  // In production, this should come from environment variables
  return process.env.VITE_ENCRYPTION_KEY || 'fallback-key-for-development-only';
};

export const encryptSensitiveData = (data: string): string => {
  try {
    const key = getEncryptionKey();
    return AES.encrypt(data, key).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return data; // Fallback to unencrypted in case of error
  }
};

export const decryptSensitiveData = (encryptedData: string): string => {
  try {
    const key = getEncryptionKey();
    const bytes = AES.decrypt(encryptedData, key);
    return bytes.toString(enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData; // Fallback to encrypted data
  }
};

// Encrypt specific PII fields in booking data
export const encryptBookingPII = (bookingData: any) => {
  const encryptedData = { ...bookingData };
  
  // Encrypt sensitive fields
  if (encryptedData.userEmail) {
    encryptedData.userEmail = encryptSensitiveData(encryptedData.userEmail);
  }
  
  if (encryptedData.contactPhone) {
    encryptedData.contactPhone = encryptSensitiveData(encryptedData.contactPhone);
  }
  
  if (encryptedData.specialRequests) {
    encryptedData.specialRequests = encryptSensitiveData(encryptedData.specialRequests);
  }
  
  return encryptedData;
};

// Decrypt PII fields when retrieving booking data
export const decryptBookingPII = (encryptedBookingData: any) => {
  const decryptedData = { ...encryptedBookingData };
  
  if (decryptedData.userEmail) {
    decryptedData.userEmail = decryptSensitiveData(decryptedData.userEmail);
  }
  
  if (decryptedData.contactPhone) {
    decryptedData.contactPhone = decryptSensitiveData(decryptedData.contactPhone);
  }
  
  if (decryptedData.specialRequests) {
    decryptedData.specialRequests = decryptSensitiveData(decryptedData.specialRequests);
  }
  
  return decryptedData;
};
