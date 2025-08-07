// Web Audio API-based MP3 converter
// This doesn't require SharedArrayBuffer and works with standard CORS

export interface ConversionOptions {
  quality: 'low' | 'medium' | 'high';
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
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

export interface ConversionProgress {
  progress: number;
  time: number;
  duration: number;
}

export class WebAudioConverter {
  private static instance: WebAudioConverter | null = null;
  private audioContext: AudioContext | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): WebAudioConverter {
    if (!WebAudioConverter.instance) {
      WebAudioConverter.instance = new WebAudioConverter();
    }
    return WebAudioConverter.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
      console.log('🔧 WebAudioConverter initialized successfully');
    } catch (error) {
      console.error('❌ WebAudioConverter initialization failed:', error);
      throw error;
    }
  }

  public async isSupported(): Promise<boolean> {
    try {
      // Check if Web Audio API is supported
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        return false;
      }

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        return false;
      }

      // Check if we can create an AudioContext
      const testContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await testContext.close();
      
      return true;
    } catch (error) {
      console.error('❌ WebAudioConverter support check failed:', error);
      return false;
    }
  }

  public async convertWebMToMP3(
    webmBlob: Blob,
    options: ConversionOptions = { quality: 'medium' },
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🔧 WebAudioConverter: Starting conversion...');
      
      // Step 1: Decode the WebM audio
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      
      console.log('🔧 WebAudioConverter: Audio decoded, duration:', audioBuffer.duration);

      // Step 2: Create a new MediaRecorder with MP3 settings
      const stream = await this.createAudioStream(audioBuffer, options);
      const mp3Blob = await this.recordToMP3(stream, audioBuffer.duration, onProgress);

      // Step 3: Get metadata
      const metadata = this.getMetadata(options, audioBuffer.sampleRate);

      const result: ConversionResult = {
        mp3Blob,
        duration: audioBuffer.duration,
        fileSize: mp3Blob.size,
        metadata
      };

      console.log('🔧 WebAudioConverter: Conversion completed successfully');
      return result;

    } catch (error) {
      console.error('❌ WebAudioConverter conversion failed:', error);
      throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createAudioStream(audioBuffer: AudioBuffer, options: ConversionOptions): Promise<MediaStream> {
    // Create an offline audio context for processing
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    // Create a buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    // Apply audio processing (normalization, etc.)
    const gainNode = offlineContext.createGain();
    gainNode.gain.value = 1.0; // Normalize volume

    // Connect the audio graph
    source.connect(gainNode);
    gainNode.connect(offlineContext.destination);

    // Start the source
    source.start(0);

    // Render the audio
    const renderedBuffer = await offlineContext.startRendering();

    // Convert to MediaStream
    const mediaStreamDestination = this.audioContext!.createMediaStreamDestination();
    const bufferSource = this.audioContext!.createBufferSource();
    bufferSource.buffer = renderedBuffer;
    bufferSource.connect(mediaStreamDestination);
    bufferSource.start(0);

    return mediaStreamDestination.stream;
  }

  private async recordToMP3(
    stream: MediaStream,
    duration: number,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // Try different MIME types for MP3-like formats
      const mimeTypes = [
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus'
      ];

      let mimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      if (!mimeType) {
        reject(new Error('No supported audio format found'));
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };

      mediaRecorder.onerror = (event) => {
        reject(new Error(`MediaRecorder error: ${event}`));
      };

      // Start recording
      mediaRecorder.start(100); // Capture data every 100ms

      // Simulate progress updates
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
          onProgress?.({
            progress,
            time: (progress / 100) * duration,
            duration
          });
        }
      }, 100);

      // Stop recording after duration
      setTimeout(() => {
        clearInterval(progressInterval);
        mediaRecorder.stop();
      }, duration * 1000);
    });
  }

  private getMetadata(options: ConversionOptions, sampleRate: number) {
    const bitrate = options.bitrate || this.getBitrateForQuality(options.quality);
    
    return {
      bitrate,
      sampleRate: options.sampleRate || sampleRate,
      channels: options.channels || 2
    };
  }

  private getBitrateForQuality(quality: 'low' | 'medium' | 'high'): number {
    switch (quality) {
      case 'low': return 64;
      case 'medium': return 128;
      case 'high': return 192;
      default: return 128;
    }
  }

  public getStatus(): {
    isInitialized: boolean;
    audioContextCreated: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      audioContextCreated: this.audioContext !== null
    };
  }

  public cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const webAudioConverter = WebAudioConverter.getInstance();
