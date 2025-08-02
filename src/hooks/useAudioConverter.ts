import { useState, useCallback, useEffect, useRef } from 'react';
import { AudioConverter, ConversionOptions, ConversionProgress, ConversionResult } from '../utils/AudioConverter';

export interface UseAudioConverterState {
  isInitializing: boolean;
  isConverting: boolean;
  isReady: boolean;
  isSupported: boolean;
  error: string | null;
  progress: ConversionProgress | null;
}

export interface UseAudioConverterReturn extends UseAudioConverterState {
  convertWebMToMP3: (
    webmBlob: Blob,
    options?: ConversionOptions,
    onProgress?: (progress: ConversionProgress) => void
  ) => Promise<ConversionResult>;
  resetError: () => void;
  checkSupport: () => Promise<boolean>;
  cleanup: () => void;
}

export const useAudioConverter = (): UseAudioConverterReturn => {
  const [state, setState] = useState<UseAudioConverterState>({
    isInitializing: false,
    isConverting: false,
    isReady: false,
    isSupported: false,
    error: null,
    progress: null
  });

  const audioConverterRef = useRef<AudioConverter | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize AudioConverter on mount
  useEffect(() => {
    const initializeConverter = async () => {
      try {
        setState(prev => ({ ...prev, isInitializing: true, error: null }));
        
        audioConverterRef.current = AudioConverter.getInstance();
        const isSupported = await audioConverterRef.current.isSupported();
        
        setState(prev => ({
          ...prev,
          isInitializing: false,
          isReady: isSupported,
          isSupported
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isInitializing: false,
          isReady: false,
          isSupported: false,
          error: error instanceof Error ? error.message : 'Failed to initialize audio converter'
        }));
      }
    };

    initializeConverter();

    // Cleanup on unmount
    return () => {
      if (audioConverterRef.current) {
        audioConverterRef.current.cleanup();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const checkSupport = useCallback(async (): Promise<boolean> => {
    try {
      if (!audioConverterRef.current) {
        audioConverterRef.current = AudioConverter.getInstance();
      }
      const isSupported = await audioConverterRef.current.isSupported();
      setState(prev => ({ ...prev, isSupported, isReady: isSupported }));
      return isSupported;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSupported: false,
        isReady: false,
        error: error instanceof Error ? error.message : 'Support check failed'
      }));
      return false;
    }
  }, []);

  const convertWebMToMP3 = useCallback(async (
    webmBlob: Blob,
    options: ConversionOptions = { quality: 'medium' },
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> => {
    if (!audioConverterRef.current) {
      throw new Error('Audio converter not initialized');
    }

    // Create abort controller for this conversion
    abortControllerRef.current = new AbortController();

    try {
      setState(prev => ({
        ...prev,
        isConverting: true,
        error: null,
        progress: null
      }));

      const progressHandler = (progress: ConversionProgress) => {
        setState(prev => ({ ...prev, progress }));
        onProgress?.(progress);
      };

      const result = await audioConverterRef.current.convertWebMToMP3(
        webmBlob,
        options,
        progressHandler
      );

      setState(prev => ({
        ...prev,
        isConverting: false,
        progress: null
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
      setState(prev => ({
        ...prev,
        isConverting: false,
        progress: null,
        error: errorMessage
      }));
      throw new Error(errorMessage);
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const cleanup = useCallback(() => {
    if (audioConverterRef.current) {
      audioConverterRef.current.cleanup();
      audioConverterRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState({
      isInitializing: false,
      isConverting: false,
      isReady: false,
      isSupported: false,
      error: null,
      progress: null
    });
  }, []);

  return {
    ...state,
    convertWebMToMP3,
    resetError,
    checkSupport,
    cleanup
  };
}; 