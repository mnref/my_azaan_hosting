import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

// TypeScript interfaces for conversion options
export interface ConversionOptions {
  quality: 'low' | 'medium' | 'high';
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
}

export interface ConversionProgress {
  progress: number;
  time: number;
  duration: number;
}

export interface ConversionResult {
  mp3Blob: Blob;
  duration: number;
  fileSize: number;
  metadata: {
    bitrate: number;
    sampleRate: number;
    channels: number;
  };
}

export interface AudioConverterConfig {
  ffmpegCorePath?: string;
  logLevel?: 'quiet' | 'error' | 'warning' | 'info' | 'debug';
  enableProgress?: boolean;
}

export class AudioConverter {
  private static instance: AudioConverter | null = null;
  private ffmpeg: any | null = null; // Changed type to any as FFmpeg object is not directly exposed
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private config: AudioConverterConfig;
  private progressCallback?: (progress: ConversionProgress) => void;
  private sharedArrayBufferSupported: boolean = false;

  private constructor(config: AudioConverterConfig = {}) {
    this.config = {
      ffmpegCorePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
      logLevel: 'error',
      enableProgress: true,
      ...config
    };
    
    // Check for SharedArrayBuffer support
    this.sharedArrayBufferSupported = typeof SharedArrayBuffer !== 'undefined';
    console.log('🔧 SharedArrayBuffer supported:', this.sharedArrayBufferSupported);
  }

  public static getInstance(config?: AudioConverterConfig): AudioConverter {
    if (!AudioConverter.instance) {
      AudioConverter.instance = new AudioConverter(config);
    }
    return AudioConverter.instance;
  }

