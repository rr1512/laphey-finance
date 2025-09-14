// Timezone utilities for WIB (Western Indonesian Time, UTC+7)

/**
 * Get current date and time in WIB timezone
 * @returns Date object in WIB timezone
 */
export function getCurrentWIBDate(): Date {
  const now = new Date()
  // Convert to WIB (UTC+7)
  return new Date(now.getTime() + (7 * 60 * 60 * 1000))
}

/**
 * Format date for datetime-local input in WIB timezone
 * @returns String in format YYYY-MM-DDTHH:MM
 */
export function getWIBDateTimeLocal(): string {
  const wibDate = getCurrentWIBDate()
  return wibDate.toISOString().slice(0, 16)
}

/**
 * Convert date string to WIB timezone for database storage
 * @param dateString - Date string from datetime-local input
 * @returns ISO string in WIB timezone
 */
export function convertToWIBISO(dateString: string): string {
  if (!dateString) {
    return getCurrentWIBDate().toISOString()
  }
  
  // Parse the datetime-local input and convert to WIB
  const localDate = new Date(dateString)
  const wibDate = new Date(localDate.getTime() + (7 * 60 * 60 * 1000))
  return wibDate.toISOString()
}

/**
 * Format date for display in Indonesian locale with WIB timezone
 * @param dateString - ISO date string
 * @returns Formatted date string in Indonesian
 */
export function formatWIBDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  })
}