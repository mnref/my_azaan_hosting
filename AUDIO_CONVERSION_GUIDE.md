# Audio Conversion System Guide

## Overview

This guide explains how to use the comprehensive audio conversion system that converts WebM recordings to MP3 format using FFmpeg.wasm. The system includes:

1. **AudioConverter Utility** - Core conversion logic
2. **useAudioConverter Hook** - React hook for state management
3. **AudioRecorderWithMP3 Component** - Complete UI component
4. **AudioRecorderIntegration** - Firebase integration example

## Quick Start

### 1. Basic Usage

```tsx
import AudioRecorderWithMP3 from './components/AudioRecorderWithMP3';

function MyComponent() {
  const handleRecordingComplete = (result) => {
    console.log('MP3 conversion complete:', result);
    // result contains: mp3Blob, duration, fileSize, metadata
  };

  return (
    <AudioRecorderWithMP3
      onRecordingComplete={handleRecordingComplete}
      maxDuration={30}
      autoConvert={true}
    />
  );
}
```

### 2. With Firebase Integration

```tsx
import AudioRecorderIntegration from './components/AudioRecorderIntegration';

function MyPage() {
  return (
    <AudioRecorderIntegration
      phraseId={1}
      onUploadComplete={(url) => console.log('Uploaded to:', url)}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

## Component Props

### AudioRecorderWithMP3

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onRecordingComplete` | `(result: ConversionResult) => void` | - | Callback when MP3 conversion completes |
| `onError` | `(error: string) => void` | - | Error handler callback |
| `maxDuration` | `number` | `30` | Maximum recording duration in seconds |
| `autoConvert` | `boolean` | `true` | Auto-convert to MP3 after recording |
| `showSettings` | `boolean` | `true` | Show conversion quality settings |
| `className` | `string` | `''` | Additional CSS classes |

### AudioRecorderIntegration

| Prop | Type | Description |
|------|------|-------------|
| `phraseId` | `number` | ID for Firebase storage organization |
| `onUploadComplete` | `(url: string) => void` | Callback when upload completes |
| `onError` | `(error: string) => void` | Error handler callback |

## Conversion Quality Options

The system supports three quality presets:

- **Low**: 64kbps - Smaller file size, lower quality
- **Medium**: 128kbps - Balanced quality and size (default)
- **High**: 192kbps - Higher quality, larger file size

You can also set custom bitrates (32-320 kbps).

## Integration Examples

### 1. Replace Existing Recording in PhraseDetailPage

```tsx
// In your existing PhraseDetailPage.tsx
import AudioRecorderWithMP3 from '../components/AudioRecorderWithMP3';

// Replace the existing recording section with:
<div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 shadow-lg">
  <h3 className="text-xl font-semibold text-amber-900 mb-6 flex items-center space-x-2">
    <Mic className="w-6 h-6" />
    <span>Recording Section</span>
  </h3>
  
  <AudioRecorderWithMP3
    onRecordingComplete={handleRecordingComplete}
    onError={handleRecordingError}
    maxDuration={phrase!.duration}
    autoConvert={true}
    showSettings={true}
  />
</div>
```

### 2. Add to New Page

```tsx
import React from 'react';
import AudioRecorderWithMP3 from '../components/AudioRecorderWithMP3';

const RecordingPage: React.FC = () => {
  const handleRecordingComplete = async (result) => {
    // Handle the converted MP3
    console.log('File size:', result.fileSize);
    console.log('Duration:', result.duration);
    
    // Upload to your backend
    const formData = new FormData();
    formData.append('audio', result.mp3Blob, 'recording.mp3');
    
    await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Audio Recording</h1>
      <AudioRecorderWithMP3
        onRecordingComplete={handleRecordingComplete}
        onError={(error) => alert(`Error: ${error}`)}
        maxDuration={60}
        autoConvert={true}
      />
    </div>
  );
};
```

## Firebase Storage Integration

### 1. Upload MP3 to Firebase

```tsx
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

const uploadToFirebase = async (mp3Blob: Blob, userId: string) => {
  const filename = `recording_${userId}_${Date.now()}.mp3`;
  const storageRef = ref(storage, `recordings/${userId}/${filename}`);
  
  await uploadBytes(storageRef, mp3Blob);
  const downloadUrl = await getDownloadURL(storageRef);
  
  return downloadUrl;
};
```

### 2. Update User Progress

```tsx
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';

const updateUserProgress = async (userId: string, phraseId: number, result: ConversionResult) => {
  const userRef = doc(db, 'User', userId);
  
  await updateDoc(userRef, {
    [`phrase${phraseId}`]: true,
    [`recording${phraseId}`]: result.mp3Blob,
    [`recording${phraseId}Size`]: result.fileSize,
    [`recording${phraseId}Duration`]: result.duration,
    analysis: increment(1)
  });
};
```

## Testing

### 1. Test Conversion Functionality

```tsx
import { AudioConverter } from '../utils/AudioConverter';

const testConversion = async () => {
  const converter = AudioConverter.getInstance();
  
  // Create a test WebM blob
  const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(testStream);
  const chunks: BlobPart[] = [];
  
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.onstop = async () => {
    const webmBlob = new Blob(chunks, { type: 'audio/webm' });
    
    try {
      const result = await converter.convertWebMToMP3(webmBlob, {
        quality: 'medium'
      });
      
      console.log('Conversion successful:', result);
    } catch (error) {
      console.error('Conversion failed:', error);
    }
  };
  
  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), 3000);
};
```

