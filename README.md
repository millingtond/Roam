# 🎧 Audio Walking Tour App

A React Native (Expo) application for GPS-triggered audio walking tours with offline support. Create immersive, location-based audio experiences that automatically play narrations as users walk through points of interest.

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![Expo](https://img.shields.io/badge/Expo-SDK%2051-000020)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🗺️ Core Tour Experience
- **GPS-Triggered Audio**: Audio automatically plays when entering geofenced areas
- **Interactive Map**: Real-time location tracking with stop markers and route visualization
- **Smart Navigation**: Turn-by-turn walking directions between stops
- **Progress Tracking**: Persistent progress that survives app restarts

### 📱 User Features
- **Tour Favorites**: Bookmark tours for quick access
- **Star Ratings & Reviews**: Rate completed tours and write reviews
- **Personal Notes**: Add notes to tours or specific stops
- **Resume Tours**: Continue where you left off with one tap
- **Share via QR Code**: Share tours with friends easily
- **Progress Indicators**: Visual progress percentage on all tour cards

### 📴 Offline Support
- **Complete Offline Mode**: Download audio, images, and map tiles
- **Background Downloads**: Continue downloads while using other apps
- **Smart Tile Caching**: Only downloads tiles for the tour area
- **Storage Management**: View and delete offline data per tour

### 🛠️ Tour Creator (Web Tool)
- **Visual Map Editor**: Drag-and-drop stop placement
- **Auto Walking Directions**: Generates turn-by-turn instructions via OSRM
- **Route Optimization**: One-click shortest path calculation
- **AI Script Helper**: Generate prompts for writing narration scripts
- **Accessibility Options**: Mark wheelchair access, stairs, terrain difficulty
- **Multiple Export Formats**: JSON, GPX, CSV, Python commands
- **Dark Mode**: Easy on the eyes for long editing sessions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Physical device recommended for GPS testing

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/audio-tour-app.git
cd audio-tour-app

# Install dependencies
npm install

# Install iOS pods (Mac only)
cd ios && pod install && cd ..

# Start the development server
npx expo start
```

### Running on Device

```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# Physical device (scan QR code)
npx expo start
```

## 📁 Project Structure

```
audio-tour-app/
├── src/
│   ├── components/
│   │   ├── AudioPlayerBar.tsx      # Audio playback controls
│   │   ├── MapDisplay.tsx          # Interactive map with markers
│   │   ├── NavigationControls.tsx  # Next/previous stop buttons
│   │   ├── OfflineManager.tsx      # Offline download modal
│   │   ├── ResumeTourBanner.tsx    # Resume in-progress tours
│   │   ├── RouteDirections.tsx     # Walking direction display
│   │   ├── ScriptViewer.tsx        # Script/transcript viewer
│   │   ├── ShareTourModal.tsx      # QR code sharing
│   │   ├── StopListPanel.tsx       # Collapsible stop list
│   │   ├── TourCard.tsx            # Tour list card component
│   │   ├── TourNotesModal.tsx      # Notes management
│   │   └── TourRatingModal.tsx     # Star rating modal
│   ├── hooks/
│   │   ├── useAudioPlayer.ts       # Audio playback logic
│   │   ├── useGeofence.ts          # Geofencing logic
│   │   ├── useLocation.ts          # GPS location tracking
│   │   ├── useSettings.ts          # App settings
│   │   ├── useTourProgress.ts      # Tour progress state
│   │   └── useTourUserData.ts      # Favorites, ratings, notes
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Tour list with filters
│   │   ├── TourScreen.tsx          # Active tour view
│   │   └── SettingsScreen.tsx      # App settings
│   ├── services/
│   │   ├── tourLoader.ts           # Tour JSON loading
│   │   └── seedData.ts             # Sample data for testing
│   └── types/
│       └── tour.ts                 # TypeScript interfaces
├── assets/
│   └── tours/                      # Tour data and media
├── tools/
│   ├── tour-creator.html           # Web-based tour creator
│   └── generate_audio.py           # TTS audio generation
├── app.json                        # Expo configuration
└── package.json
```

## 🎨 Creating Tours

### Using the Tour Creator Tool

1. Open `tools/tour-creator.html` in a web browser
2. Click on the map to add stops
3. Fill in stop details (name, script, directions)
4. Use "Generate Directions" for automatic walking instructions
5. Export as `tour.json`

### Tour JSON Structure

```json
{
  "id": "my-tour",
  "name": "Historic Downtown Walk",
  "description": "Explore the rich history...",
  "version": "1.0",
  "author": "Your Name",
  "language": "en",
  "stops": [
    {
      "id": 1,
      "name": "Town Hall",
      "latitude": 53.4808,
      "longitude": -2.2426,
      "triggerRadius": 30,
      "audioFile": "audio/stop1.mp3",
      "imageFile": "images/stop1.jpg",
      "script": "Welcome to the historic Town Hall...",
      "directionToNext": "Head north on Market Street for 150 meters..."
    }
  ],
  "startPoint": {
    "latitude": 53.4808,
    "longitude": -2.2426,
    "address": "Town Hall, Manchester"
  },
  "totalDistance": 2.5,
  "estimatedDuration": 45,
  "difficulty": "easy",
  "accessibility": {
    "wheelchairAccessible": true,
    "hasStairs": false
  }
}
```

### Generating Audio Files

Use the included Python script with OpenAI TTS:

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="your-key-here"

# Generate audio for all stops
python tools/generate_audio.py tours/my-tour/tour.json

# Or use a specific voice
python tools/generate_audio.py tours/my-tour/tour.json --voice nova
```

Available voices: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`

## ⚙️ Configuration

### App Settings (app.json)

```json
{
  "expo": {
    "name": "Audio Tour",
    "slug": "audio-tour",
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Audio Tour to use your location for GPS-triggered audio playback."
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["location", "audio"]
      }
    }
  }
}
```

### Geofence Settings

Adjust in `src/hooks/useGeofence.ts`:

```typescript
const DEFAULT_TRIGGER_RADIUS = 30; // meters
const LOCATION_UPDATE_INTERVAL = 5000; // ms
```

## 📦 Dependencies

### Core
- `expo` - Development platform
- `react-native` - UI framework
- `expo-location` - GPS tracking
- `expo-av` - Audio playback
- `expo-file-system` - File management
- `expo-haptics` - Tactile feedback

### Maps
- `react-native-maps` - Map display
- Map tiles from OpenStreetMap

### Storage
- `@react-native-async-storage/async-storage` - Persistent storage

### Navigation
- `@react-navigation/native` - Navigation framework
- `@react-navigation/stack` - Stack navigator

## 🧪 Testing

### Test Plan

#### Unit Tests
```bash
npm test
```

#### GPS Simulation (iOS Simulator)
1. Open Simulator
2. Features → Location → Custom Location
3. Enter coordinates from your tour

#### GPS Simulation (Android)
1. Use a GPS spoofing app
2. Or use Android Studio's emulator location controls

### Manual Test Checklist

#### Home Screen
- [ ] Tours load and display correctly
- [ ] Favorites toggle works
- [ ] Progress percentage displays accurately
- [ ] Resume banner appears for in-progress tours
- [ ] Filter tabs work (All, Favorites, In Progress, Completed)

#### Tour Playback
- [ ] Audio plays when entering geofence
- [ ] Audio pauses/resumes correctly
- [ ] Seek bar works accurately
- [ ] Progress saves when leaving tour
- [ ] Directions display between stops

#### Offline Mode
- [ ] Download completes successfully
- [ ] Audio plays without network
- [ ] Map tiles display offline
- [ ] Delete removes all cached data

#### Ratings & Notes
- [ ] Can add/edit/delete ratings
- [ ] Can add notes to tours and stops
- [ ] Data persists across app restarts

## 🐛 Troubleshooting

### GPS Not Working
- Ensure location permissions are granted
- Check that location services are enabled
- Try outdoors for better GPS signal
- Verify `expo-location` is properly configured

### Audio Not Playing
- Check device volume and mute switch
- Verify audio files exist at specified paths
- Test with `expo-av` debug logging enabled

### Map Not Loading
- Check internet connection
- Verify OpenStreetMap tile servers are accessible
- Clear app cache and reload

### Offline Downloads Failing
- Ensure sufficient storage space
- Check network stability during download
- Try downloading on WiFi

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) for map tiles
- [OSRM](http://project-osrm.org/) for routing/directions API
- [Expo](https://expo.dev/) for the amazing development platform
- [OpenAI](https://openai.com/) for TTS voice generation

---

Built with ❤️ for explorers everywhere