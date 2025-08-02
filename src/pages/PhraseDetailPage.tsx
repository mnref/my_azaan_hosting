import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { phrasesData } from '../data/phrasesData';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { doc, updateDoc, getDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import AudioWaveform from '../components/AudioWaveform';
import Header from '../components/Header';
import { ConversionResult } from '../utils/AudioConverter';
import AudioRecorderWithMP3 from '../components/AudioRecorderWithMP3';
import { createSafeAudioUrl } from '../utils/audioHelpers';
import { createBlobUrlFromFirebase, isFirebaseStorageUrl } from '../utils/proxyHelper';
import { ArrowLeft, Play, Pause, Mic, MicOff, RotateCcw, Volume2, ChevronDown, ChevronUp, HelpCircle, CheckCircle } from 'lucide-react';

// REMOVE: FFmpegConverter class and all ffmpeg/MP3 conversion logic

const PhraseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Restore original recording state and logic
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const referenceAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isPlayingReference] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [waveformUrl, setWaveformUrl] = useState<string | null>(null);
  const [validationFeedback, setValidationFeedback] = useState<string | null>(null);
  const [feedbackUrdu, setFeedbackUrdu] = useState<string | null>(null);
  const [audioFeedbackUrl, setAudioFeedbackUrl] = useState<string | null>(null);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  
  // MP3 Recording Integration
  const [mp3Blob, setMp3Blob] = useState<Blob | null>(null);
  const [mp3Url, setMp3Url] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  
  // Custom audio player state for reference audio
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
  const handleMP3RecordingComplete = useCallback(async (result: ConversionResult) => {
    setMp3Blob(result.mp3Blob);
    const url = URL.createObjectURL(result.mp3Blob);
    setMp3Url(url);
    setShowAnalyze(true);
    console.log('MP3 recording completed:', result);
  }, []);

  const handleMP3RecordingError = useCallback((error: string) => {
    console.error('MP3 recording error:', error);
    setAnalyzeMessage(`Recording error: ${error}`);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Show Analyze button when recording ends and audioUrl is set
    if (!isRecording && audioUrl) {
      setShowAnalyze(true);
    }
  }, [isRecording, audioUrl]);

  // Restore original recording state and logic
  const startRecording = async () => {
    // Always pause and reset reference audio when starting recording
    if (referenceAudioRef.current) {
      referenceAudioRef.current.pause();
      referenceAudioRef.current.currentTime = 0;
      setRefAudioPlaying(false);
    }
    // Fallback: pause all audio elements on the page
    document.querySelectorAll('audio').forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setShowAnalyze(true);
      };
      setIsRecording(true);
      setCountdown(phrase!.duration);
      mediaRecorder.start();
      // Countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            mediaRecorder.stop();
            setIsRecording(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const recordAgain = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setIsPlaying(false);
    setShowAnalyze(false);
    setSimilarityScore(null);
    setWaveformUrl(null);
    setValidationFeedback(null);
    setFeedbackUrdu(null);
    setAudioFeedbackUrl(null);
    setAnalyzeMessage(null);
    startRecording();
  };

  // Restore original handleAnalyze logic for WebM
  const handleAnalyze = async () => {
    setAnalyzeMessage(null);
    setAnalyzeLoading(true);
    setConversionLoading(false);
    try {
      if (!currentUser) throw new Error('User not logged in');
      const userRef = doc(db, 'User', currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) throw new Error('User not found');
      const userData = userDoc.data();
      if (userData[`check${phrase!.id}`]) {
        setAnalyzeMessage("You've already completed this module. Please proceed to the next one.");
        setAnalyzeLoading(false);
        return;
      }
      if (!userData[`phrase${phrase!.id}`]) {
        setAnalyzeMessage("This module is locked. Please complete the previous one first.");
        setAnalyzeLoading(false);
        return;
      }
      if (typeof userData.analysis === 'number' && userData.analysis >= 20) {
        setAnalyzeMessage("You've used up your daily limit. Please try again in a few hours.");
        setAnalyzeLoading(false);
        setTimeout(() => navigate('/modules'), 2000);
        return;
      }
      // Use MP3 recording
      if (!mp3Blob) {
        setAnalyzeMessage('No MP3 recording found. Please record your voice first.');
        setAnalyzeLoading(false);
        return;
      }
      
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
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'accept': 'application/json'
        },
        body: formData
      });
      if (!response.ok) {
        setAnalyzeMessage('The server is currently down. Please try again later.');
        setAnalyzeLoading(false);
        return;
      }
      const data = await response.json();
      if (data) {
        if (typeof data.similarity_score === 'number') setSimilarityScore(data.similarity_score);
        else setSimilarityScore(null);
        
        // Handle waveform URL with CORS fix
        if (data.waveform_url) {
          try {
            if (isFirebaseStorageUrl(data.waveform_url)) {
              // Use proxy for Firebase Storage URLs
              const blobUrl = await createBlobUrlFromFirebase(data.waveform_url);
              setWaveformUrl(blobUrl);
              setBlobUrls(prev => [...prev, blobUrl]);
            } else {
              const safeWaveformUrl = createSafeAudioUrl(data.waveform_url);
              setWaveformUrl(safeWaveformUrl);
            }
          } catch (error) {
            console.error('Failed to load waveform:', error);
            setWaveformUrl(null);
            setAnalyzeMessage('Waveform analysis image could not be loaded.');
          }
        } else {
          setWaveformUrl(null);
        }
        
        setValidationFeedback(data.validation_feedback || null);
        setFeedbackUrdu(data.feedback || null);
        
        // Handle audio feedback URL with CORS fix
        if (data.audio_feedback) {
          try {
            if (isFirebaseStorageUrl(data.audio_feedback)) {
              // Use proxy for Firebase Storage URLs
              const blobUrl = await createBlobUrlFromFirebase(data.audio_feedback);
              setAudioFeedbackUrl(blobUrl);
              setBlobUrls(prev => [...prev, blobUrl]);
            } else {
              const safeAudioFeedbackUrl = createSafeAudioUrl(data.audio_feedback);
              setAudioFeedbackUrl(safeAudioFeedbackUrl);
            }
          } catch (error) {
            console.error('Failed to load audio feedback:', error);
            setAudioFeedbackUrl(null);
          }
        } else {
          setAudioFeedbackUrl(null);
        }
        setAnalyzeMessage(null);
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

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Reference audio URL and YouTube video for Phrase 1
  const referenceAudioUrl = phrase!.audioUrl;
  const youtubeUrl = phrase!.videoUrl;

  // Ensure reference audio and recording do not play at the same time
  useEffect(() => {
    if (isRecording && referenceAudioRef.current) {
      referenceAudioRef.current.pause();
      referenceAudioRef.current.currentTime = 0;
    }
  }, [isRecording]);

  useEffect(() => {
    if (isPlayingReference && isRecording) {
      if (referenceAudioRef.current) {
        referenceAudioRef.current.pause();
        referenceAudioRef.current.currentTime = 0;
      }
    }
  }, [isPlayingReference, isRecording]);

  // Cleanup function for blob URLs
  useEffect(() => {
    return () => {
      // Cleanup blob URLs when component unmounts
      blobUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [blobUrls]);

  if (!phrase) {
    return null; // or a fallback UI if you prefer
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
              src={youtubeUrl}
              title="Expert Demonstration"
              className="w-full h-full"
              allowFullScreen
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
            <audio
              ref={referenceAudioPlayerRef}
              src={referenceAudioUrl}
              onTimeUpdate={handleRefAudioTimeUpdate}
              onLoadedMetadata={handleRefAudioLoadedMetadata}
              onEnded={() => setRefAudioPlaying(false)}
              style={{ display: 'none' }}
            />
            <button
              onClick={handleRefAudioPlayPause}
              className={`mb-2 w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl shadow-lg focus:outline-none ${refAudioPlaying ? 'bg-orange-600' : 'bg-amber-500 hover:bg-amber-600'}`}
              disabled={isRecording}
            >
              {refAudioPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
            </button>
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
              maxDuration={phrase!.duration}
              autoConvert={true}
              showSettings={false}
            />

                      {/* MP3 Playback Controls */}
          {mp3Url && (
            <div className="bg-amber-50 rounded-lg p-6 space-y-4">
              <h4 className="font-semibold text-amber-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Your MP3 Recording
              </h4>
              <audio
                src={mp3Url}
                controls
                className="w-full"
                onError={(e) => {
                  console.error('Audio playback error:', e);
                  setAnalyzeMessage('Error playing MP3 recording. Please try recording again.');
                }}
              />
                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={() => {
                      setMp3Blob(null);
                      setMp3Url(null);
                      if (mp3Url) URL.revokeObjectURL(mp3Url);
                      setShowAnalyze(false);
                    }}
                    className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Record Again</span>
                  </button>
                </div>
              </div>
            )}

            {/* Analyze Button */}
            {showAnalyze && (
              <div className="flex flex-col items-center mt-4">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors disabled:opacity-60"
                  onClick={handleAnalyze}
                  disabled={analyzeLoading || conversionLoading}
                >
                  {analyzeLoading || conversionLoading ? (conversionLoading ? 'Converting Audio...' : 'Analyzing...') : 'Analyze'}
                </button>
                {/* Results Section */}
                {similarityScore !== null && (
                  <div className="mt-4 w-full flex flex-col items-center">
                    <div className="text-lg font-bold text-blue-700 mb-2">
                      Similarity Score: <span className="text-2xl">{similarityScore}</span>
                    </div>
                  </div>
                )}
                {/* Waveform Image */}
                {waveformUrl && (
                  <div className="mt-2 w-full flex flex-col items-center">
                    <img 
                      src={waveformUrl} 
                      alt="Waveform" 
                      className="max-w-full rounded-lg border border-amber-200 shadow"
                      onError={(e) => {
                        console.error('Waveform image failed to load:', e);
                        setWaveformUrl(null);
                        setAnalyzeMessage('Waveform analysis image could not be loaded.');
                      }}
                    />
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
                    {/* Urdu Feedback */}
                    {feedbackUrdu && (
                      <div className="mt-4 w-full text-center text-green-900 bg-green-100 rounded-lg px-4 py-2 shadow" dir="rtl">
                        {feedbackUrdu}
                      </div>
                    )}
                  </>
                )}
                {/* Audio Feedback */}
                {audioFeedbackUrl && (
                  <div className="mt-2 w-full flex flex-col items-center">
                    <audio 
                      controls 
                      src={audioFeedbackUrl} 
                      className="w-full max-w-md mt-2"
                      onError={(e) => {
                        console.error('Audio feedback failed to load:', e);
                        setAudioFeedbackUrl(null);
                      }}
                    />
                  </div>
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