### 2. Test Component Integration

```tsx
// Test the complete component
const TestComponent = () => {
  const [results, setResults] = useState([]);
  
  const handleRecordingComplete = (result) => {
    setResults(prev => [...prev, result]);
  };
  
  return (
    <div>
      <AudioRecorderWithMP3
        onRecordingComplete={handleRecordingComplete}
        onError={(error) => console.error(error)}
      />
      
      <div className="mt-4">
        <h3>Test Results:</h3>
        {results.map((result, index) => (
          <div key={index}>
            Recording {index + 1}: {result.fileSize} bytes, {result.duration}s
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Performance Optimization

### 1. Mobile Device Optimization

```tsx
// Use lower quality settings for mobile
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

<AudioRecorderWithMP3
  onRecordingComplete={handleRecordingComplete}
  maxDuration={isMobile ? 15 : 30} // Shorter recordings on mobile
  autoConvert={true}
  // The component will automatically use lower quality on mobile
/>
```

### 2. Memory Management

```tsx
// Clean up resources when component unmounts
useEffect(() => {
  return () => {
    // Cleanup is handled automatically by the hook
    // But you can add additional cleanup here
  };
}, []);
```

### 3. Progressive Loading

```tsx
// Load FFmpeg only when needed
const [showRecorder, setShowRecorder] = useState(false);

return (
  <div>
    <button onClick={() => setShowRecorder(true)}>
      Start Recording
    </button>
    
    {showRecorder && (
      <AudioRecorderWithMP3
        onRecordingComplete={handleRecordingComplete}
        onError={handleError}
      />
    )}
  </div>
);
```

## Error Handling

### 1. Common Errors and Solutions

```tsx
const handleError = (error: string) => {
  if (error.includes('FFmpeg')) {
    // FFmpeg initialization failed
    console.error('Audio conversion not supported in this browser');
    // Fallback to WebM format
  } else if (error.includes('permission')) {
    // Microphone permission denied
    alert('Please allow microphone access to record audio');
  } else if (error.includes('network')) {
    // Network error during upload
    alert('Network error. Please check your connection and try again');
  }
};
```

### 2. Fallback Strategy

```tsx
const [useMP3Conversion, setUseMP3Conversion] = useState(true);

// Check if FFmpeg is supported
useEffect(() => {
  const checkSupport = async () => {
    try {
      const converter = AudioConverter.getInstance();
      const isSupported = await converter.isSupported();
      setUseMP3Conversion(isSupported);
    } catch (error) {
      setUseMP3Conversion(false);
    }
  };
  
  checkSupport();
}, []);

return (
  <div>
    {useMP3Conversion ? (
      <AudioRecorderWithMP3 onRecordingComplete={handleRecordingComplete} />
    ) : (
      <div>
        <p>MP3 conversion not supported. Using WebM format.</p>
        {/* Fallback to original WebM recorder */}
      </div>
    )}
  </div>
);
```

## Browser Compatibility

### Supported Browsers
- Chrome 67+
- Firefox 60+
- Safari 11.1+
- Edge 79+

### Features by Browser
- **WebM Recording**: All modern browsers
- **FFmpeg.wasm**: Chrome, Firefox, Safari (with limitations)
- **Firebase Storage**: All modern browsers

## Troubleshooting

### 1. FFmpeg Loading Issues
```tsx
// Check if FFmpeg is loading correctly
const checkFFmpeg = async () => {
  try {
    const converter = AudioConverter.getInstance();
    const status = converter.getStatus();
    console.log('FFmpeg status:', status);
  } catch (error) {
    console.error('FFmpeg check failed:', error);
  }
};
```

### 2. Memory Issues
```tsx
// Monitor memory usage
const monitorMemory = () => {
  if ('memory' in performance) {
    console.log('Memory usage:', performance.memory);
  }
};
```

### 3. Network Issues
```tsx
// Handle slow connections
const handleSlowConnection = () => {
  const connection = (navigator as any).connection;
  if (connection && connection.effectiveType === 'slow-2g') {
    // Use lower quality settings
    return { quality: 'low' as const };
  }
  return { quality: 'medium' as const };
};
```

## Best Practices

1. **Always handle errors gracefully** - Provide fallbacks for unsupported browsers
2. **Use appropriate quality settings** - Balance quality vs file size
3. **Clean up resources** - The components handle this automatically
4. **Test on multiple devices** - Especially mobile devices
5. **Monitor performance** - Watch for memory leaks and slow conversions
6. **Provide user feedback** - Show progress and status messages
7. **Implement retry logic** - For network failures and conversion errors

## API Reference

### AudioConverter Methods

- `getInstance(config?)` - Get singleton instance
- `initialize()` - Initialize FFmpeg
- `convertWebMToMP3(blob, options, onProgress?)` - Convert WebM to MP3
- `isSupported()` - Check if conversion is supported
- `cleanup()` - Clean up resources
- `getStatus()` - Get current status

### useAudioConverter Hook

- `isInitializing` - FFmpeg initialization status
- `isConverting` - Conversion in progress
- `isReady` - Ready to convert
- `isSupported` - Browser support status
- `error` - Current error message
- `progress` - Conversion progress
- `convertWebMToMP3()` - Convert function
- `resetError()` - Clear error
- `checkSupport()` - Check support
- `cleanup()` - Clean up

This comprehensive system provides a production-ready solution for audio recording and MP3 conversion in your Islamic prayer app. 