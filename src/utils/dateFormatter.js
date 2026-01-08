/**
 * Format date as "January 23rd 2025"
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();

  // Add ordinal suffix (st, nd, rd, th)
  const getOrdinal = (n) => {
    if (n >= 11 && n <= 13) {
      return n + 'th';
    }
    switch (n % 10) {
      case 1: return n + 'st';
      case 2: return n + 'nd';
      case 3: return n + 'rd';
      default: return n + 'th';
    }
  };

  return `${month} ${getOrdinal(day)} ${year}`;
}

