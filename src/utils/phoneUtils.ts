/**
 * Utility functions for phone number processing
 */

/**
 * Processes Indian phone numbers and ensures they have the correct +91 prefix
 * @param phoneNumber - The phone number to process
 * @returns Processed phone number with +91 prefix
 */
export const processIndianPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Clean the phone number (remove spaces, dashes, parentheses, etc.)
  let cleanedNumber = phoneNumber.replace(/[\s\-().]/g, '');
  
  // Remove leading 0 if present (e.g., 09876543210 -> 9876543210)
  if (cleanedNumber.startsWith('0')) {
    cleanedNumber = cleanedNumber.substring(1);
  }
  
  // Handle different formats and ensure +91 prefix
  if (cleanedNumber.length === 10) {
    // 10-digit number (e.g., 9876543210) -> +919876543210
    return '+91' + cleanedNumber;
  } else if (cleanedNumber.length === 12 && cleanedNumber.startsWith('91')) {
    // 12-digit number starting with 91 (e.g., 919876543210) -> +919876543210
    return '+' + cleanedNumber;
  } else if (cleanedNumber.length === 13 && cleanedNumber.startsWith('+91')) {
    // Already has +91 prefix (e.g., +919876543210) -> keep as is
    return cleanedNumber;
  } else if (cleanedNumber.length === 11 && cleanedNumber.startsWith('91')) {
    // 11-digit number starting with 91 (e.g., 91987654321) -> +91987654321
    return '+' + cleanedNumber;
  } else {
    // For any other format, try to add +91 prefix
    if (!cleanedNumber.startsWith('+91') && !cleanedNumber.startsWith('91')) {
      return '+91' + cleanedNumber;
    } else if (cleanedNumber.startsWith('91') && !cleanedNumber.startsWith('+91')) {
      return '+' + cleanedNumber;
    }
  }
  
  return cleanedNumber;
};

/**
 * Creates a WhatsApp URL with the processed phone number
 * @param phoneNumber - The phone number to use
 * @param message - The message to send
 * @returns WhatsApp URL
 */
export const createWhatsAppUrl = (phoneNumber: string, message: string): string => {
  const processedNumber = processIndianPhoneNumber(phoneNumber);
  
  if (processedNumber) {
    return `https://wa.me/${processedNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
  } else {
    // Fallback to general WhatsApp if no phone number
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
};
