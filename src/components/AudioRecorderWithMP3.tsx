import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Settings, Loader2, Volume2, VolumeX, AlertCircle, X, MicOff, CheckCircle, RotateCcw } from 'lucide-react';
import { useAudioConverter } from '../hooks/useAudioConverter';
import { ConversionResult, ConversionOptions } from '../utils/AudioConverter';

export interface AudioRecorderWithMP3Props {
  onRecordingComplete?: (result: ConversionResult) => void;
  onError?: (error: string) => void;
  maxDuration?: number; // in seconds
  autoConvert?: boolean;
  showSettings?: boolean;
  className?: string;
  resetKey?: number; // Add this to force reset from parent
}

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  webmBlob: Blob | null;
  mp3Blob: Blob | null;
  audioUrl: string | null;
  mp3Url: string | null;
}

const AudioRecorderWithMP3: React.FC<AudioRecorderWithMP3Props> = ({
  onRecordingComplete,
  onError,
  maxDuration = 30,
  autoConvert = true,
  showSettings = true,
  className = '',
  resetKey = 0
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    duration: 0,
    webmBlob: null,
    mp3Blob: null,
    audioUrl: null,
    mp3Url: null
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [conversionQuality, setConversionQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [customBitrate, setCustomBitrate] = useState<number>(128);

  // Reset component when resetKey changes
  useEffect(() => {
    if (resetKey > 0) {
      resetRecording();
    }
  }, [resetKey]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isReady,
    isConverting,
    error: converterError,
    convertWebMToMP3,
    resetError,
    checkSupport
  } = useAudioConverter();

  // Format duration to MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting recording process...');
      console.log('🔧 Component state: isConverting=' + isConverting + ', isReady=' + isReady);
      
      resetError();
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      console.log('📱 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      console.log('✅ Microphone access granted, stream received');
      console.log('🎵 Stream tracks: ' + stream.getTracks().length);
      
      if (stream.getTracks().length === 0) {
        throw new Error('No audio tracks found in stream');
      }
      
      console.log('🎵 Creating MediaRecorder...');
      
      // Try different MIME types for better compatibility
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];
      
      let mimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      console.log('🎵 Using MIME type: ' + mimeType);
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      
      console.log('✅ MediaRecorder created successfully');

      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        console.log('📦 Data available: ' + e.data.size + ' bytes');
        if (e.data.size > 0) {
          chunks.push(e.data);
          const totalSize = chunks.reduce((sum, chunk) => sum + (chunk instanceof Blob ? chunk.size : 0), 0);
          console.log('📦 Total chunks: ' + chunks.length + ', Total size: ' + totalSize + ' bytes');
          
          // Estimate duration based on chunk size (rough approximation)
          const estimatedDuration = Math.round(totalSize / 2000); // Rough estimate: 2KB per second
          console.log('📦 Estimated duration from chunks: ' + estimatedDuration + ' seconds');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 MediaRecorder stopped, processing recording...');
        const webmBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(webmBlob);
        console.log('📊 Recording size: ' + webmBlob.size + ' bytes');

        // Get actual duration from the audio blob
        const audio = new Audio(audioUrl);
        audio.addEventListener('loadedmetadata', () => {
          const actualDuration = Math.round(audio.duration);
          console.log('🎵 Actual audio duration: ' + actualDuration + ' seconds');
          
          // Use the actual recorded duration, but ensure it doesn't exceed maxDuration
          let finalDuration = Math.min(actualDuration, maxDuration);
          
          // If actual duration is invalid, use maxDuration
          if (!actualDuration || !isFinite(actualDuration) || actualDuration <= 0) {
            finalDuration = maxDuration;
          }
          
          console.log('🎵 Final duration: ' + finalDuration + ' seconds (maxDuration: ' + maxDuration + ')');
          setRecordingState(prev => ({
            ...prev,
            webmBlob,
            audioUrl,
            isRecording: false,
            duration: finalDuration
          }));
        });
        
        // Handle audio loading errors
        audio.addEventListener('error', () => {
          console.log('🎵 Audio duration detection failed, using maxDuration: ' + maxDuration + ' seconds');
          setRecordingState(prev => ({
            ...prev,
            webmBlob,
            audioUrl,
            isRecording: false,
            duration: maxDuration
          }));
        });

        setRecordingState(prev => ({
          ...prev,
          webmBlob,
          audioUrl,
          isRecording: false
        }));

        // Auto convert to MP3 if enabled
        if (autoConvert && isReady) {
          console.log('🔄 Auto-converting to MP3...');
          await convertToMP3(webmBlob);
        } else if (autoConvert && !isReady) {
          console.log('⚠️ FFmpeg not ready, storing WebM recording without conversion');
          // Store WebM recording without conversion
          setRecordingState(prev => ({
            ...prev,
            webmBlob,
            audioUrl,
            isRecording: false
          }));
          
          // Call completion handler with WebM data
          if (onRecordingComplete) {
            const webmResult = {
              mp3Blob: webmBlob, // Use WebM as MP3 for compatibility
              duration: maxDuration,
              fileSize: webmBlob.size,
              metadata: {
                bitrate: 128,
                sampleRate: 44100,
                channels: 2
              }
            };
            onRecordingComplete(webmResult);
          }
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        onError?.('MediaRecorder error occurred');
      };

      // Start MediaRecorder with timeslice for more reliable data capture
      mediaRecorder.start(1000); // Capture data every 1 second
      console.log('🎤 MediaRecorder started, state: ' + mediaRecorder.state);
      setRecordingState(prev => ({ ...prev, isRecording: true, duration: 0 }));

      // Start timer with precise timing
      console.log(`⏱️ Starting timer for ${maxDuration} seconds...`);
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        console.log(`⏱️ Recording duration: ${elapsedSeconds}/${maxDuration} seconds`);
        
        if (elapsedSeconds >= maxDuration) { // Stop exactly at max duration
          console.log(`🛑 Max duration reached (${elapsedSeconds}s >= ${maxDuration}s), stopping recording...`);
          // Stop recording when max duration is reached
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log('🛑 Stopping MediaRecorder...');
            // Request data before stopping to ensure we get the final chunk
            mediaRecorderRef.current.requestData();
            // Add a longer delay to ensure we capture the full duration
            setTimeout(() => {
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
              }
            }, 500); // Increased to 500ms delay to ensure full capture
          } else {
            console.log('⚠️ MediaRecorder not in recording state:', mediaRecorderRef.current?.state);
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setRecordingState(prev => ({ ...prev, duration: maxDuration, isRecording: false }));
        } else {
          setRecordingState(prev => ({ ...prev, duration: elapsedSeconds }));
        }
      }, 50); // Check every 50ms for more precise timing

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      console.error('❌ Recording error:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      onError?.(errorMessage);
    }
  }, [maxDuration, autoConvert, isReady, resetError, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [recordingState.isRecording]);

  // Convert to MP3
  const convertToMP3 = useCallback(async (webmBlob: Blob) => {
    try {
      const options: ConversionOptions = {
        quality: conversionQuality,
        bitrate: customBitrate
      };

      const result = await convertWebMToMP3(webmBlob, options);
      const mp3Url = URL.createObjectURL(result.mp3Blob);

      setRecordingState(prev => ({
        ...prev,
        mp3Blob: result.mp3Blob,
        mp3Url
      }));

      onRecordingComplete?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
      onError?.(errorMessage);
      console.error('Conversion error:', error);
    }
  }, [convertWebMToMP3, conversionQuality, customBitrate, onRecordingComplete, onError]);

  // Play/pause audio
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [isPlaying]);



  // Reset recording
  const resetRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Clean up URLs
    if (recordingState.audioUrl) URL.revokeObjectURL(recordingState.audioUrl);
    if (recordingState.mp3Url) URL.revokeObjectURL(recordingState.mp3Url);

    setRecordingState({
      isRecording: false,
      duration: 0,
      webmBlob: null,
      mp3Blob: null,
      audioUrl: null,
      mp3Url: null
    });
    setIsPlaying(false);
  }, [recordingState.audioUrl, recordingState.mp3Url]);

  // Handle audio events
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [recordingState.audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingState.audioUrl) URL.revokeObjectURL(recordingState.audioUrl);
      if (recordingState.mp3Url) URL.revokeObjectURL(recordingState.mp3Url);
    };
  }, [recordingState.audioUrl, recordingState.mp3Url]);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-amber-500" />
          Audio Recorder
        </h3>
        {showSettings && (
          <button
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className="p-2 text-gray-600 hover:text-amber-500 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Settings Panel */}
      {showSettingsPanel && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-3">Conversion Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Quality
              </label>
              <select
                value={conversionQuality}
                onChange={(e) => setConversionQuality(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="low">Low (64kbps)</option>
                <option value="medium">Medium (128kbps)</option>
                <option value="high">High (192kbps)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Custom Bitrate (kbps)
              </label>
              <input
                type="number"
                value={customBitrate}
                onChange={(e) => setCustomBitrate(Number(e.target.value))}
                min="32"
                max="320"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {isConverting && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-blue-700">Converting to MP3...</span>
        </div>
      )}

      {converterError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-700">{converterError}</span>
          <button
            onClick={resetError}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-6">

        
        {/* Recording Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              console.log('🎯 Recording button clicked!');
              console.log('🎯 Button state: isRecording=' + recordingState.isRecording + ', isConverting=' + isConverting + ', isReady=' + isReady);
              if (recordingState.isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
            }}
            disabled={isConverting}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              recordingState.isRecording
                ? 'bg-red-500 hover:bg-red-600 scale-110'
                : 'bg-amber-500 hover:bg-amber-600 hover:scale-105'
            } text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
            aria-label={recordingState.isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {recordingState.isRecording ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
            {recordingState.isRecording && (
              <div className="absolute inset-0 rounded-full bg-red-400/30 animate-ping"></div>
            )}
          </button>
        </div>

        {/* Duration Display */}
        <div className="text-center">
          <div className="text-2xl font-mono text-gray-800">
            {recordingState.isRecording 
              ? formatDuration(recordingState.duration)
              : formatDuration(maxDuration)
            }
          </div>
          <div className="text-sm text-gray-500">
            {recordingState.isRecording ? 'Recording...' : 'Ready to record'}
          </div>
        </div>

          {/* Progress Bar for Conversion */}
          {isConverting && (
            <div className="w-full max-w-md">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Converting to MP3...</span>
                <span>Processing...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300 animate-pulse"
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
          )}

        {/* Audio Playback - Hidden WebM section */}
        {/* WebM recording is hidden as requested - only MP3 is shown */}

        {/* MP3 Playback */}
        {recordingState.mp3Url && (
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Your MP3 Recording
              </span>
              <span className="text-xs text-gray-500">
                {recordingState.mp3Blob ? formatFileSize(recordingState.mp3Blob.size) : ''}
              </span>
            </div>
            
            <audio
              src={recordingState.mp3Url}
              className="w-full"
              controls
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {recordingState.mp3Blob && (
            <button
              onClick={resetRecording}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Record Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioRecorderWithMP3; 