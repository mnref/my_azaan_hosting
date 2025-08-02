import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import Header from '../components/Header';
import { ArrowLeft, Trophy, Target, Clock, TrendingUp, Award, CheckCircle, Lock, Play } from 'lucide-react';

interface DashboardData {
  // From User collection
  totalScore: number;
  completedPhrases: number;
  unlockedPhrases: number;
  completionPercentage: number;
  dailyAnalysisCount: number;
  remainingCredits: number;
  currentActivePhrase: number;
  displayName: string;
  email: string;
  
  // From api_call_analysis collection
  totalAttempts: number;
  successRate: number;
  recentAttempts: Array<{
    phrase: string;
    status: string;
    similarity?: number;
    timestamp: Date;
  }>;
  phraseProgress: { [key: string]: boolean };
  checkProgress: { [key: string]: boolean };
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;

      try {
        // Fetch user data from real Firestore
        const userRef = doc(db, 'User', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.error('User document not found in Firestore');
          return;
        }

        const userData = userDoc.data();
        
        // Calculate progress metrics
        const phraseProgress: { [key: string]: boolean } = {};
        const checkProgress: { [key: string]: boolean } = {};
        let completedPhrases = 0;
        let unlockedPhrases = 0;
        let currentActivePhrase = 0;

        for (let i = 1; i <= 14; i++) {
          phraseProgress[`phrase${i}`] = !!userData[`phrase${i}`];
          checkProgress[`check${i}`] = !!userData[`check${i}`];
          
          if (userData[`check${i}`]) {
            completedPhrases++;
          }
          if (userData[`phrase${i}`]) {
            unlockedPhrases++;
            if (currentActivePhrase === 0) {
              currentActivePhrase = i;
            }
          }
        }

        // Fetch recent attempts from api_call_analysis (simplified query to avoid index requirement)
        const analysisQuery = query(
          collection(db, 'api_call_analysis'),
          where('user_email', '==', currentUser.email),
          limit(50) // Get more documents to sort client-side
        );
        
        const analysisSnapshot = await getDocs(analysisQuery);
        const recentAttempts = analysisSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              phrase: data.phrase,
              status: data.validation_status,
              timestamp: data.timestamp?.toDate() || new Date(),
            };
          })
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Sort client-side
          .slice(0, 10); // Take only the 10 most recent

        // Calculate success rate
        const totalAttempts = recentAttempts.length;
        const successfulAttempts = recentAttempts.filter(attempt => 
          attempt.status === 'Pass' || attempt.status === 'Validated'
        ).length;
        const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

        setDashboardData({
          totalScore: userData.score || 0,
          completedPhrases,
          unlockedPhrases,
          completionPercentage: Math.round((completedPhrases / 14) * 100),
          dailyAnalysisCount: userData.analysis || 0,
          remainingCredits: 20 - (userData.analysis || 0),
          currentActivePhrase,
          displayName: userData.display_name || currentUser.displayName || 'User',
          email: userData.email || currentUser.email || '',
          totalAttempts,
          successRate: Math.round(successRate),
          recentAttempts,
          phraseProgress,
          checkProgress,
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default data if there's an error
        setDashboardData({
          totalScore: 0,
          completedPhrases: 0,
          unlockedPhrases: 1, // At least phrase1 should be unlocked
          completionPercentage: 0,
          dailyAnalysisCount: 0,
          remainingCredits: 20,
          currentActivePhrase: 1,
          displayName: currentUser.displayName || 'User',
          email: currentUser.email || '',
          totalAttempts: 0,
          successRate: 0,
          recentAttempts: [],
          phraseProgress: { phrase1: true },
          checkProgress: {},
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-amber-800">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-amber-800">Unable to load dashboard data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header 
        showLogout={true}
        title="Dashboard"
        subtitle="Your Learning Journey"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/modules')}
          className="flex items-center text-amber-700 hover:text-amber-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Modules
        </button>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Score */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Total Score</p>
                <p className="text-3xl font-bold text-amber-800">{dashboardData.totalScore}</p>
              </div>
              <Trophy className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Progress</p>
                <p className="text-3xl font-bold text-amber-800">{dashboardData.completionPercentage}%</p>
                <p className="text-xs text-amber-600">{dashboardData.completedPhrases}/14 phrases</p>
              </div>
              <Target className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          {/* Daily Credits */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Daily Credits</p>
                <p className="text-3xl font-bold text-amber-800">{dashboardData.remainingCredits}</p>
                <p className="text-xs text-amber-600">remaining</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Success Rate</p>
                <p className="text-3xl font-bold text-amber-800">{dashboardData.successRate}%</p>
                <p className="text-xs text-amber-600">recent attempts</p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Progress Overview */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-amber-200">
            <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Learning Progress
            </h3>
            <div className="space-y-3">
              {Array.from({ length: 14 }, (_, i) => i + 1).map((phraseId) => {
                const isCompleted = dashboardData.checkProgress[`check${phraseId}`];
                const isUnlocked = dashboardData.phraseProgress[`phrase${phraseId}`];
                const isActive = phraseId === dashboardData.currentActivePhrase;

                return (
                  <div key={phraseId} className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                    <div className="flex items-center">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      ) : isUnlocked ? (
                        <Play className="w-5 h-5 text-amber-500 mr-3" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-400 mr-3" />
                      )}
                      <span className={`font-medium ${
                        isCompleted ? 'text-green-700' : 
                        isUnlocked ? 'text-amber-700' : 'text-gray-500'
                      }`}>
                        Phrase {phraseId}
                      </span>
                      {isActive && (
                        <span className="ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-amber-600">
                      {isCompleted ? 'Completed' : isUnlocked ? 'Unlocked' : 'Locked'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-amber-200">
            <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Activity
            </h3>
            {dashboardData.recentAttempts.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentAttempts.map((attempt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                    <div>
                      <p className="font-medium text-amber-800">{attempt.phrase}</p>
                      <p className="text-sm text-amber-600">
                        {attempt.timestamp.toLocaleDateString()} at {attempt.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      attempt.status === 'Pass' ? 'bg-green-100 text-green-700' :
                      attempt.status === 'Validated' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {attempt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-amber-600">No recent activity</p>
                <p className="text-sm text-amber-500 mt-2">Start practicing to see your progress here!</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-md border border-amber-200">
          <h3 className="text-lg font-semibold text-amber-800 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-amber-600">Display Name</p>
              <p className="font-medium text-amber-800">{dashboardData.displayName}</p>
            </div>
            <div>
              <p className="text-sm text-amber-600">Email</p>
              <p className="font-medium text-amber-800">{dashboardData.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 