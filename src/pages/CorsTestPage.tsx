import React, { useState } from 'react';
import { createBlobUrlFromFirebase, isFirebaseStorageUrl } from '../utils/proxyHelper';
import { CheckCircle, AlertCircle, Info, Download } from 'lucide-react';

const CorsTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    url: string;
    success: boolean;
    blobUrl?: string;
    error?: string;
  }[]>([]);
  const [loading, setLoading] = useState(false);

  // Test URLs from your console errors
  const testUrls = [
    'https://firebasestorage.googleapis.com/v0/b/azaan-app-41cac.firebasestorage.app/o/azaans%2Fqari_part_1.mp3?alt=media&token=237d4e6a-c2f9-464a-bf4d-35a2b15283f0',
    'https://storage.googleapis.com/azaan_feedbackaudio/feedback_audio/2025/08/02/takbeer_1_be47e40b-8d27-44e0-a3aa-a98c1a76a0d2.mp3?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=azaan-training%40azaan-app-41cac.iam.gserviceaccount.com%2F20250802%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250802T084908Z&X-Goog-Expires=1799&X-Goog-SignedHeaders=host&X-Goog-Signature=c3aa1f1c28a6f93eb462b805af8c6508f665174cdba0110c88772a5efb51765eb967a5321b0044e796b9ced9e411f79ba190dee17cf6655547c9405cc45c8a453fdf34905909cf9b92ed49aff5462a0527185a27975ddb2f86c8ddb238ec6c5d24cada2d0f45c10d95f928f465ced4724786f21620977c30228a9dca8d58da84d9c816762845a55b03298b5d16a43c96f78d111927dcc49db9fe09c6e2d49319e92bc4a692cba10c73bd57b5dc753665655ef832d516471dfc284055b1a1ea8eb15cfa042dc5940c56107cf54b616bc5a3b3848d894895c0396986e20f23ac2b87a823083c89b2bbcd1a7f8bfdbf9f8e5cdeaf9d99e98f10045fd7595eab9f20'
  ];

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    for (const url of testUrls) {
      try {
        console.log(`Testing URL: ${url}`);
        
        if (isFirebaseStorageUrl(url)) {
          const blobUrl = await createBlobUrlFromFirebase(url);
          setTestResults(prev => [...prev, {
            url,
            success: true,
            blobUrl
          }]);
          console.log('✅ Success:', blobUrl);
        } else {
          setTestResults(prev => [...prev, {
            url,
            success: false,
            error: 'Not a Firebase Storage URL'
          }]);
        }
      } catch (error) {
        console.error('❌ Error:', error);
        setTestResults(prev => [...prev, {
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }]);
      }
    }

    setLoading(false);
  };

  const clearResults = () => {
    // Cleanup blob URLs
    testResults.forEach(result => {
      if (result.blobUrl) {
        URL.revokeObjectURL(result.blobUrl);
      }
    });
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-semibold text-blue-800">CORS Fix Test</h2>
        </div>
        <p className="text-blue-700 text-sm">
          This page tests if the CORS proxy solution works for Firebase Storage URLs.
        </p>
      </div>

      {/* Test Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Test Controls</h3>
          <div className="flex gap-2">
            <button
              onClick={runTests}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Testing...' : 'Run CORS Tests'}
            </button>
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Clear Results
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>This will test the following URLs from your console errors:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {testUrls.map((url, index) => (
              <li key={index} className="text-xs break-all">
                {url.substring(0, 80)}...
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Results</h3>
          
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                result.success 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Test {index + 1} - {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium text-gray-600">URL:</span>
                    <span className="ml-2 text-gray-800 break-all text-xs">
                      {result.url.substring(0, 100)}...
                    </span>
                  </div>
                  
                  {result.success && result.blobUrl && (
                    <div>
                      <span className="font-medium text-gray-600">Blob URL:</span>
                      <span className="ml-2 text-gray-800 break-all text-xs">
                        {result.blobUrl}
                      </span>
                      <div className="mt-2">
                        <audio controls src={result.blobUrl} className="w-full max-w-md" />
                      </div>
                    </div>
                  )}
                  
                  {!result.success && result.error && (
                    <div>
                      <span className="font-medium text-gray-600">Error:</span>
                      <span className="ml-2 text-red-700">{result.error}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Summary: {testResults.filter(r => r.success).length} / {testResults.length} successful
              </span>
              <span className={`text-sm font-medium ${
                testResults.every(r => r.success) ? 'text-green-600' : 'text-red-600'
              }`}>
                {testResults.every(r => r.success) ? '✅ All tests passed' : '❌ Some tests failed'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-800 mb-2">Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-amber-700">
          <li>Click "Run CORS Tests" to test Firebase Storage URLs</li>
          <li>Check if blob URLs are created successfully</li>
          <li>Test audio playback for successful conversions</li>
          <li>Check console for detailed error messages</li>
          <li>If all tests pass, the CORS fix is working</li>
        </ol>
      </div>
    </div>
  );
};

export default CorsTestPage; 