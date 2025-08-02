import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { phrasesData } from '../data/phrasesData';
import { Lock, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

const ModulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [phraseProgress, setPhraseProgress] = useState<{ [key: string]: boolean }>({});
  const [checkProgress, setCheckProgress] = useState<{ [key: string]: boolean }>({});
  const [analysis, setAnalysis] = useState<number>(0);
  const [popup, setPopup] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  useEffect(() => {
    const checkAndResetDailyCredit = async () => {
      if (currentUser) {
        const userRef = doc(db, 'User', currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const lockuntillDate = data.lockuntill ? data.lockuntill.toDate() : null;
          const now = new Date();
          const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
          const tomorrowMidnight = new Date(todayMidnight);
          tomorrowMidnight.setUTCDate(todayMidnight.getUTCDate() + 1);
          const isSameDayUTC = (date1: Date, date2: Date) => (
            date1.getUTCFullYear() === date2.getUTCFullYear() &&
            date1.getUTCMonth() === date2.getUTCMonth() &&
            date1.getUTCDate() === date2.getUTCDate()
          );
          if (lockuntillDate && isSameDayUTC(lockuntillDate, todayMidnight)) {
            await updateDoc(userRef, { analysis: 0 });
            await updateDoc(userRef, { lockuntill: Timestamp.fromDate(tomorrowMidnight) });
          } else if (!lockuntillDate || lockuntillDate < todayMidnight) {
            await updateDoc(userRef, { analysis: 0 });
            await updateDoc(userRef, { lockuntill: Timestamp.fromDate(tomorrowMidnight) });
          }
        }
      }
    };
    checkAndResetDailyCredit();
  }, [currentUser]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'User', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const progress: { [key: string]: boolean } = {};
          const checks: { [key: string]: boolean } = {};
          for (let i = 1; i <= 14; i++) {
            progress[`phrase${i}`] = !!data[`phrase${i}`];
            checks[`check${i}`] = !!data[`check${i}`];
          }
          setPhraseProgress(progress);
          setCheckProgress(checks);
          setAnalysis(typeof data.analysis === 'number' ? data.analysis : 0);
        }
      }
    };
    fetchProgress();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleModuleClick = (phraseId: number) => {
    if (checkProgress[`check${phraseId}`]) {
      setPopup({
        show: true,
        message: `You have already completed Phrase ${phraseId}.`
      });
    } else if (phraseProgress[`phrase${phraseId}`]) {
      if (analysis < 20) {
        navigate(`/module/phrase/${phraseId}`);
      } else {
        setPopup({
          show: true,
          message: 'You have exceeded your daily credit. Try again tomorrow.'
        });
      }
    } else {
      // Find the last unlocked phrase before this one
      let lastUnlocked = 0;
      for (let i = phraseId - 1; i >= 1; i--) {
        if (phraseProgress[`phrase${i}`]) {
          lastUnlocked = i;
          break;
        }
      }
      setPopup({
        show: true,
        message: lastUnlocked > 0
          ? `Please complete Phrase ${lastUnlocked} to unlock the next level.`
          : 'Please complete Phrase 1 to unlock the next level.'
      });
    }
  };

  const closePopup = () => setPopup({ show: false, message: '' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Header with Logo */}
      <Header 
        onLogout={handleLogout}
        showDashboard={true}
        onDashboardClick={() => navigate('/dashboard')}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-amber-900 mb-4">Modules of Azaan</h2>
          <p className="text-xl text-amber-700 mb-2">14 Modules of Azaan</p>
          <p className="text-amber-600">Master each phrase to perfect your call to prayer with MyAzaan</p>
        </div>

        {/* YouTube Video Embed */}
        <div className="flex justify-center mb-10">
          <div className="w-full max-w-4xl aspect-w-16 aspect-h-7 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-300">
            <iframe
              src="https://www.youtube.com/embed/uC_MUqHGs3E?rel=0"
              title="Azaan Training Introduction"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full min-h-[350px]"
            ></iframe>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {phrasesData.map((phrase, index) => {
            const unlocked = phraseProgress[`phrase${phrase.id}`];
            const completed = checkProgress[`check${phrase.id}`];
            // Active phrase: unlocked and not completed
            const isActive = unlocked && !completed;
            return (
              <div
                key={phrase.id}
                className={`group bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-amber-200/50 shadow-lg transition-all duration-300 ${unlocked ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'} animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleModuleClick(phrase.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {phrase.id}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-900">{phrase.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-amber-600">
                        {isActive && <span>{analysis}/20 points</span>}
                        {!unlocked && <Lock className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className={`w-6 h-6 text-amber-500 group-hover:text-amber-700 transition-colors`} />
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-2xl font-amiri text-amber-900 mb-2 leading-relaxed" dir="rtl">
                      {phrase.arabic}
                    </p>
                    <p className="text-amber-700 font-medium italic">
                      {phrase.transliteration}
                    </p>
                  </div>
                  <div className="border-t border-amber-200 pt-3">
                    <p className="text-amber-600 text-center">
                      "{phrase.translation}"
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                    style={{ width: '0%' }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Popup Modal */}
      {popup.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold text-amber-900 mb-4">Locked</h2>
            <p className="text-amber-700 mb-6">{popup.message}</p>
            <button
              onClick={closePopup}
              className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModulesPage;