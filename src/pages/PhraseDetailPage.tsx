import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Mic, HelpCircle, ChevronUp, ChevronDown, Loader2, Volume2 } from 'lucide-react';
import { collection, doc, updateDoc, addDoc, serverTimestamp, increment, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { phrasesData } from '../data/phrasesData';
import Header from '../components/Header';
import AudioRecorderWithMP3 from '../components/AudioRecorderWithMP3';
import { createSafeUrl } from '../utils/proxyHelper';
import { ConversionResult } from '../utils/WebAudioConverter';
import { createReliableAudioURL } from '../utils/firebaseStorageHelper';
import { getPhraseDuration } from '../utils/audioDurationFix';

// REMOVE: FFmpegConverter class and all ffmpeg/MP3 conversion logic

const PhraseDetailPage: React.FC = () => {
  console.log('🎯 PhraseDetailPage component rendering...');
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  console.log('📊 Component state:', { id, currentUser: !!currentUser });
  


  // MP3 Recording state
  const [mp3Blob, setMp3Blob] = useState<Blob | null>(null);
  const [mp3Url, setMp3Url] = useState<string | null>(null);
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [waveformUrl, setWaveformUrl] = useState<string | null>(null);
  const [validationFeedback, setValidationFeedback] = useState<string | null>(null);
  const [feedbackUrdu, setFeedbackUrdu] = useState<string | null>(null);
  const [audioFeedbackUrl, setAudioFeedbackUrl] = useState<string | null>(null);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [referenceAudioFailed, setReferenceAudioFailed] = useState(false);
  
  // Custom audio player state for reference audio
  const referenceAudioRef = useRef<HTMLAudioElement | null>(null);
  const referenceAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [refAudioPlaying, setRefAudioPlaying] = useState(false);
  const [refAudioCurrent, setRefAudioCurrent] = useState(0);
  const [refAudioDuration, setRefAudioDuration] = useState(0);

  useEffect(() => {
    if (!refAudioPlaying && referenceAudioPlayerRef.current) {
      referenceAudioPlayerRef.current.pause();
    }
  }, [refAudioPlaying]);

  const handleRefAudioPlayPause = () => {
    if (!referenceAudioPlayerRef.current) return;
    if (refAudioPlaying) {
      referenceAudioPlayerRef.current.pause();
    } else {
      referenceAudioPlayerRef.current.play();
    }
    setRefAudioPlaying(!refAudioPlaying);
  };

  const handleRefAudioTimeUpdate = () => {
    if (referenceAudioPlayerRef.current) {
      setRefAudioCurrent(referenceAudioPlayerRef.current.currentTime);
    }
  };

  const handleRefAudioLoadedMetadata = () => {
    if (referenceAudioPlayerRef.current) {
      setRefAudioDuration(referenceAudioPlayerRef.current.duration);
    }
  };

  const handleRefAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (referenceAudioPlayerRef.current) {
      referenceAudioPlayerRef.current.currentTime = Number(e.target.value);
      setRefAudioCurrent(Number(e.target.value));
    }
  };

  const phrase = phrasesData.find(p => p.id === parseInt(id || '0'));

  // MP3 Recording Handlers
  const handleMP3RecordingComplete = useCallback((result: ConversionResult) => {
    console.log('🎵 MP3 recording completed');
    console.log('🎵 Audio format being sent to server: ' + result.mp3Blob.type);
    console.log('🎵 Audio file size: ' + result.fileSize + ' bytes');
    console.log('🎵 Audio duration: ' + result.duration + ' seconds');
    
    setMp3Blob(result.mp3Blob);
    setMp3Url(URL.createObjectURL(result.mp3Blob));
    setShowAnalyze(true);
    setAnalyzeLoading(false);
    setConversionLoading(false);
  }, []);

  const handleMP3RecordingError = useCallback((error: string) => {
    console.error('MP3 recording error:', error);
    setAnalyzeMessage(`Recording error: ${error}`);
  }, []);

  // Clear function to reset recording and feedback
  const handleClear = useCallback(() => {
    // Clear MP3 recording
    setMp3Blob(null);
    setMp3Url(null);
    setShowAnalyze(false);
    
    // Clear analysis results
    setSimilarityScore(null);
    setWaveformUrl(null);
    setValidationFeedback(null);
    setFeedbackUrdu(null);
    setAudioFeedbackUrl(null);
    setAnalyzeMessage(null);
    setAnalyzeLoading(false);
    setConversionLoading(false);
    setReferenceAudioFailed(false);
    
    // Reset the AudioRecorderWithMP3 component
    setResetKey(prev => prev + 1);
    
    console.log('🎯 All recording and feedback data cleared');
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Enhanced handleAnalyze with better debugging
  const handleAnalyze = async () => {
    console.log('🔍 Analyze button clicked!');
    console.log('🔍 Current state:', {
      currentUser: !!currentUser,
      mp3Blob: !!mp3Blob,
      phraseId: phrase?.id,
      analyzeLoading,
      conversionLoading
    });
    
    setAnalyzeMessage(null);
    setAnalyzeLoading(true);
    setConversionLoading(false);
    
    try {
      if (!currentUser) {
        console.error('❌ No current user');
        throw new Error('User not logged in');
      }
      
      console.log('🔍 User authenticated:', currentUser.email);
      
      const userRef = doc(db, 'User', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error('❌ User document not found');
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      console.log('🔍 User data loaded:', {
        analysis: userData.analysis,
        phraseCheck: userData[`check${phrase!.id}`],
        phraseUnlocked: userData[`phrase${phrase!.id}`]
      });
      
      if (userData[`check${phrase!.id}`]) {
        console.log('❌ Module already completed');
        setAnalyzeMessage("You've already completed this module. Please proceed to the next one.");
        setAnalyzeLoading(false);
        return;
      }
      
      if (!userData[`phrase${phrase!.id}`]) {
        console.log('❌ Module is locked');
        setAnalyzeMessage("This module is locked. Please complete the previous one first.");
        setAnalyzeLoading(false);
        return;
      }
      
      if (typeof userData.analysis === 'number' && userData.analysis >= 20) {
        console.log('❌ Daily limit reached');
        setAnalyzeMessage("You've used up your daily limit. Please try again in a few hours.");
        setAnalyzeLoading(false);
        setTimeout(() => navigate('/modules'), 2000);
        return;
      }
      
      // Use MP3 recording
      if (!mp3Blob) {
        console.error('❌ No MP3 recording found');
        setAnalyzeMessage('No MP3 recording found. Please record your voice first.');
        setAnalyzeLoading(false);
        return;
      }
      
      console.log('🔍 Recording blob details:', {
        size: mp3Blob.size,
        type: mp3Blob.type
      });
      
      const recordingBlob = mp3Blob;
      const fileName = 'recording.mp3';
      
      const formData = new FormData();
      formData.append('file', recordingBlob, fileName);
      
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
      
      const apiEndpoint = apiEndpoints[phrase!.id as number] || '/api/validate-first-takbir/';
      console.log('🔍 Using API endpoint:', apiEndpoint);
      
      console.log('🔍 Sending request to server...');
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'accept': 'application/json'
        },
        body: formData
      });
      
      console.log('🔍 Server response status:', response.status);
      console.log('🔍 Server response headers:', Object.fromEntries(response.headers.entries()));
      if (!response.ok) {
        setAnalyzeMessage('The server is currently down. Please try again later.');
        setAnalyzeLoading(false);
        return;
      }
      const data = await response.json();
      console.log('🔍 API Response:', data);
      console.log('🔍 API Response keys:', Object.keys(data));
      console.log('🔍 API Response stringified:', JSON.stringify(data, null, 2));
      
      if (data) {
        if (typeof data.similarity_score === 'number') setSimilarityScore(data.similarity_score);
        else setSimilarityScore(null);
        
        // Handle audio feedback URL with server-only approach
        if (data.audio_feedback) {
          try {
            console.log('🔍 Processing audio feedback URL:', data.audio_feedback);
            
            // Use direct URL approach for server audio feedback only
            const processedUrl = createSafeUrl(data.audio_feedback);
            setAudioFeedbackUrl(processedUrl);
            console.log('✅ Server audio feedback URL set:', processedUrl);
          } catch (error) {
            console.error('Failed to load server audio feedback:', error);
            setAudioFeedbackUrl(null);
            setAnalyzeMessage('Server audio feedback could not be loaded. Text feedback is still available.');
          }
        } else {
          console.log('🔍 No server audio feedback URL in response');
          setAudioFeedbackUrl(null);
        }

        // Handle waveform URL with server-only approach
        if (data.waveform_url) {
          console.log('🔍 Server waveform URL found:', data.waveform_url);
          try {
            const safeWaveformUrl = createSafeUrl(data.waveform_url);
            console.log('🔍 Server waveform URL processed:', safeWaveformUrl);
            setWaveformUrl(safeWaveformUrl);
          } catch (error) {
            console.error('Failed to load server waveform:', error);
            setWaveformUrl(null);
            setAnalyzeMessage('Server waveform analysis could not be loaded.');
          }
        } else {
          console.log('🔍 No server waveform URL in response');
          setWaveformUrl(null);
        }
        
        setValidationFeedback(data.validation_feedback || null);
        setFeedbackUrdu(data.feedback || null);
        
        let validation_status = '';
        if (data.validation_feedback === 'VALIDATED') {
          validation_status = data.similarity_score >= 60 ? 'Pass' : 'Validated';
        } else if (data.validation_feedback === 'INVALIDATED') {
          validation_status = 'Invalidated';
        }
        await addDoc(collection(db, 'api_call_analysis'), {
          phrase: `phrase${phrase!.id}`,
          timestamp: serverTimestamp(),
          user_email: currentUser.email,
          user_ref: userRef,
          validation_status,
        });
        await updateDoc(userRef, { analysis: increment(1) });
        if (data.similarity_score !== undefined && data.similarity_score >= 60) {
          const updates: any = {};
          if (phrase!.id === 14) {
            updates[`phrase14`] = false;
            updates[`check14`] = true;
            updates[`phrase1`] = true;
            updates.score = increment(7);
          } else {
            updates[`phrase${phrase!.id}`] = false;
            updates[`check${phrase!.id}`] = true;
            if (phrase!.id < 14) {
              updates[`phrase${phrase!.id + 1}`] = true;
            }
            updates.score = increment(7);
          }
          await updateDoc(userRef, updates);
        }
      } else {
        setAnalyzeMessage('Unexpected response from server.');
      }
    } catch (err: any) {
      setAnalyzeMessage((err as Error).message || 'An error occurred.');
    } finally {
      setAnalyzeLoading(false);
      setConversionLoading(false);
    }
  };

  // Reference audio URL and YouTube video for Phrase 1
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);
  const youtubeUrl = phrase!.videoUrl;
  
  // Log video URL for debugging
  useEffect(() => {
    console.log('🎥 Loading video URL:', youtubeUrl);
  }, [youtubeUrl]);



  // Load reference audio using Firebase SDK for reliable access
  useEffect(() => {
    const loadReferenceAudio = async () => {
      try {
        console.log('🎵 Loading reference audio using Firebase SDK...');
        
        // Use the new Firebase helper for reliable audio URLs
        const reliableUrl = await createReliableAudioURL(phrase!.audioUrl);
        setReferenceAudioUrl(reliableUrl);
        console.log('✅ Reference audio URL set:', reliableUrl);
        
      } catch (error) {
        console.error('Failed to load reference audio:', error);
        // Fallback to original URL with cache busting
        const fallbackUrl = `${phrase!.audioUrl}?_cb=${Date.now()}`;
        setReferenceAudioUrl(fallbackUrl);
        console.log('🔄 Using fallback URL:', fallbackUrl);
      }
    };

    loadReferenceAudio();
  }, [phrase]);



  if (!phrase) {
    console.log('❌ No phrase found for id:', id);
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-900 mb-4">Phrase Not Found</h1>
          <p className="text-amber-700 mb-4">The phrase with ID {id} could not be found.</p>
          <button
            onClick={() => navigate('/modules')}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
          >
            Back to Modules
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Header with Logo */}
      <Header 
        showLogout={false}
        title={phrase.title}
        subtitle="Perfect Your Recitation"
      />

      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 py-2">
        <button
          onClick={() => navigate('/modules')}
          className="flex items-center space-x-2 text-amber-700 hover:text-amber-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Modules</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Arabic Phrase Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 shadow-lg text-center mb-2">
          <h2 className="text-5xl font-amiri text-amber-900 mb-6 leading-relaxed" dir="rtl">
            {phrase.arabic}
          </h2>
          <p className="text-2xl text-amber-700 font-medium italic mb-4">
            {phrase.transliteration}
          </p>
          <p className="text-xl text-amber-600">
            "{phrase.translation}"
          </p>
        </div>

        {/* How To Use Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-200/50 shadow-lg pb-10">
          <button
            onClick={() => setShowHowToUse(!showHowToUse)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-amber-50/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-6 h-6 text-amber-600" />
              <span className="text-lg font-semibold text-amber-900">How To Use?</span>
            </div>
            {showHowToUse ? <ChevronUp className="w-5 h-5 text-amber-600" /> : <ChevronDown className="w-5 h-5 text-amber-600" />}
          </button>
          {showHowToUse && (
            <div className="px-6 pb-6 border-t border-amber-200/50 pt-4 animate-slide-down">
              <ol className="list-decimal list-inside space-y-1 text-amber-800">
                <li>Watch the expert demonstration video carefully</li>
                <li>Listen to the reference audio to understand proper pronunciation</li>
                <li>Click 'Start Recording' and recite the phrase (6 seconds)</li>
                <li>Wait for the recording to complete</li>
                <li>Click 'Analyze Recording' to get detailed feedback</li>
                <li>Review your score and feedback to improve</li>
                <li>Practice until you achieve 60 or higher similarity</li>
              </ol>
            </div>
          )}
        </div>

        {/* Expert Demonstration */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 shadow-lg">
          <h3 className="text-xl font-semibold text-amber-900 mb-4">📽 Expert Demonstration</h3>
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe
              src={`${youtubeUrl}?rel=0&modestbranding=1&showinfo=0`}
              title="Expert Demonstration"
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              frameBorder="0"
              onError={(e) => {
                console.error('YouTube video failed to load:', e);
              }}
            />
          </div>
        </div>

        {/* Reference Audio */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 border border-amber-200/70 shadow-lg flex flex-col items-center">
          <div className="flex items-center mb-3">
            <Volume2 className="w-7 h-7 text-amber-600 mr-2" />
            <span className="text-lg font-bold text-amber-900">Reference Audio</span>
          </div>
          <div className="w-full max-w-md flex flex-col items-center">
            {referenceAudioUrl && (
              <audio
                ref={referenceAudioPlayerRef}
                src={referenceAudioUrl}
                onTimeUpdate={handleRefAudioTimeUpdate}
                onLoadedMetadata={handleRefAudioLoadedMetadata}
                onEnded={() => setRefAudioPlaying(false)}
                onError={(e) => {
                  console.error('Audio element error:', e);
                  // Don't try to set the same URL again to avoid infinite loop
                  if (referenceAudioUrl !== phrase!.audioUrl) {
                    console.log('🔄 Audio failed to load, trying direct URL...');
                    setReferenceAudioUrl(phrase!.audioUrl);
                  } else {
                    console.log('❌ Audio failed to load even with direct URL');
                    // Show a message to the user about CORS issue
                    setAnalyzeMessage('Reference audio is temporarily unavailable due to server configuration. You can still record and analyze your pronunciation.');
                    setReferenceAudioFailed(true);
                  }
                }}
                crossOrigin="anonymous"
                preload="metadata"
                style={{ display: 'none' }}
              />
            )}
            {!referenceAudioUrl && (
              <div className="mb-2 w-12 h-12 rounded-full flex items-center justify-center bg-gray-300">
                <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
              </div>
            )}
            {referenceAudioUrl && (
              <button
                onClick={handleRefAudioPlayPause}
                className={`mb-2 w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl shadow-lg focus:outline-none ${refAudioPlaying ? 'bg-orange-600' : 'bg-amber-500 hover:bg-amber-600'}`}
              >
                {refAudioPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
              </button>
            )}
            {referenceAudioUrl === phrase!.audioUrl && (
              <div className="text-xs text-amber-600 mt-2 text-center">
                ⚠️ Reference audio may not play due to CORS restrictions<br/>
                <span className="text-amber-500">You can still record and analyze your voice!</span>
                <br/>
                <span className="text-amber-400">💡 Tip: Watch the expert demonstration video for guidance</span>
              </div>
            )}
            <input
              type="range"
              min={0}
              max={refAudioDuration}
              value={refAudioCurrent}
              step={0.01}
              onChange={handleRefAudioSeek}
              className="w-full accent-amber-600"
            />
            <div className="flex justify-between w-full text-xs text-amber-700 mt-1">
              <span>{formatTime(refAudioCurrent)}</span>
              <span>{formatTime(refAudioDuration)}</span>
            </div>
          </div>
        </div>

        {/* MP3 Recording Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 shadow-lg">
          <h3 className="text-xl font-semibold text-amber-900 mb-6 flex items-center space-x-2">
            <Mic className="w-6 h-6" />
            <span>MP3 Recording Section</span>
          </h3>

          <div className="space-y-6">
            {/* MP3 Recording Component */}
            <AudioRecorderWithMP3
              onRecordingComplete={handleMP3RecordingComplete}
              onError={handleMP3RecordingError}
              maxDuration={getPhraseDuration(phrase.id)}
              phraseId={phrase.id}
              autoConvert={true}
              showSettings={false}
              className="mb-6"
              resetKey={resetKey}
            />

            {/* Analyze and Clear Buttons */}
            {showAnalyze && (
              <div className="flex flex-col items-center mt-4 space-y-3">
                <div className="flex space-x-4">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors disabled:opacity-60"
                    onClick={handleAnalyze}
                    disabled={analyzeLoading || conversionLoading}
                  >
                    {analyzeLoading || conversionLoading ? (conversionLoading ? 'Converting Audio...' : 'Analyzing...') : 'Analyze'}
                  </button>
                  
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors flex items-center space-x-2"
                    onClick={handleClear}
                    disabled={analyzeLoading || conversionLoading}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Clear</span>
                  </button>
                </div>
                {/* Results Section - Mobile App Style */}
                {similarityScore !== null && (
                  <div className="mt-6 w-full bg-white rounded-xl border border-amber-200 shadow-lg overflow-hidden">
                    {/* Score Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4">
                      <h3 className="text-xl font-bold text-center">Analysis Results</h3>
                    </div>
                    
                    {/* Score Display */}
                    <div className="p-6 text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {similarityScore}
                      </div>
                      <div className="text-lg text-gray-600 mb-4">
                        Similarity Score
                      </div>
                      
                      {/* Score Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            similarityScore >= 80 ? 'bg-green-500' : 
                            similarityScore >= 60 ? 'bg-blue-500' : 
                            similarityScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(similarityScore, 100)}%` }}
                        ></div>
                      </div>
                      
                                             {/* Status Message */}
                       <div className={`text-lg font-semibold ${
                         similarityScore >= 80 ? 'text-green-600' : 
                         similarityScore >= 60 ? 'text-blue-600' : 
                         similarityScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                       }`}>
                         {similarityScore >= 80 ? 'Excellent!' : 
                          similarityScore >= 60 ? 'Good Job!' : 
                          similarityScore >= 40 ? 'Keep Practicing!' : 'Needs More Practice!'}
                       </div>
                    </div>
                  </div>
                )}
                {/* Waveform Analysis Section */}
                {waveformUrl && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 shadow-lg">
                    <h3 className="text-xl font-semibold text-amber-900 mb-6 flex items-center space-x-2">
                      <Volume2 className="w-6 h-6" />
                      <span>Audio Waveform Analysis</span>
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="text-center">
                        <img 
                          src={waveformUrl} 
                          alt="Audio waveform analysis" 
                          className="max-w-full h-auto rounded-lg border border-amber-200"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.error('Waveform image failed to load:', e);
                            setWaveformUrl(null);
                            setAnalyzeMessage('Server waveform could not be loaded.');
                          }}
                          onLoad={() => {
                            console.log('✅ Waveform image loaded successfully');
                          }}
                        />
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-amber-600">
                          Server-generated waveform analysis
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Celebratory or Feedback Message */}
                {similarityScore !== null && similarityScore >= 60 ? (
                  <div className="mt-4 w-full flex flex-col items-center">
                    {phrase.id === 14 ? (
                      <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white text-xl font-bold rounded-lg px-6 py-4 shadow-lg flex items-center justify-center animate-bounce">
                        🎉 Mashallah, aap ne is hisse ki tilawat shaandar andaz mein seekh li hai. Dili mubarakbaad!<br/>Your training has been successfully completed.
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white text-xl font-bold rounded-lg px-6 py-4 shadow-lg flex items-center justify-center animate-bounce">
                        🎉 Mashallah, aap ne is hisse ki tilawat shaandar andaz mein seekh li hai. Dili mubarakbaad! Ab aap agle hisse ki taraf barh sakte hain 🎉
                      </div>
                    )}
                    
                    {/* Clear Results Button for Success */}
                    <button
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-colors flex items-center space-x-2"
                      onClick={handleClear}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Clear All Results</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* If validation_feedback is INVALIDATED, show special warning */}
                    {validationFeedback === 'INVALIDATED' && (
                      <div className="mt-4 w-full flex flex-col items-center">
                        <div className="bg-red-100 text-red-800 text-lg font-semibold rounded-lg px-6 py-4 shadow">
                          Aapke alfaz durust nahi hai dobara recording sunkar record kare
                        </div>
                      </div>
                    )}
                    
                    {/* Audio Feedback Section */}
                    {audioFeedbackUrl && (
                      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 shadow-lg">
                        <h3 className="text-xl font-semibold text-amber-900 mb-6 flex items-center space-x-2">
                          <Volume2 className="w-6 h-6" />
                          <span>Audio Feedback</span>
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-center">
                            <audio
                              controls
                              className="w-full max-w-md"
                              src={audioFeedbackUrl}
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error('Audio feedback playback error:', e);
                                setAnalyzeMessage('Audio feedback playback failed. The text feedback is still available.');
                              }}
                              onLoadStart={() => console.log('🎵 Loading audio feedback...')}
                              onCanPlay={() => console.log('✅ Audio feedback ready to play')}
                              preload="metadata"
                            >
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-amber-600">
                              Listen to expert pronunciation feedback
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Urdu Feedback - Mobile App Style */}
                    {feedbackUrdu && (
                      <div className="mt-6 w-full bg-white rounded-xl border border-amber-200 shadow-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-amber-600 text-white px-4 py-3">
                          <h3 className="text-lg font-semibold text-center">Detailed Feedback</h3>
                        </div>
                        
                        {/* Feedback Content */}
                        <div className="p-4 space-y-3" dir="rtl">
                          {/* Greeting */}
                          <div className="text-right text-xl font-bold text-amber-800 mb-4">
                            السلام علیکم
                          </div>
                          
                          {/* Feedback Text with Icons - Mobile App Style */}
                          <div className="space-y-2 text-right text-amber-700 leading-relaxed">
                            {feedbackUrdu.split('.').map((sentence, index) => {
                              const trimmedSentence = sentence.trim();
                              if (!trimmedSentence) return null;
                              
                              // Check for specific patterns to add icons
                              let icon = null;
                              let className = '';
                              let iconSize = 'text-base';
                              
                              if (trimmedSentence.includes('صحیح') || trimmedSentence.includes('بہتری') || trimmedSentence.includes('خوبصورتی') || trimmedSentence.includes('پڑھی')) {
                                icon = '✓';
                                className = 'text-green-600';
                                iconSize = 'text-lg';
                              } else if (trimmedSentence.includes('ضرورت') || trimmedSentence.includes('واضح') || trimmedSentence.includes('مضبوط') || trimmedSentence.includes('ادا')) {
                                icon = '⚡';
                                className = 'text-yellow-600';
                                iconSize = 'text-lg';
                              } else if (trimmedSentence.includes('مشق') || trimmedSentence.includes('توجہ') || trimmedSentence.includes('وقف') || trimmedSentence.includes('خیال')) {
                                icon = '🎯';
                                className = 'text-red-600';
                                iconSize = 'text-lg';
                              } else if (trimmedSentence.includes('قابل ستائش') || trimmedSentence.includes('مزید محنت') || trimmedSentence.includes('بہتر')) {
                                icon = '💪';
                                className = 'text-blue-600';
                                iconSize = 'text-lg';
                              }
                              
                              return (
                                <div key={index} className={`flex items-start justify-end space-x-3 space-x-reverse ${className} text-sm`}>
                                  <span className={`${iconSize} flex-shrink-0 mt-0.5`}>{icon}</span>
                                  <span className="flex-1 leading-6">{trimmedSentence}.</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Clear Results Button */}
                    <div className="mt-6 w-full flex justify-center">
                      <button
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-colors flex items-center space-x-2"
                        onClick={handleClear}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Clear All Results</span>
                      </button>
                    </div>
                  </>
                )}
                {/* Analyze Message (errors, etc.) */}
                {analyzeMessage && (
                  <div className="mt-3 text-center text-amber-900 bg-amber-100 rounded-lg px-4 py-2 shadow">
                    {analyzeMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default PhraseDetailPage;

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}