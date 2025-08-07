// Firebase Storage Helper - Bypasses CORS issues by using Firebase SDK
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export interface FirebaseStorageConfig {
  bucket: string;
  path: string;
  token?: string;
}

/**
 * Convert Firebase Storage URL to direct download URL using Firebase SDK
 * This bypasses CORS issues by using authenticated Firebase access
 */
export const getFirebaseDownloadURL = async (firebaseUrl: string): Promise<string> => {
  try {
    console.log('🔥 Converting Firebase URL to download URL:', firebaseUrl);
    
    // Extract path from Firebase URL
    const url = new URL(firebaseUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)/);
    
    if (!pathMatch) {
      throw new Error('Invalid Firebase Storage URL format');
    }
    
    // Decode the path (Firebase URLs are URL-encoded)
    const encodedPath = pathMatch[1];
    const decodedPath = decodeURIComponent(encodedPath);
    
    console.log('🔥 Extracted path:', decodedPath);
    
    // Create Firebase Storage reference
    const storageRef = ref(storage, decodedPath);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('✅ Firebase download URL obtained:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('❌ Failed to get Firebase download URL:', error);
    
    // Fallback: try to modify the original URL
    try {
      const modifiedUrl = firebaseUrl.replace('?alt=media', '?alt=media&_cb=' + Date.now());
      console.log('🔄 Using fallback URL:', modifiedUrl);
      return modifiedUrl;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      throw error;
    }
  }
};

/**
 * Create a reliable audio URL that works across different environments
 */
export const createReliableAudioURL = async (originalUrl: string): Promise<string> => {
  // If it's a Firebase Storage URL, try to get a direct download URL
  if (originalUrl.includes('firebasestorage.googleapis.com')) {
    try {
      return await getFirebaseDownloadURL(originalUrl);
    } catch (error) {
      console.warn('⚠️ Firebase URL conversion failed, using original:', error);
    }
  }
  
  // For non-Firebase URLs, add cache busting
  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}_cb=${Date.now()}`;
};

/**
 * Test if an audio URL is accessible
 */
export const testAudioURL = async (url: string): Promise<{
  accessible: boolean;
  error?: string;
  corsSupported: boolean;
}> => {
  try {
    console.log('🧪 Testing audio URL:', url);
    
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors'
    });
    
    const corsHeader = response.headers.get('Access-Control-Allow-Origin');
    const corsSupported = corsHeader === '*' || corsHeader === window.location.origin;
    
    return {
      accessible: response.ok,
      corsSupported
    };
    
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      corsSupported: false
    };
  }
};
