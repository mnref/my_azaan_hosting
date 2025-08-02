// Helper functions for audio handling and CORS issues

/**
 * Fetch audio file from Firebase Storage with CORS handling
 */
export const fetchAudioFromFirebase = async (url: string): Promise<Blob> => {
  try {
    // Try direct fetch first
    const response = await fetch(url);
    if (response.ok) {
      return await response.blob();
    }
  } catch (error) {
    console.warn('Direct fetch failed, trying with CORS headers:', error);
  }

  // Fallback: try with CORS headers
  try {
    const response = await fetch(url, {
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
    
    if (response.ok) {
      return await response.blob();
    }
  } catch (error) {
    console.warn('CORS fetch failed:', error);
  }

  // Final fallback: create a proxy request
  throw new Error('Unable to fetch audio file due to CORS restrictions');
};

/**
 * Create a safe audio URL that handles CORS
 */
export const createSafeAudioUrl = (url: string): string => {
  // If it's a Firebase Storage URL, we might need to handle CORS
  if (url.includes('firebasestorage.googleapis.com')) {
    // Add timestamp to prevent caching issues
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  }
  return url;
};

/**
 * Check if audio URL is accessible
 */
export const checkAudioAccessibility = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Audio URL not accessible:', error);
    return false;
  }
}; 