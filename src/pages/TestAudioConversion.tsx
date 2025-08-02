import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import AudioConversionTest from '../components/AudioConversionTest';
import { ArrowLeft } from 'lucide-react';

const TestAudioConversion: React.FC = () => {
  const navigate = useNavigate();

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

        {/* Test Component */}
        <AudioConversionTest />
      </div>
    </div>
  );
};

export default TestAudioConversion; 