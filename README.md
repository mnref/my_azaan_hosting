# MyAzaan - Perfect Your Call to Prayer

An interactive web application designed to help users learn and perfect their Azaan (Islamic call to prayer) recitation through pattern matching and audio visualization.

## Features

### 🎯 Pattern Matching Waveform
- **Real-time audio visualization** with reference pattern matching
- **Reference pattern** (amber line) shows the ideal Azaan timing and rhythm
- **Your voice pattern** (green line) shows your actual recording in real-time
- **6-second recording sessions** with countdown timer
- **Visual feedback** to help match timing and amplitude

### 📚 Learning Modules
- **14 different Azaan phrases** with progressive difficulty
- **Arabic text** with proper RTL rendering
- **English transliteration** for pronunciation guidance
- **English translation** for understanding
- **Expert demonstration videos** (YouTube embeds)
- **Reference audio** for each phrase

### 🎤 Audio Recording
- **High-quality audio recording** using Web Audio API
- **Real-time waveform visualization** during recording
- **Playback controls** for reviewing your recordings
- **Save recordings** to cloud storage (mock implementation)
- **Progress tracking** per module

### 🔐 User Authentication
- **User registration and login** system
- **Protected routes** for authenticated users
- **Session persistence** using localStorage
- **Mock authentication** service for development

### 🎨 Brand Integration
- **MyAzaan logo** prominently displayed across all pages
- **Consistent amber/orange theme** throughout the application
- **Professional branding** with logo in headers and authentication pages

## Technology Stack

- **Frontend**: React 18.3.1 with TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Routing**: React Router DOM 7.7.0
- **Audio**: Web Audio API, MediaRecorder API
- **Backend**: Firebase (configured, using mock services)

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd azaan-trainer

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage
1. **Register/Login** with your email and password
2. **Browse modules** - 14 different Azaan phrases
3. **Select a module** to start learning
4. **Watch expert demonstration** video
5. **Listen to reference audio** for pronunciation
6. **Record your voice** - try to match the reference pattern
7. **Review and practice** until perfect

## Pattern Matching System

The waveform visualization shows:

- **Gray line**: Reference pattern showing ideal timing and amplitude
- **Green line**: Your voice pattern in real-time
- **Labels**: Key moments in the Azaan (Allah hu, Akbar, etc.)
- **Grid**: Time and amplitude reference lines

### How to Use Pattern Matching
1. Start recording when ready
2. Watch the green line (your voice) as you speak
3. Try to match the timing and amplitude of the gray reference line
4. Practice until your pattern closely matches the reference
5. Use the 6-second countdown to maintain consistent timing

## Project Structure

```
src/
├── components/
│   ├── AudioWaveform.tsx      # Pattern matching visualization
│   ├── LoadingSpinner.tsx     # Loading indicator
│   └── ProtectedRoute.tsx     # Route protection
├── contexts/
│   └── AuthContext.tsx        # Authentication context
├── data/
│   └── phrasesData.ts         # Azaan phrases data
├── firebase/
│   └── config.ts              # Firebase configuration
├── pages/
│   ├── LoginPage.tsx          # User login
│   ├── RegisterPage.tsx       # User registration
│   ├── ModulesPage.tsx        # Main modules listing
│   └── PhraseDetailPage.tsx   # Individual phrase practice
├── services/
│   ├── mockAuth.ts            # Mock authentication
│   ├── mockFirestore.ts       # Mock database
│   └── mockStorage.ts         # Mock storage
└── App.tsx                    # Main application
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Audio Settings
The waveform uses these audio settings for optimal pattern matching:
- **Sample Rate**: 22050 Hz
- **Block Size**: 1024 samples
- **Sensitivity**: 15.0 (adjustable)
- **Recording Duration**: 6 seconds
- **Noise Gate**: Filters out background noise

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Islamic calligraphy and design inspiration
- Web Audio API documentation
- React and TypeScript communities 