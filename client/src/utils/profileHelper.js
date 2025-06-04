// Helper functions for processing user profile data

/**
 * Process a Google profile photo URL to ensure it displays correctly
 * Google profile photos often need a size parameter to display properly
 * 
 * @param {string} photoURL - The original profile photo URL
 * @param {number} size - The desired size of the profile photo (default: 96px)
 * @returns {string} - Processed photo URL
 */
export function processGooglePhotoUrl(photoURL, size = 96) {
  if (!photoURL) return '';
  
  // Check if it's a Google user content URL (Google profile photos)
  if (photoURL.includes('googleusercontent.com')) {
    // Different patterns of Google profile photo URLs
    if (photoURL.includes('s96-c')) {
      // Already has a size parameter in the right format
      return photoURL;
    } else if (photoURL.includes('=')) {
      // Has some parameter already, replace it
      return photoURL.split('=')[0] + `=s${size}-c`;
    } else if (photoURL.includes('photo.jpg')) {
      // Some Google photos have this format
      return `${photoURL}?sz=${size}`;
    } else {
      // Add the size parameter if none exists
      return `${photoURL}=s${size}-c`;
    }
  }
  
  return photoURL;
}
