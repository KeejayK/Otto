// Helper functions for time and date manipulation in calendar operations
const moment = require('moment-timezone');

// Default timezone
const DEFAULT_TIMEZONE = 'America/Los_Angeles';

/**
 * Formats a date for consistent display
 * @param {Date|string} date - Date object or ISO string 
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string
 */
function formatDate(date, options = {}) {
  const { 
    includeWeekday = true, 
    includeTime = true,
    hour12 = true
  } = options;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date provided to formatDate:', date);
    return 'Invalid date';
  }
  
  const formatOptions = {
    month: 'short',
    day: 'numeric',
  };
  
  if (includeWeekday) {
    formatOptions.weekday = 'short';
  }
  
  if (includeTime) {
    formatOptions.hour = 'numeric';
    formatOptions.minute = 'numeric';
    formatOptions.hour12 = hour12;
  }
  
  return dateObj.toLocaleString('en-US', formatOptions);
}

/**
 * Parses a time string like "5pm" and applies it to the provided date
 * @param {string} timeStr - Time string (e.g., "5pm", "17:00") 
 * @param {Date|string} baseDate - Date to apply the time to
 * @returns {Date} - New date with updated time
 */
function parseTimeAndApplyToDate(timeStr, baseDate) {
  const baseMoment = moment(baseDate).tz(DEFAULT_TIMEZONE);
  
  // Handle specific time formats
  const timeRegex = /(\d{1,2})(?::(\d{1,2}))?(?:\s*)?(am|pm)?/i;
  const match = timeStr.match(timeRegex);
  
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3] ? match[3].toLowerCase() : null;
    
    // Adjust hours for AM/PM
    if (ampm === 'pm' && hours < 12) {
      hours += 12;
    } else if (ampm === 'am' && hours === 12) {
      hours = 0;
    }
    
    // Set the time on the base date
    baseMoment.hours(hours).minutes(minutes).seconds(0).milliseconds(0);
    return baseMoment.toDate();
  }
  
  console.error('Could not parse time string:', timeStr);
  return new Date(baseDate);
}

/**
 * Creates an ISO string for API requests
 * @param {Date} date - Date object
 * @returns {string} - ISO formatted string
 */
function toISOString(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Invalid date provided to toISOString:', date);
    return null;
  }
  return date.toISOString();
}

module.exports = {
  formatDate,
  parseTimeAndApplyToDate,
  toISOString,
  DEFAULT_TIMEZONE
};
