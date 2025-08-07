// Audio Duration Fix - Ensures consistent recording durations across all phrases

export interface PhraseDurationConfig {
  phraseId: number;
  duration: number;
  tolerance: number; // milliseconds
}

// Standard durations for all phrases (in seconds)
export const PHRASE_DURATIONS: PhraseDurationConfig[] = [
  { phraseId: 1, duration: 6, tolerance: 500 },
  { phraseId: 2, duration: 8, tolerance: 500 },
  { phraseId: 3, duration: 8, tolerance: 500 },
  { phraseId: 4, duration: 9, tolerance: 500 },
  { phraseId: 5, duration: 7, tolerance: 500 },
  { phraseId: 6, duration: 7, tolerance: 500 },
  { phraseId: 7, duration: 8, tolerance: 500 },
  { phraseId: 8, duration: 8, tolerance: 500 },
  { phraseId: 9, duration: 8, tolerance: 500 },
  { phraseId: 10, duration: 8, tolerance: 500 },
  { phraseId: 11, duration: 6, tolerance: 500 },
  { phraseId: 12, duration: 6, tolerance: 500 },
  { phraseId: 13, duration: 6, tolerance: 500 },
  { phraseId: 14, duration: 8, tolerance: 500 }
];

/**
 * Get the correct duration for a specific phrase
 */
export const getPhraseDuration = (phraseId: number): number => {
  const config = PHRASE_DURATIONS.find(p => p.phraseId === phraseId);
  return config ? config.duration : 6; // Default to 6 seconds
};

/**
 * Get the tolerance for a specific phrase
 */
export const getPhraseTolerance = (phraseId: number): number => {
  const config = PHRASE_DURATIONS.find(p => p.phraseId === phraseId);
  return config ? config.tolerance : 500; // Default to 500ms
};

/**
 * Calculate precise timing for recording
 */
export const calculateRecordingTiming = (phraseId: number) => {
  const duration = getPhraseDuration(phraseId);
  const tolerance = getPhraseTolerance(phraseId);
  
  return {
    targetDuration: duration,
    toleranceMs: tolerance,
    maxDuration: duration + (tolerance / 1000),
    minDuration: duration - (tolerance / 1000)
  };
};

/**
 * Check if a recording duration is acceptable
 */
export const isRecordingDurationValid = (phraseId: number, actualDuration: number): boolean => {
  const timing = calculateRecordingTiming(phraseId);
  return actualDuration >= timing.minDuration && actualDuration <= timing.maxDuration;
};

/**
 * Format duration for display
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get duration message for UI
 */
export const getDurationMessage = (phraseId: number, actualDuration: number): string => {
  const targetDuration = getPhraseDuration(phraseId);
  const isValid = isRecordingDurationValid(phraseId, actualDuration);
  
  if (isValid) {
    return `Perfect! ${formatDuration(actualDuration)} (Target: ${formatDuration(targetDuration)})`;
  } else if (actualDuration < targetDuration) {
    return `Too short! ${formatDuration(actualDuration)} (Need: ${formatDuration(targetDuration)})`;
  } else {
    return `Too long! ${formatDuration(actualDuration)} (Target: ${formatDuration(targetDuration)})`;
  }
};
