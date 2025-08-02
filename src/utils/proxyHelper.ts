// Proxy helper to bypass CORS issues with Firebase Storage

/**
 * CORS Proxy services (public)
 */
const CORS_PROXIES = [
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/'
];

/**
 * Create a proxied URL to bypass CORS
 */
export const createProxiedUrl = (originalUrl: string): string => {
  // Try different proxy services
  const proxy = CORS_PROXIES[0]; // Use first proxy
  return `${proxy}${encodeURIComponent(originalUrl)}`;
};

/**
 * Fetch resource through proxy with fallback
 */
export const fetchWithProxy = async (url: string): Promise<Response> => {
  // Try direct fetch first
  try {
    const response = await fetch(url);
    if (response.ok) {
      return response;
    }
  } catch (error) {
    console.warn('Direct fetch failed, trying proxy:', error);
  }

  // Try proxy fetch
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.warn(`Proxy ${proxy} failed:`, error);
    }
  }

  throw new Error('All fetch methods failed');
};

/**
 * Create a blob URL from Firebase Storage URL
 */
export const createBlobUrlFromFirebase = async (firebaseUrl: string): Promise<string> => {
  try {
    const response = await fetchWithProxy(firebaseUrl);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to create blob URL:', error);
    throw error;
  }
};

/**
 * Check if URL is from Firebase Storage
 */
export const isFirebaseStorageUrl = (url: string): boolean => {
  return url.includes('firebasestorage.googleapis.com') || 
         url.includes('storage.googleapis.com');
}; 