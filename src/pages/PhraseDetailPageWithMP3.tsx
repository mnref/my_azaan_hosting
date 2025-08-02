import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { phrasesData } from '../data/phrasesData';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { doc, updateDoc, getDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import AudioWaveform from '../components/AudioWaveform';
import Header from '../components/Header';
import AudioRecorderIntegration from '../components/AudioRecorderIntegration';
import { ConversionResult } from '../utils/AudioConverter';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const PhraseDetailPageWithMP3: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [waveformUrl, setWaveformUrl] = useState<string | null>(null);
  const [validationFeedback, setValidationFeedback] = useState<string | null>(null);
  const [feedbackUrdu, setFeedbackUrdu] = useState<string | null>(null);
  const [showMP3Recorder, setShowMP3Recorder] = useState(false);

  const phrase = phrasesData.find(p => p.id === Number(id));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleUploadComplete = useCallback(async (downloadUrl: string) => {
    // The upload is already handled in AudioRecorderIntegration
    // This callback can be used for additional actions
    console.log('Upload completed:', downloadUrl);
  }, []);

  const handleRecordingError = useCallback((error: string) => {
    console.error('Recording error:', error);
    setAnalyzeMessage(`Recording error: ${error}`);
  }, []);

  const handleAnalyze = async () => {
    if (!currentUser) {
      setAnalyzeMessage('Please log in to analyze your recording.');
      return;
    }

    setAnalyzeLoading(true);
    setAnalyzeMessage(null);
    setSimilarityScore(null);
    setWaveformUrl(null);
    setValidationFeedback(null);
    setFeedbackUrdu(null);

    try {
      const userRef = doc(db, 'User', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setAnalyzeMessage('User not found. Please try logging in again.');
        setAnalyzeLoading(false);
        return;
      }

      const userData = userDoc.data();
      
      // Check if user has completed this module
      if (userData[`check${phrase!.id}`]) {
        setAnalyzeMessage("You've already completed this module. Please proceed to the next one.");
        setAnalyzeLoading(false);
        return;
      }

      // Check if user has access to this module
      if (!userData[`phrase${phrase!.id}`]) {
        setAnalyzeMessage("This module is locked. Please complete the previous one first.");
        setAnalyzeLoading(false);
        return;
      }

      // Check daily analysis limit
      if (typeof userData.analysis === 'number' && userData.analysis >= 20) {
        setAnalyzeMessage("You've used up your daily limit. Please try again in a few hours.");
        setAnalyzeLoading(false);
        setTimeout(() => navigate('/modules'), 2000);
        return;
      }

      // Check if MP3 recording exists
      const mp3RecordingUrl = userData[`recording${phrase!.id}`];
      if (!mp3RecordingUrl) {
        setAnalyzeMessage('No MP3 recording found. Please record your voice first.');
        setAnalyzeLoading(false);
        return;
      }

      // Prepare form data with MP3 file
      const formData = new FormData();
      
      // Fetch the MP3 file from Firebase Storage URL
      const response = await fetch(mp3RecordingUrl);
      const mp3Blob = await response.blob();
      formData.append('file', mp3Blob, 'recording.mp3');

      const apiEndpoints: { [key: number]: string } = {
        1: '/api/validate-first-takbir/',
        2: '/api/validate-second-takbir/',
        3: '/api/validate-first-shahadah/',
        4: '/api/validate-second-shahadah/',
        5: '/api/validate-first-risalat/',
        6: '/api/validate-second-risalat/',
        7: '/api/validate-first-hayya-alas-salah/',
        8: '/api/validate-second-hayya-alas-salah/',
        9: '/api/validate-first-hayya-alal-falah/',
        10: '/api/validate-second-hayya-alal-falah/',
        11: '/api/validate-fajr-additional-first/',
        12: '/api/validate-fajr-additional-second/',
        13: '/api/validate-final-takbir/',
        14: '/api/validate-final-testimony/',
      };

      const apiEndpoint = apiEndpoints[phrase!.id as number] || '/api/validate-default/';

      const analysisResponse = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!analysisResponse.ok) {
        throw new Error(`Analysis failed: ${analysisResponse.statusText}`);
      }

      const data = await analysisResponse.json();

      setSimilarityScore(data.similarity_score || null);
      setWaveformUrl(data.waveform_url || null);
      setValidationFeedback(data.feedback || null);
      setFeedbackUrdu(data.feedback_urdu || null);

      // Update user progress
      await updateDoc(userRef, {
        [`check${phrase!.id}`]: true,
        [`score${phrase!.id}`]: data.similarity_score || 0,
        [`feedback${phrase!.id}`]: data.feedback || '',
        [`feedbackUrdu${phrase!.id}`]: data.feedback_urdu || '',
        [`completedAt${phrase!.id}`]: serverTimestamp(),
        analysis: increment(1)
      });

      setAnalyzeMessage('Analysis completed successfully!');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setAnalyzeMessage(`Analysis error: ${errorMessage}`);
      console.error('Analysis error:', error);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  if (!phrase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Phrase not found</h1>
            <button
              onClick={() => navigate('/modules')}
              className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              Back to Modules
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/modules')}
          className="flex items-center gap-2 text-amber-700 hover:text-amber-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Modules
        </button>

        {/* Phrase Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-amber-900">Phrase {phrase.id}</h1>
            <button
              onClick={() => setShowHowToUse(!showHowToUse)}
              className="p-2 text-amber-600 hover:text-amber-700 transition-colors"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Arabic Text */}
          <div className="text-right mb-4">
            <p className="text-2xl font-arabic text-amber-800 leading-relaxed">
              {phrase.arabic}
            </p>
          </div>

          {/* Transliteration */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-amber-800 mb-2">Transliteration</h3>
            <p className="text-gray-700 italic">{phrase.transliteration}</p>
          </div>

          {/* Translation */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-amber-800 mb-2">Translation</h3>
            <p className="text-gray-700">{phrase.translation}</p>
          </div>

          {/* How to Use Instructions */}
          {showHowToUse && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-2">How to Use</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-amber-700">
                <li>Listen to the reference audio to understand the correct pronunciation</li>
                <li>Click the microphone button to start recording</li>
                <li>Recite the phrase clearly and at a steady pace</li>
                <li>The recording will automatically convert to MP3 format</li>
                <li>Review your recording and analyze it for feedback</li>
              </ol>
            </div>
          )}
        </div>

        {/* Reference Audio Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 shadow-lg mb-6">
          <h3 className="text-xl font-semibold text-amber-900 mb-4 flex items-center gap-2">
            <Volume2 className="w-6 h-6" />
            Reference Audio
          </h3>
          {phrase.referenceAudio && (
            <audio
              controls
              className="w-full"
              src={phrase.referenceAudio}
            />
          )}
        </div>

        {/* Recording Section Toggle */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-amber-900">Recording Options</h3>
            <button
              onClick={() => setShowMP3Recorder(!showMP3Recorder)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              {showMP3Recorder ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showMP3Recorder ? 'Hide MP3 Recorder' : 'Show MP3 Recorder'}
            </button>
          </div>
          
          {showMP3Recorder && (
            <div className="mt-6">
              <AudioRecorderIntegration
                phraseId={phrase.id}
                onUploadComplete={handleUploadComplete}
                onError={handleRecordingError}
              />
            </div>
          )}
        </div>

        {/* Analysis Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 shadow-lg mb-6">
          <h3 className="text-xl font-semibold text-amber-900 mb-4">Analysis</h3>
          
          <button
            onClick={handleAnalyze}
            disabled={analyzeLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {analyzeLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analyzing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Analyze Recording
              </>
            )}
          </button>

          {/* Analysis Results */}
          {analyzeMessage && (
            <div className={`mt-4 p-4 rounded-lg ${
              analyzeMessage.includes('error') || analyzeMessage.includes('failed')
                ? 'bg-red-50 border border-red-200'
                : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-center gap-2">
                {analyzeMessage.includes('error') || analyzeMessage.includes('failed') ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                <span className={
                  analyzeMessage.includes('error') || analyzeMessage.includes('failed')
                    ? 'text-red-700'
                    : 'text-green-700'
                }>
                  {analyzeMessage}
                </span>
              </div>
            </div>
          )}

          {similarityScore !== null && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Similarity Score</h4>
              <div className="text-2xl font-bold text-blue-600">{similarityScore.toFixed(1)}%</div>
            </div>
          )}

          {validationFeedback && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">Feedback</h4>
              <p className="text-amber-700">{validationFeedback}</p>
            </div>
          )}

          {feedbackUrdu && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">Feedback (Urdu)</h4>
              <p className="text-amber-700 text-right font-arabic">{feedbackUrdu}</p>
            </div>
          )}

          {waveformUrl && (
            <div className="mt-4">
              <h4 className="font-semibold text-amber-800 mb-2">Waveform Analysis</h4>
              <img 
                src={waveformUrl} 
                alt="Waveform Analysis" 
                className="w-full rounded-lg border border-amber-200"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhraseDetailPageWithMP3; 