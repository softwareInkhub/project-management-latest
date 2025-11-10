/**
 * Email utility functions for handling phone-based email addresses
 */

const PHONE_EMAIL_DOMAIN = '@phone.brmh.in';

/**
 * Format email for display - hides @phone.brmh.in domain
 * @param email - The email address to format
 * @returns Formatted email string
 */
export function formatEmailForDisplay(email: string | undefined | null): string {
  if (!email) return '';
  
  if (email.endsWith(PHONE_EMAIL_DOMAIN)) {
    // Remove the @phone.brmh.in suffix for display
    return email.replace(PHONE_EMAIL_DOMAIN, '');
  }
  
  return email;
}

/**
 * Check if an email is a phone-based email
 * @param email - The email address to check
 * @returns true if email ends with @phone.brmh.in
 */
export function isPhoneEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.endsWith(PHONE_EMAIL_DOMAIN);
}

/**
 * Extract phone number from phone-based email
 * @param email - The email address (e.g., +911234567890@phone.brmh.in)
 * @returns Phone number string (e.g., +911234567890)
 */
export function extractPhoneNumber(email: string | undefined | null): string | null {
  if (!email || !isPhoneEmail(email)) return null;
  
  return email.replace(PHONE_EMAIL_DOMAIN, '');
}

/**
 * Format user display name - handles phone emails
 * @param name - User's name
 * @param username - User's username
 * @param email - User's email
 * @returns Best display name
 */
export function formatUserDisplayName(
  name?: string | null,
  username?: string | null,
  email?: string | null
): string {
  if (name) return name;
  if (username) return username;
  if (email) {
    if (isPhoneEmail(email)) {
      return formatEmailForDisplay(email);
    }
    return email.split('@')[0];
  }
  return 'User';
}

