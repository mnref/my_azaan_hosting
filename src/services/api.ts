import { env } from '../config/environment';

// API service for making requests to the backend
export class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.apiBaseUrl;
  }

  // Make API request with proper error handling
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logError('API request error:', error);
      throw error;
    }
  }

  // Analyze audio recording
  async analyzeAudio(audioBlob: Blob, phraseId: number): Promise<any> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.mp3');
    formData.append('phrase_id', phraseId.toString());

    return this.request('/analyze', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
      },
    });
  }

  // Get phrases data
  async getPhrases(): Promise<any[]> {
    return this.request('/phrases');
  }

  // Get specific phrase
  async getPhrase(id: number): Promise<any> {
    return this.request(`/phrases/${id}`);
  }
}

// Export singleton instance
export const apiService = new ApiService(); 