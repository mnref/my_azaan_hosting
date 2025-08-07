import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, RefreshCw } from 'lucide-react';
import { WebAudioConverter } from '../utils/WebAudioConverter';

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

         // 1. Check Web Audio API support
     const webAudioSupported = typeof window.AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
     diagnosticResults.push({
       name: 'Web Audio API Support',
       status: webAudioSupported ? 'pass' : 'fail',
       message: webAudioSupported ? 'Supported' : 'Not supported',
       details: webAudioSupported 
         ? 'Web Audio API is supported and will be used for audio conversion'
         : 'Web Audio API is required for audio conversion but not supported in your browser'
     });

         // 2. Check HTTPS
     const isHttps = window.location.protocol === 'https:';
     diagnosticResults.push({
       name: 'HTTPS Connection',
       status: isHttps ? 'pass' : 'fail',
       message: isHttps ? 'Secure connection' : 'Not secure',
       details: isHttps 
         ? 'HTTPS is required for Web Audio API and microphone access'
         : 'HTTPS is required for Web Audio API and microphone access. Please use a secure connection.'
     });

         // 3. Check MediaRecorder support
     const mediaRecorderSupported = typeof window.MediaRecorder !== 'undefined';
     diagnosticResults.push({
       name: 'MediaRecorder Support',
       status: mediaRecorderSupported ? 'pass' : 'fail',
       message: mediaRecorderSupported ? 'Supported' : 'Not supported',
       details: mediaRecorderSupported 
         ? 'MediaRecorder API is supported for audio recording and conversion'
         : 'MediaRecorder API is required for audio recording but not supported in your browser'
     });

         // 4. Check AudioContext creation
     try {
       const testContext = new (window.AudioContext || (window as any).webkitAudioContext)();
       await testContext.close();
       diagnosticResults.push({
         name: 'AudioContext Creation',
         status: 'pass',
         message: 'Working',
         details: 'AudioContext can be created and closed successfully'
       });
     } catch (error) {
       diagnosticResults.push({
         name: 'AudioContext Creation',
         status: 'fail',
         message: 'Failed',
         details: `Failed to create AudioContext: ${error instanceof Error ? error.message : 'Unknown error'}`
       });
     }

    // 5. Check WebAudioConverter initialization
    try {
      const converter = WebAudioConverter.getInstance();
      const status = converter.getStatus();
      diagnosticResults.push({
        name: 'WebAudioConverter Status',
        status: status.isInitialized ? 'pass' : 'warning',
        message: status.isInitialized ? 'Initialized' : 'Not initialized',
        details: `Initialized: ${status.isInitialized}, AudioContext created: ${status.audioContextCreated}`
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'WebAudioConverter Status',
        status: 'fail',
        message: 'Failed to check',
        details: `Error checking WebAudioConverter: ${error instanceof Error ? error.message : 'Unknown error'}`
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
     
     const webAudioFailed = results.find(r => r.name === 'Web Audio API Support')?.status === 'fail';
     const httpsFailed = results.find(r => r.name === 'HTTPS Connection')?.status === 'fail';
     const mediaRecorderFailed = results.find(r => r.name === 'MediaRecorder Support')?.status === 'fail';
     const audioContextFailed = results.find(r => r.name === 'AudioContext Creation')?.status === 'fail';

     if (webAudioFailed) {
       solutions.push('• Web Audio API is not supported in your browser. This is required for audio conversion.');
     }
     
     if (httpsFailed) {
       solutions.push('• Use HTTPS instead of HTTP. Web Audio API and microphone access require a secure connection.');
     }
     
     if (mediaRecorderFailed) {
       solutions.push('• MediaRecorder API is not supported in your browser. This is required for audio recording.');
     }

     if (audioContextFailed) {
       solutions.push('• AudioContext creation failed. This may be due to browser restrictions or audio device issues.');
     }

     if (solutions.length === 0) {
       solutions.push('• All checks passed. If audio conversion still doesn\'t work, try refreshing the page or using a different browser.');
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
               Audio Conversion Diagnostic Results
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
                   {overallStatus === 'pass' ? 'Audio conversion should work properly' :
                    overallStatus === 'warning' ? 'Audio conversion may have limited functionality' :
                    'Audio conversion will not work without resolving these issues'}
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