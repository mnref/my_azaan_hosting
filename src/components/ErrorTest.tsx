import React, { useState } from 'react';
import AudioRecorderWithMP3 from './AudioRecorderWithMP3';
import { ConversionResult } from '../utils/AudioConverter';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

const ErrorTest: React.FC = () => {
  const [testResults, setTestResults] = useState<ConversionResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleRecordingComplete = (result: ConversionResult) => {
    setTestResults(prev => [...prev, result]);
    console.log('✅ MP3 conversion successful:', result);
  };

  const handleError = (error: string) => {
    setErrors(prev => [...prev, error]);
    console.error('❌ Error occurred:', error);
  };

  const clearResults = () => {
    setTestResults([]);
    setErrors([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-semibold text-blue-800">Error Fix Test</h2>
        </div>
        <p className="text-blue-700 text-sm">
          This component tests if the FFmpeg cleanup and CORS errors are fixed.
        </p>
      </div>

      {/* Audio Recorder */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Test MP3 Recording</h3>
        <AudioRecorderWithMP3
          onRecordingComplete={handleRecordingComplete}
          onError={handleError}
          maxDuration={5}
          autoConvert={true}
          showSettings={false}
        />
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">✅ Successful Tests</h3>
            <button
              onClick={clearResults}
              className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-md transition-colors"
            >
              Clear Results
            </button>
          </div>
          
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-green-800">Test {index + 1} - MP3 Conversion Successful</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Duration:</span>
                    <span className="ml-2 text-gray-800">{result.duration.toFixed(2)}s</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">File Size:</span>
                    <span className="ml-2 text-gray-800">
                      {(result.fileSize / 1024).toFixed(2)} KB
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Bitrate:</span>
                    <span className="ml-2 text-gray-800">{result.metadata.bitrate} kbps</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">❌ Test Errors</h3>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-800 mb-2">Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-amber-700">
          <li>Click the microphone button to start recording</li>
          <li>Speak for 5 seconds (recording will auto-stop)</li>
          <li>Wait for MP3 conversion to complete</li>
          <li>Check console for any FFmpeg cleanup errors</li>
          <li>Verify MP3 file appears in results</li>
          <li>Test multiple recordings to ensure no memory leaks</li>
        </ol>
      </div>
    </div>
  );
};

export default ErrorTest; 