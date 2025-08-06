// Environment configuration for different deployment stages

export interface EnvironmentConfig {
  apiBaseUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
  enableDebugLogs: boolean;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const isProduction = import.meta.env.PROD || 
                      window.location.protocol === 'https:' || 
                      window.location.hostname !== 'localhost';

  const isDevelopment = import.meta.env.DEV || 
                       window.location.hostname === 'localhost';

  // API Base URL - use environment variable or default
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
                    (isDevelopment ? 'http://172.184.138.18:8000' : 'https://your-api-domain.com');

  return {
    apiBaseUrl,
    isProduction,
    isDevelopment,
    enableDebugLogs: isDevelopment,
  };
};

export const env = getEnvironmentConfig();

// Helper functions
export const log = (message: string, data?: any) => {
  if (env.enableDebugLogs) {
    console.log(message, data);
  }
};

export const logError = (message: string, error?: any) => {
  if (env.enableDebugLogs) {
    console.error(message, error);
  }
}; 