import React from 'react';
import { Mic, MicOff, Settings, RefreshCw } from 'lucide-react';

interface MicrophonePermissionHelperProps {
  error: string;
  onRetry: () => void;
  onClose: () => void;
}

const MicrophonePermissionHelper: React.FC<MicrophonePermissionHelperProps> = ({
  error,
  onRetry,
  onClose
}) => {
  const getInstructions = () => {
    if (error.includes('denied') || error.includes('NotAllowedError')) {
      return {
        title: 'Microphone Access Denied',
        icon: <MicOff className="w-8 h-8 text-red-500" />,
        steps: [
          'Click the microphone icon in your browser\'s address bar',
          'Select "Allow" for microphone access',
          'Refresh the page and try again',
          'If you don\'t see the icon, check your browser settings'
        ]
      };
    } else if (error.includes('NotFoundError')) {
      return {
        title: 'No Microphone Found',
        icon: <MicOff className="w-8 h-8 text-orange-500" />,
        steps: [
          'Connect a microphone to your device',
          'Make sure it\'s properly connected and working',
          'Check if other applications can use the microphone',
          'Try refreshing the page'
        ]
      };
    } else if (error.includes('SecurityError')) {
      return {
        title: 'Security Policy Blocked Access',
        icon: <Settings className="w-8 h-8 text-yellow-500" />,
        steps: [
          'Make sure you\'re using HTTPS (secure connection)',
          'Check if your browser blocks microphone access',
          'Try using a different browser',
          'Contact your system administrator if needed'
        ]
      };
    } else {
      return {
        title: 'Microphone Access Issue',
        icon: <Mic className="w-8 h-8 text-gray-500" />,
        steps: [
          'Check your browser\'s microphone permissions',
          'Make sure no other apps are using the microphone',
          'Try refreshing the page',
          'If the problem persists, try a different browser'
        ]
      };
    }
  };

  const instructions = getInstructions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {instructions.icon}
            <h3 className="text-lg font-semibold text-gray-900">
              {instructions.title}
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

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            To use the audio recording feature, we need access to your microphone. Here's how to fix this:
          </p>
          
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            {instructions.steps.map((step, index) => (
              <li key={index} className="pl-2">{step}</li>
            ))}
          </ol>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onRetry}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> This app requires microphone access to record your voice for pronunciation analysis. 
            Your audio is processed locally and securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MicrophonePermissionHelper; 