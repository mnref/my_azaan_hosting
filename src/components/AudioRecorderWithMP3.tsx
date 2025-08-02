import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Download, 
  Settings, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Volume2,
  RotateCcw
} from 'lucide-react';
import { useAudioConverter } from '../hooks/useAudioConverter';
import { ConversionOptions, ConversionResult } from '../utils/AudioConverter';

export interface AudioRecorderWithMP3Props {
  onRecordingComplete?: (result: ConversionResult) => void;
  onError?: (error: string) => void;
  maxDuration?: number; // in seconds
  autoConvert?: boolean;
  showSettings?: boolean;
  className?: string;
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
  className = ''
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isInitializing,
    isConverting,
    isReady,
    isSupported,
    error: converterError,
    progress,
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
      resetError();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(webmBlob);

        setRecordingState(prev => ({
          ...prev,
          webmBlob,
          audioUrl,
          isRecording: false
        }));

        // Auto convert to MP3 if enabled
        if (autoConvert && isReady) {
          await convertToMP3(webmBlob);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecordingState(prev => ({ ...prev, isRecording: true, duration: 0 }));

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingState(prev => {
          const newDuration = prev.duration + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return prev;
          }
          return { ...prev, duration: newDuration };
        });
      }, 1000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      onError?.(errorMessage);
      console.error('Recording error:', error);
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

  // Download MP3
  const downloadMP3 = useCallback(() => {
    if (!recordingState.mp3Blob) return;

    const url = URL.createObjectURL(recordingState.mp3Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordingState.mp3Blob]);

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
      {isInitializing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-blue-700">Initializing audio converter...</span>
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
            onClick={recordingState.isRecording ? stopRecording : startRecording}
            disabled={isConverting || isInitializing || !isSupported}
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
            {formatDuration(recordingState.duration)}
          </div>
          <div className="text-sm text-gray-500">
            {recordingState.isRecording ? 'Recording...' : 'Ready to record'}
          </div>
        </div>

        {/* Progress Bar for Conversion */}
        {isConverting && progress && (
          <div className="w-full max-w-md">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Converting to MP3...</span>
              <span>{progress.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Audio Playback */}
        {recordingState.audioUrl && (
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">WebM Recording</span>
              <span className="text-xs text-gray-500">
                {recordingState.webmBlob ? formatFileSize(recordingState.webmBlob.size) : ''}
              </span>
            </div>
            
            <audio
              ref={audioRef}
              src={recordingState.audioUrl}
              className="w-full"
              controls
            />
          </div>
        )}

        {/* MP3 Playback */}
        {recordingState.mp3Url && (
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                MP3 Conversion Complete
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

            <button
              onClick={downloadMP3}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download MP3
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {recordingState.webmBlob && !autoConvert && (
            <button
              onClick={() => convertToMP3(recordingState.webmBlob!)}
              disabled={isConverting || !isReady}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isConverting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              Convert to MP3
            </button>
          )}
          
          {(recordingState.webmBlob || recordingState.mp3Blob) && (
            <button
              onClick={resetRecording}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioRecorderWithMP3; 