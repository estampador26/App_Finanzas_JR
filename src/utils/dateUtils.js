import { Timestamp } from 'firebase/firestore';

// Helper to convert various date formats to Firestore Timestamp
export const toTimestamp = (dateValue) => {
  if (!dateValue) return null;
  // If it's already a Firestore Timestamp, return it.
  if (dateValue instanceof Timestamp) {
    return dateValue;
  }
  // If it's a JS Date object, convert it.
  if (dateValue instanceof Date) {
    return Timestamp.fromDate(dateValue);
  }
  // If it's a string or number (milliseconds), create a new Date and convert.
  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return Timestamp.fromDate(date);
    }
  }
  // If it has a toDate method (like from older Firestore SDK versions)
  if (typeof dateValue.toDate === 'function') {
    return Timestamp.fromDate(dateValue.toDate());
  }
  return null;
};

// Formats a date object into a string (e.g., YYYY-MM-DD)
export const formatDate = (date, format) => {
  const d = toTimestamp(date)?.toDate();
  if (!d) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }
  
  // Fallback to a default format or handle other formats
  return d.toLocaleDateString('es-ES');
};
