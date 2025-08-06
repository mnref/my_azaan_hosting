// Production-ready URL helper for Firebase Storage and Google Storage

/**
 * Check if we're in production environment
 */
export const isProduction = (): boolean => {
  return window.location.protocol === 'https:' || 
         window.location.hostname !== 'localhost' ||
         process.env.NODE_ENV === 'production';
};

/**
 * Check if URL is from Firebase Storage or Google Storage
 */
export const isStorageUrl = (url: string): boolean => {
  return url.includes('firebasestorage.googleapis.com') || 
         url.includes('storage.googleapis.com');
};

/**
 * Create a production-safe URL for storage resources
 * This ensures HTTPS and adds cache-busting to avoid cached errors
 */
export const createSafeUrl = (url: string): string => {
  if (!isStorageUrl(url)) {
    return url;
  }
  
  // Ensure HTTPS in production
  if (isProduction() && url.startsWith('http:')) {
    url = url.replace('http:', 'https:');
  }
  
  // Add cache-busting parameter to avoid cached CORS errors
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_cb=${Date.now()}`;
}; 