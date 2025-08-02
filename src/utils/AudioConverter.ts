import { createFFmpeg, fetchFile, FFmpeg } from '@ffmpeg/ffmpeg';

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
  private ffmpeg: FFmpeg | null = null;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private config: AudioConverterConfig;
  private progressCallback?: (progress: ConversionProgress) => void;

  private constructor(config: AudioConverterConfig = {}) {
    this.config = {
      ffmpegCorePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
      logLevel: 'error',
      enableProgress: true,
      ...config
    };
  }

  public static getInstance(config?: AudioConverterConfig): AudioConverter {
    if (!AudioConverter.instance) {
      AudioConverter.instance = new AudioConverter(config);
    }
    return AudioConverter.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.isInitializing) {
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.isInitializing = true;

    try {
      this.ffmpeg = createFFmpeg({
        corePath: this.config.ffmpegCorePath,
        log: this.config.logLevel === 'debug',
        logger: this.config.logLevel === 'debug' ? console.log : () => {},
        progress: this.config.enableProgress ? this.handleProgress.bind(this) : undefined,
      });

      await this.ffmpeg.load();
      this.isInitialized = true;
    } catch (error) {
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
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.ffmpeg) {
      throw new Error('FFmpeg not initialized');
    }

    this.progressCallback = onProgress;

    try {
      // Generate unique filenames
      const inputFileName = `input_${Date.now()}.webm`;
      const outputFileName = `output_${Date.now()}.mp3`;

      // Write input file to FFmpeg virtual filesystem
      const inputData = await webmBlob.arrayBuffer();
      this.ffmpeg.FS('writeFile', inputFileName, new Uint8Array(inputData));

      // Prepare FFmpeg command
      const conversionSettings = this.getConversionSettings(options);
      const command = [
        '-i', inputFileName,
        ...conversionSettings,
        outputFileName
      ];

      // Execute conversion
      await this.ffmpeg.run(...command);

      // Read output file
      const outputData = this.ffmpeg.FS('readFile', outputFileName);
      const mp3Blob = new Blob([outputData.buffer], { type: 'audio/mp3' });

      // Clean up files
      this.ffmpeg.FS('unlink', inputFileName);
      this.ffmpeg.FS('unlink', outputFileName);

      // Get metadata
      const metadata = await this.extractMetadata(mp3Blob);

      return {
        mp3Blob,
        duration: metadata.duration || 0,
        fileSize: mp3Blob.size,
        metadata: {
          bitrate: metadata.bitrate || 128,
          sampleRate: metadata.sampleRate || 44100,
          channels: metadata.channels || 2
        }
      };

    } catch (error) {
      throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.progressCallback = undefined;
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

  public async isSupported(): Promise<boolean> {
    try {
      await this.initialize();
      return true;
    } catch (error) {
      return false;
    }
  }

  public cleanup(): void {
    if (this.ffmpeg) {
      try {
        // Check if terminate method exists before calling it
        if (typeof this.ffmpeg.terminate === 'function') {
          this.ffmpeg.terminate();
        }
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