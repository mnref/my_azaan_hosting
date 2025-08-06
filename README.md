# MyAzaan - Perfect Your Call to Prayer

A React-based web application for practicing and perfecting Islamic prayer recitations with AI-powered feedback.

## 🚀 Features

- **Audio Recording**: Record your prayer recitations with precise timing
- **MP3 Conversion**: Automatic WebM to MP3 conversion using FFmpeg.wasm
- **AI Analysis**: Server-powered pronunciation analysis and feedback
- **Expert Audio**: Listen to expert pronunciations for comparison
- **Waveform Analysis**: Visual representation of audio patterns
- **Multi-Phase Support**: Practice all 14 phases of the call to prayer

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Audio Processing**: FFmpeg.wasm for client-side MP3 conversion
- **Styling**: Tailwind CSS
- **Backend**: Custom API server
- **Storage**: Firebase Storage + Google Cloud Storage
- **Authentication**: Firebase Auth

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd myazaan_duplicate-main

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🌍 Environment Configuration

Copy `env.example` to `.env.local` and configure:

```bash
# API Configuration
VITE_API_BASE_URL=https://your-api-domain.com

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🚀 Deployment

### Netlify Deployment

1. **Connect Repository**:
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables**:
   - Add all environment variables from `.env.local`
   - Set `NODE_ENV=production`

3. **Deploy**:
   - Netlify will automatically build and deploy
   - Your app will be available at `https://your-app.netlify.app`

### Vercel Deployment

1. **Connect Repository**:
   - Connect your GitHub repository to Vercel
   - Vercel will auto-detect Vite configuration

2. **Environment Variables**:
   - Add all environment variables in Vercel dashboard
   - Set `NODE_ENV=production`

3. **Deploy**:
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-app.vercel.app`

### Firebase Hosting

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase**:
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Build and Deploy**:
   ```bash
   npm run build
   firebase deploy
   ```

## 🔧 CORS Configuration

### Google Storage CORS Setup

To ensure audio and waveform files load properly, configure your Google Storage bucket CORS:

```json
[
  {
    "origin": [
      "https://your-domain.com",
      "https://www.your-domain.com",
      "https://your-app.netlify.app",
      "https://your-app.vercel.app"
    ],
    "method": ["GET", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers"
    ],
    "maxAgeSeconds": 3600
  }
]
```

### API Server CORS

Ensure your API server allows requests from your hosted domain:

```javascript
// Example CORS configuration for your API server
app.use(cors({
  origin: [
    'https://your-domain.com',
    'https://www.your-domain.com',
    'https://your-app.netlify.app',
    'https://your-app.vercel.app'
  ],
  credentials: true
}));
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── AudioRecorderWithMP3.tsx
│   ├── Header.tsx
│   ├── LoadingSpinner.tsx
│   └── ProtectedRoute.tsx
├── config/             # Configuration files
│   └── environment.ts
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── data/              # Static data
│   └── phrasesData.ts
├── firebase/          # Firebase configuration
│   └── config.ts
├── hooks/             # Custom React hooks
│   └── useAudioConverter.ts
├── pages/             # Page components
│   ├── DashboardPage.tsx
│   ├── LoginPage.tsx
│   ├── ModulesPage.tsx
│   ├── PhraseDetailPage.tsx
│   └── RegisterPage.tsx
├── services/          # API services
│   └── api.ts
└── utils/             # Utility functions
    ├── AudioConverter.ts
    └── proxyHelper.ts
```

## 🧹 Code Cleanup Summary

### Removed Files (Development/Test)
- `src/pages/CorsTestPage.tsx`
- `src/pages/TestAudioConversion.tsx`
- `src/pages/PhraseDetailPageWithMP3.tsx`
- `src/components/ErrorTest.tsx`
- `src/components/AudioConversionTest.tsx`
- `src/components/MicrophoneTest.tsx`
- `src/components/AudioRecorderIntegration.tsx`
- `src/components/AudioWaveform.tsx`

### Simplified Functions
- **proxyHelper.ts**: Removed 150+ lines of development-specific code
- **Kept only**: `createSafeUrl()`, `isProduction()`, `isStorageUrl()`
- **Removed**: All blob conversion, CORS testing, and development helpers

### Production Optimizations
- **Vite Config**: Added production build optimizations
- **Code Splitting**: Vendor, FFmpeg, and Firebase chunks
- **Environment Config**: Centralized environment management
- **API Service**: Proper error handling and environment-aware URLs

## 🎯 CORS Resolution After Hosting

### ✅ CORS Issues Will Be Resolved

After hosting, CORS issues will be minimal because:

1. **HTTPS Environment**: Both app and storage on HTTPS
2. **Production Detection**: Code uses optimized production paths
3. **No Localhost Conflicts**: No more localhost vs production domain issues

### ⚠️ Remaining Considerations

1. **Google Storage CORS**: Configure bucket CORS settings
2. **API Server CORS**: Allow requests from your hosted domain
3. **Signed URL Expiration**: URLs expire after 30 minutes

## 🚀 Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📊 Performance Optimizations

- **Code Splitting**: Automatic chunk splitting for better loading
- **Asset Optimization**: WASM files properly cached
- **Bundle Analysis**: Vendor chunks separated for better caching
- **Production Build**: Minified and optimized for production

## 🔒 Security Features

- **HTTPS Enforcement**: All resources use HTTPS in production
- **Security Headers**: XSS protection, frame options, content type options
- **CORS Configuration**: Proper origin restrictions
- **Environment Variables**: Sensitive data kept out of client bundle

## 🎵 Audio Features

- **MP3 Conversion**: Client-side WebM to MP3 conversion
- **Precise Timing**: Accurate recording duration for each phrase
- **Expert Audio**: Server-generated pronunciation feedback
- **Waveform Analysis**: Visual audio pattern analysis

## 📱 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **SharedArrayBuffer**: Required for FFmpeg.wasm
- **MediaRecorder API**: Required for audio recording
- **Web Audio API**: Required for audio processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the deployment documentation
- Review the CORS configuration guide 