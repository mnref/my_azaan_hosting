import React from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  countdown: number;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ isRecording, countdown }) => {
  // Only show the countdown and recording indicator, no waveform or instructions
  return (
    <div className="relative w-full flex flex-col items-center justify-center min-h-[60px]">
      {/* Countdown overlay */}
      {isRecording && countdown > 0 && (
        <div className="flex items-center justify-center mb-4">
          <div className="bg-red-500/90 text-white px-6 py-3 rounded-full font-bold text-2xl animate-pulse">
            {countdown}s
          </div>
        </div>
      )}
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-600 font-medium text-sm">REC</span>
        </div>
      )}
    </div>
  );
};

export default AudioWaveform;