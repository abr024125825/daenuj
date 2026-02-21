/**
 * Safe Error Message Utility
 * Maps internal database/API errors to user-friendly messages
 * to prevent leaking database structure or internal details.
 */

const ERROR_MAP: Record<string, string> = {
  'duplicate key': 'This record already exists.',
  'foreign key': 'Cannot complete this action — related data exists.',
  'not found': 'The requested item was not found.',
  'permission denied': 'You do not have permission for this action.',
  'violates row-level security': 'You do not have permission for this action.',
  'already has an active appointment': 'You already have an active appointment.',
  'already booked': 'This slot has already been booked.',
  'jwt expired': 'Your session has expired. Please log in again.',
  'invalid login credentials': 'Invalid email or password.',
  'email not confirmed': 'Please verify your email address first.',
  'rate limit': 'Too many requests. Please wait and try again.',
};

/**
 * Converts an internal error into a safe, user-friendly message.
 * Logs the original error to console for debugging.
 */
export function getFriendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (msg.includes(key)) return friendly;
  }

  // Log full error for developers, return generic message to user
  console.error('[App Error]:', error);
  return 'An unexpected error occurred. Please try again.';
}
