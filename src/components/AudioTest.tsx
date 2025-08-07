import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, AlertTriangle, CheckCircle } from 'lucide-react';

interface AudioTestProps {
  audioUrl: string;
  onClose: () => void;
}

const AudioTest: React.FC<AudioTestProps> = ({ audioUrl, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    canLoad: boolean;
    canPlay: boolean;
    corsSupported: boolean;
  }>({
    canLoad: false,
    canPlay: false,
    corsSupported: false
  });

  useEffect(() => {
    testAudioUrl();
  }, [audioUrl]);

  const testAudioUrl = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing audio URL:', audioUrl);
      
      // Test 1: Check if URL is accessible
      const response = await fetch(audioUrl, { 
        method: 'HEAD',
        mode: 'cors'
      });
      
      console.log('🧪 HEAD request response:', response.status, response.statusText);
      
      if (response.ok) {
        setTestResults(prev => ({ ...prev, canLoad: true }));
        console.log('✅ Audio URL is accessible');
      } else {
        setError(`Failed to load audio: ${response.status} ${response.statusText}`);
        console.error('❌ Audio URL not accessible:', response.status, response.statusText);
      }
      
      // Test 2: Check CORS headers
      const corsHeader = response.headers.get('Access-Control-Allow-Origin');
      const corsSupported = corsHeader === '*' || corsHeader === window.location.origin;
      setTestResults(prev => ({ ...prev, corsSupported }));
      
      console.log('🧪 CORS headers:', {
        'Access-Control-Allow-Origin': corsHeader,
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        corsSupported
      });
      
    } catch (error) {
      console.error('❌ Audio test failed:', error);
      setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    const audio = new Audio(audioUrl);
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setTestResults(prev => ({ ...prev, canPlay: true }));
          console.log('✅ Audio playback started successfully');
        })
        .catch((error) => {
          console.error('❌ Audio playback failed:', error);
          setError(`Playback error: ${error.message}`);
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Volume2 className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-semibold text-gray-900">
              Audio Test Results
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* URL Display */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Audio URL:</label>
            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 break-all">
              {audioUrl}
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3">
              {testResults.canLoad ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm">
                URL Accessible: {testResults.canLoad ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              {testResults.corsSupported ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm">
                CORS Supported: {testResults.corsSupported ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              {testResults.canPlay ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              <span className="text-sm">
                Can Play: {testResults.canPlay ? 'Yes' : 'Not Tested'}
              </span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={testAudioUrl}
              disabled={isLoading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Again'}
            </button>
            
            <button
              onClick={handlePlayPause}
              disabled={!testResults.canLoad || isLoading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Stop' : 'Play'}</span>
            </button>
          </div>

          {/* Recommendations */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Recommendations:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {!testResults.canLoad && (
                <li>• Check if the Firebase Storage URL is correct</li>
              )}
              {!testResults.corsSupported && (
                <li>• Configure CORS headers on Firebase Storage</li>
              )}
              {testResults.canLoad && testResults.corsSupported && !testResults.canPlay && (
                <li>• Try playing the audio to test playback</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioTest;
