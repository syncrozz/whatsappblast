/**
 * Phone number sanitization and validation utilities
 * Formats numbers into E.164 without leading '+' for WhatsApp Cloud API standards.
 */

export function sanitizePhoneNumber(input: string | number | undefined | null): {
  isValid: boolean;
  sanitized: string;
  formatted: string;
  error?: string;
} {
  if (!input) {
    return { isValid: false, sanitized: '', formatted: '', error: 'Nombor telefon kosong' };
  }

  let cleaned = String(input).replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Handle common Malaysian local format: 01x-xxxxxxx -> 601x-xxxxxxx
  if (cleaned.startsWith('01')) {
    cleaned = '6' + cleaned;
  } else if (cleaned.startsWith('1') && cleaned.length >= 9 && cleaned.length <= 11) {
    cleaned = '60' + cleaned;
  }

  // Basic length validation (international phone numbers are 8 to 15 digits)
  if (cleaned.length < 9 || cleaned.length > 15) {
    return {
      isValid: false,
      sanitized: cleaned,
      formatted: cleaned,
      error: 'Panjang digit tidak sah (perlu 9-15 digit)'
    };
  }

  // Formatted display (e.g., +60 13-950 0149)
  let formatted = `+${cleaned}`;
  if (cleaned.startsWith('60') && cleaned.length >= 10) {
    const prefix = cleaned.substring(0, 4); // 6013
    const mid = cleaned.substring(4, 7);
    const rest = cleaned.substring(7);
    formatted = `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)}-${mid} ${rest}`;
  }

  return {
    isValid: true,
    sanitized: cleaned,
    formatted,
  };
}

export function formatPhoneDisplay(phone: string): string {
  const res = sanitizePhoneNumber(phone);
  return res.formatted || phone;
}
