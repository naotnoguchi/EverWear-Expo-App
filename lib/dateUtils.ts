/**
 * Date utility functions for the app
 */

/**
 * Formats a date to Japanese style with year, month, day and day of week
 * Example: 2023年5月1日(月)
 * 
 * @param date Date object or date string
 * @returns Formatted date string in Japanese style
 */
export function formatDateJapanese(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const dayOfWeek = days[dateObj.getDay()];
  return `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日(${dayOfWeek})`;
}

/**
 * Formats a date with localization support
 * 
 * @param date Date object or date string
 * @param language Language code ('ja' or 'en')
 * @returns Formatted date string based on language
 */
export function formatDateLocalized(date: Date | string, language: string = 'ja'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (language === 'ja') {
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    const dayOfWeek = days[dateObj.getDay()];
    return `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日(${dayOfWeek})`;
  } else {
    // English format: Monday, May 1, 2023
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return dateObj.toLocaleDateString('en-US', options);
  }
}

/**
 * Formats a date to YYYY-MM-DD format
 * This is kept for backward compatibility and database operations
 * 
 * @param date Date object
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateToLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}