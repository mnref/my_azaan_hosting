import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, RefreshCw } from 'lucide-react';
import { AudioConverter } from '../utils/AudioConverter';

interface FFmpegDiagnosticProps {
  onClose: () => void;
}

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

const FFmpegDiagnostic: React.FC<FFmpegDiagnosticProps> = ({ onClose }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'pass' | 'fail' | 'warning'>('fail');

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // 1. Check SharedArrayBuffer support
    const sharedArrayBufferSupported = typeof SharedArrayBuffer !== 'undefined';
    diagnosticResults.push({
      name: 'SharedArrayBuffer Support',
      status: sharedArrayBufferSupported ? 'pass' : 'fail',
      message: sharedArrayBufferSupported ? 'Supported' : 'Not supported',
      details: sharedArrayBufferSupported 
        ? 'Your browser supports SharedArrayBuffer, which is required for FFmpeg.wasm'
        : 'SharedArrayBuffer is required for FFmpeg.wasm but not supported in your browser. This is the main reason MP3 conversion is not working.'
    });

    // 2. Check HTTPS
    const isHttps = window.location.protocol === 'https:';
    diagnosticResults.push({
      name: 'HTTPS Connection',
      status: isHttps ? 'pass' : 'fail',
      message: isHttps ? 'Secure connection' : 'Not secure',
      details: isHttps 
        ? 'HTTPS is required for SharedArrayBuffer and FFmpeg.wasm'
        : 'SharedArrayBuffer requires HTTPS. Please use a secure connection.'
    });

    // 3. Check Cross-Origin Isolation headers
    const crossOriginIsolated = (self as any).crossOriginIsolated;
    diagnosticResults.push({
      name: 'Cross-Origin Isolation',
      status: crossOriginIsolated ? 'pass' : 'fail',
      message: crossOriginIsolated ? 'Enabled' : 'Not enabled',
      details: crossOriginIsolated 
        ? 'Cross-origin isolation is enabled, allowing SharedArrayBuffer'
        : 'Cross-origin isolation headers are required for SharedArrayBuffer. This needs to be configured on the server.'
    });

    // 4. Check FFmpeg.wasm availability
    try {
      const { createFFmpeg } = await import('@ffmpeg/ffmpeg');
      diagnosticResults.push({
        name: 'FFmpeg.wasm Library',
        status: 'pass',
        message: 'Available',
        details: 'FFmpeg.wasm library is loaded successfully'
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'FFmpeg.wasm Library',
        status: 'fail',
        message: 'Not available',
        details: `Failed to load FFmpeg.wasm: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // 5. Check AudioConverter initialization
    try {
      const converter = AudioConverter.getInstance();
      const status = converter.getStatus();
      diagnosticResults.push({
        name: 'AudioConverter Status',
        status: status.isInitialized ? 'pass' : 'warning',
        message: status.isInitialized ? 'Initialized' : 'Not initialized',
        details: `Initialized: ${status.isInitialized}, Initializing: ${status.isInitializing}, FFmpeg loaded: ${status.ffmpegLoaded}`
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'AudioConverter Status',
        status: 'fail',
        message: 'Failed to check',
        details: `Error checking AudioConverter: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // 6. Check browser compatibility
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isEdge = /Edge/.test(userAgent);
    
    let browserStatus: 'pass' | 'fail' | 'warning' = 'warning';
    let browserMessage = 'Unknown browser';
    
    if (isChrome) {
      browserStatus = 'pass';
      browserMessage = 'Chrome (Good support)';
    } else if (isFirefox) {
      browserStatus = 'pass';
      browserMessage = 'Firefox (Good support)';
    } else if (isSafari) {
      browserStatus = 'warning';
      browserMessage = 'Safari (Limited support)';
    } else if (isEdge) {
      browserStatus = 'pass';
      browserMessage = 'Edge (Good support)';
    }

    diagnosticResults.push({
      name: 'Browser Compatibility',
      status: browserStatus,
      message: browserMessage,
      details: `User Agent: ${userAgent}`
    });

    setResults(diagnosticResults);

    // Determine overall status
    const hasFailures = diagnosticResults.some(r => r.status === 'fail');
    const hasWarnings = diagnosticResults.some(r => r.status === 'warning');
    
    if (hasFailures) {
      setOverallStatus('fail');
    } else if (hasWarnings) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('pass');
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return 'border-green-200 bg-green-50';
      case 'fail':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const getSolutions = () => {
    const solutions: string[] = [];
    
    const sharedArrayBufferFailed = results.find(r => r.name === 'SharedArrayBuffer Support')?.status === 'fail';
    const httpsFailed = results.find(r => r.name === 'HTTPS Connection')?.status === 'fail';
    const crossOriginFailed = results.find(r => r.name === 'Cross-Origin Isolation')?.status === 'fail';

    if (sharedArrayBufferFailed) {
      solutions.push('• SharedArrayBuffer is not supported in your browser. This is the main issue preventing MP3 conversion.');
    }
    
    if (httpsFailed) {
      solutions.push('• Use HTTPS instead of HTTP. SharedArrayBuffer requires a secure connection.');
    }
    
    if (crossOriginFailed) {
      solutions.push('• The server needs to send Cross-Origin Isolation headers (Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy).');
    }

    if (solutions.length === 0) {
      solutions.push('• All checks passed. If MP3 conversion still doesn\'t work, try refreshing the page or using a different browser.');
    }

    return solutions;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Info className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-semibold text-gray-900">
              FFmpeg Diagnostic Results
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
          {/* Overall Status */}
          <div className={`mb-6 p-4 rounded-lg border ${getStatusColor(overallStatus)}`}>
            <div className="flex items-center space-x-3">
              {getStatusIcon(overallStatus)}
              <div>
                <h4 className="font-semibold">
                  {overallStatus === 'pass' ? 'All Systems Operational' :
                   overallStatus === 'warning' ? 'Some Issues Detected' :
                   'Critical Issues Found'}
                </h4>
                <p className="text-sm text-gray-600">
                  {overallStatus === 'pass' ? 'FFmpeg should work properly' :
                   overallStatus === 'warning' ? 'FFmpeg may have limited functionality' :
                   'FFmpeg will not work without resolving these issues'}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Results */}
          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-gray-900">Diagnostic Results:</h4>
            {results.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}>
                <div className="flex items-start space-x-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{result.name}</h5>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-gray-500 mt-2">{result.details}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Solutions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Solutions:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              {getSolutions().map((solution, index) => (
                <li key={index}>{solution}</li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Run Diagnostics Again'}</span>
            </button>
            
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FFmpegDiagnostic; 