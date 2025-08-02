import React, { useState, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { storage, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import AudioRecorderWithMP3 from './AudioRecorderWithMP3';
import { ConversionResult } from '../utils/AudioConverter';
import { CheckCircle, AlertCircle, Upload, Loader2 } from 'lucide-react';

interface AudioRecorderIntegrationProps {
  phraseId: number;
  onUploadComplete?: (downloadUrl: string) => void;
  onError?: (error: string) => void;
}

const AudioRecorderIntegration: React.FC<AudioRecorderIntegrationProps> = ({
  phraseId,
  onUploadComplete,
  onError
}) => {
  const { currentUser } = useAuth();
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRecordingComplete = useCallback(async (result: ConversionResult) => {
    if (!currentUser) {
      const error = 'User not authenticated';
      setErrorMessage(error);
      onError?.(error);
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      setErrorMessage(null);

      // Create unique filename
      const timestamp = Date.now();
      const filename = `recording_${currentUser.uid}_phrase${phraseId}_${timestamp}.mp3`;
      const storageRef = ref(storage, `recordings/${currentUser.uid}/${filename}`);

      // Upload to Firebase Storage
      const uploadTask = uploadBytes(storageRef, result.mp3Blob);
      
      // Simulate progress (Firebase Storage doesn't provide progress for uploadBytes)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await uploadTask;
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Get download URL
      const url = await getDownloadURL(storageRef);
      setDownloadUrl(url);

      // Update user progress in Firestore
      const userRef = doc(db, 'User', currentUser.uid);
      await updateDoc(userRef, {
        [`phrase${phraseId}`]: true,
        [`recording${phraseId}`]: url,
        [`recording${phraseId}Size`]: result.fileSize,
        [`recording${phraseId}Duration`]: result.duration,
        [`recording${phraseId}Timestamp`]: new Date(),
        analysis: increment(1)
      });

      setUploadStatus('success');
      onUploadComplete?.(url);

    } catch (error) {
      setUploadStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
      console.error('Upload error:', error);
    }
  }, [currentUser, phraseId, onUploadComplete, onError]);

  const handleError = useCallback((error: string) => {
    setErrorMessage(error);
    setUploadStatus('error');
    onError?.(error);
  }, [onError]);

  const resetUpload = useCallback(() => {
    setUploadStatus('idle');
    setUploadProgress(0);
    setDownloadUrl(null);
    setErrorMessage(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Audio Recorder Component */}
      <AudioRecorderWithMP3
        onRecordingComplete={handleRecordingComplete}
        onError={handleError}
        maxDuration={30}
        autoConvert={true}
        showSettings={true}
        className="mb-6"
      />

      {/* Upload Status */}
      {uploadStatus === 'uploading' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-blue-700 font-medium">Uploading to Firebase Storage...</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="text-sm text-blue-600 mt-2">{uploadProgress}% complete</div>
        </div>
      )}

      {/* Success Status */}
      {uploadStatus === 'success' && downloadUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 font-medium">Upload Successful!</span>
          </div>
          <div className="text-sm text-green-600 mb-3">
            Your recording has been saved and is ready for analysis.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.open(downloadUrl, '_blank')}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md transition-colors flex items-center gap-1"
            >
              <Upload className="w-4 h-4" />
              View File
            </button>
            <button
              onClick={resetUpload}
              className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-md transition-colors"
            >
              Record Again
            </button>
          </div>
        </div>
      )}

      {/* Error Status */}
      {uploadStatus === 'error' && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 font-medium">Upload Failed</span>
          </div>
          <div className="text-sm text-red-600 mb-3">{errorMessage}</div>
          <button
            onClick={resetUpload}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioRecorderIntegration; 