  public async initialize(): Promise<void> {
    console.log('🔧 AudioConverter.initialize() called');
    
    if (this.isInitialized) {
      console.log('🔧 Already initialized, returning early');
      return;
    }

    if (this.isInitializing) {
      console.log('🔧 Already initializing, waiting...');
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      console.log('🔧 Initialization completed by another process');
      return;
    }

    // Check if SharedArrayBuffer is supported
    if (!this.sharedArrayBufferSupported) {
      console.warn('⚠️ SharedArrayBuffer not supported. FFmpeg conversion will not be available.');
      this.isInitialized = true;
      return;
    }

    console.log('🔧 Starting FFmpeg initialization...');
    this.isInitializing = true;

    try {
      console.log('🔧 Creating FFmpeg instance...');
      this.ffmpeg = createFFmpeg({
        corePath: this.config.ffmpegCorePath,
        log: this.config.logLevel === 'debug',
        logger: this.config.logLevel === 'debug' ? console.log : () => {},
        progress: this.config.enableProgress ? this.handleProgress.bind(this) : undefined,
      });

      console.log('🔧 Loading FFmpeg...');
      await this.ffmpeg.load();
      console.log('🔧 FFmpeg loaded successfully');
      
      this.isInitialized = true;
      console.log('🔧 AudioConverter initialization completed successfully');
    } catch (error) {
      console.error('❌ FFmpeg initialization failed:', error);
      this.isInitializing = false;
      throw new Error(`Failed to initialize FFmpeg: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isInitializing = false;
    }
  }

  private handleProgress(progress: any): void {
    if (this.progressCallback && progress.ratio !== undefined) {
      this.progressCallback({
        progress: Math.round(progress.ratio * 100),
        time: progress.time || 0,
        duration: progress.duration || 0
      });
    }
  }

  private getConversionSettings(options: ConversionOptions): string[] {
    const settings: string[] = [];

    // Quality presets
    switch (options.quality) {
      case 'low':
        settings.push('-b:a', '64k');
        break;
      case 'medium':
        settings.push('-b:a', '128k');
        break;
      case 'high':
        settings.push('-b:a', '192k');
        break;
    }

    // Custom bitrate override
    if (options.bitrate) {
      settings.push('-b:a', `${options.bitrate}k`);
    }

    // Sample rate
    if (options.sampleRate) {
      settings.push('-ar', options.sampleRate.toString());
    }

    // Channels
    if (options.channels) {
      settings.push('-ac', options.channels.toString());
    }

    // Additional quality settings
    settings.push('-q:a', '2'); // VBR quality
    settings.push('-map_metadata', '0'); // Preserve metadata

    return settings;
  }

  public async convertWebMToMP3(
    webmBlob: Blob,
    options: ConversionOptions = { quality: 'medium' },
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    console.log('🔧 convertWebMToMP3 called with blob size:', webmBlob.size);
    
    // Check if FFmpeg is available
    if (!this.sharedArrayBufferSupported || !this.ffmpeg) {
      console.warn('⚠️ FFmpeg not available, returning original WebM blob');
      // Return the original WebM blob as a fallback
      return {
        mp3Blob: webmBlob,
        duration: 0, // Will be calculated by the caller
        fileSize: webmBlob.size,
        metadata: {
          bitrate: 0,
          sampleRate: 0,
          channels: 0
        }
      };
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.ffmpeg) {
      throw new Error('FFmpeg not initialized');
    }

    this.progressCallback = onProgress;

    try {
      console.log('🔧 Writing input file to FFmpeg...');
      this.ffmpeg.FS('writeFile', 'input.webm', await fetchFile(webmBlob));

      const settings = this.getConversionSettings(options);
      console.log('🔧 Running FFmpeg with settings:', settings);

      // Run FFmpeg with proper input and output file specification
      await this.ffmpeg.run('-i', 'input.webm', ...settings, 'output.mp3');

      console.log('🔧 Reading output file from FFmpeg...');
      const mp3Data = this.ffmpeg.FS('readFile', 'output.mp3');
      const mp3Blob = new Blob([mp3Data.buffer], { type: 'audio/mp3' });

      console.log('🔧 Cleaning up FFmpeg files...');
      this.ffmpeg.FS('unlink', 'input.webm');
      this.ffmpeg.FS('unlink', 'output.mp3');

      const metadata = await this.extractMetadata(mp3Blob);
      const duration = await this.getAudioDuration(mp3Blob);

      console.log('🔧 Conversion completed successfully');
      return {
        mp3Blob,
        duration,
        fileSize: mp3Blob.size,
        metadata
      };
    } catch (error) {
      console.error('❌ Conversion failed:', error);
      throw new Error(`Audio conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractMetadata(mp3Blob: Blob): Promise<any> {
    try {
      const url = URL.createObjectURL(mp3Blob);
      const audio = new Audio(url);
      
      return new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          URL.revokeObjectURL(url);
          resolve({
            duration: audio.duration,
            bitrate: 128, // Default, could be extracted with more complex logic
            sampleRate: 44100, // Default
            channels: 2 // Default
          });
        });
        
        audio.addEventListener('error', () => {
          URL.revokeObjectURL(url);
          resolve({
            duration: 0,
            bitrate: 128,
            sampleRate: 44100,
            channels: 2
          });
        });
      });
    } catch (error) {
      return {
        duration: 0,
        bitrate: 128,
        sampleRate: 44100,
        channels: 2
      };
    }
  }

  private async getAudioDuration(blob: Blob): Promise<number> {
    try {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      return new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          URL.revokeObjectURL(url);
          resolve(audio.duration);
        });
        
        audio.addEventListener('error', () => {
          URL.revokeObjectURL(url);
          resolve(0);
        });
      });
    } catch (error) {
      return 0;
    }
  }

  public async isSupported(): Promise<boolean> {
    console.log('🔧 AudioConverter.isSupported() called');
    console.log('🔧 Current state:', this.getStatus());
    
    try {
      // If SharedArrayBuffer is not supported, return false
      if (!this.sharedArrayBufferSupported) {
        console.log('🔧 SharedArrayBuffer not supported, returning false');
        return false;
      }
      
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      return this.isInitialized && this.ffmpeg !== null;
    } catch (error) {
      console.error('❌ AudioConverter.isSupported() - initialization failed:', error);
      return false;
    }
  }

  public cleanup(): void {
    if (this.ffmpeg) {
      try {
        // FFmpeg cleanup - just set to null since terminate method doesn't exist
        console.log('🔧 Cleaning up FFmpeg instance');
      } catch (error) {
        console.warn('Error during FFmpeg cleanup:', error);
      }
      this.ffmpeg = null;
    }
    this.isInitialized = false;
    this.isInitializing = false;
    this.progressCallback = undefined;
  }

  public getStatus(): {
    isInitialized: boolean;
    isInitializing: boolean;
    ffmpegLoaded: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      ffmpegLoaded: this.ffmpeg !== null
    };
  }
}

// Export singleton instance
export const audioConverter = AudioConverter.getInstance(); 