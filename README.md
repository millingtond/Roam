# Audio Tour App

A personal GPS-triggered audio walking tour app for Android. Create tours for any city using your LLM subscriptions for script generation and free text-to-speech for audio.

## Features

### Core Tour Experience
- **GPS Location Tracking** - Real-time position on interactive map
- **Route Visualization** - Red line showing walking path with numbered pins
- **Auto-Play Triggers** - Audio plays automatically when you reach a stop
- **Full Audio Controls** - Play/pause, ±15s skip, speed control (0.5x-2x)
- **Background Playback** - Audio continues even when screen is locked

### Navigation
- **Manual Mode** - Click through stops when GPS is unreliable (indoors, poor signal)
- **GPS Mode** - Automatic stop detection based on proximity
- **Route Directions** - Visual and spoken directions between stops (e.g., "Turn left at the fountain")
- **GPS Accuracy Indicator** - See signal quality in real-time

### Offline Capability
- **Download Tours** - Pre-download all content for airplane mode
- **Offline Maps** - Map tiles cached for your tour area
- **No Data Required** - Works perfectly without internet after download

### Organization
- **Stop List View** - See all stops, progress tracking
- **Script Viewer** - Read full transcript while listening
- **Photo Display** - Images for each stop
- **Progress Saving** - Resume where you left off

## Quick Start

### 1. Install Dependencies

```bash
cd audio-tour-app
npm install
```

### 2. Set Up Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable "Maps SDK for Android"
3. Create an API key
4. Add to `app.json`:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_API_KEY_HERE"
    }
  }
}
```

### 3. Run the App

```bash
# Install Expo Go on your Android phone from Play Store
npx expo start

# Scan QR code with Expo Go app
```

## Creating Tours

### Easy Way: Use the Tour Creator Web App

Open `tools/tour-creator.html` in your browser - no installation needed!

**Features:**
- 🗺️ **Click on map** to add stops
- 📍 **Search** for any city or location
- ✏️ **Edit** stop names and scripts inline
- 🔄 **Drag markers** to adjust positions
- ↕️ **Reorder** stops with up/down buttons
- 💾 **Auto-saves** to browser storage
- 📤 **Export** ready-to-use tour.json

**Workflow:**
1. Open `tour-creator.html` in Chrome/Firefox
2. Search for your city
3. Click on map to add each stop
4. Enter the script for each stop
5. Click "Export Tour" to download `tour.json`
6. Run `python generate_audio.py ./your-tour-folder` to create MP3s

### Tour Folder Structure

> **Note:** The Tour Creator handles all this for you - but here's the structure if you prefer manual editing.

Each tour is a folder containing:

```
tours/
  my-city-tour/
    tour.json           # Tour configuration
    audio/
      01-stop.mp3
      02-stop.mp3
      ...
    images/
      01-stop.jpg
      02-stop.jpg
      ...
```

### tour.json Schema

```json
{
  "id": "my-city-tour",
  "name": "My City Walking Tour",
  "description": "A 2-hour walk through the historic center",
  "language": "en",
  "estimatedDuration": 120,
  "totalDistance": 2.4,
  "createdDate": "2025-01-15",
  "author": "Your Name",
  
  "startPoint": {
    "latitude": 52.4064,
    "longitude": 16.9342,
    "instruction": "Start at the main square"
  },
  
  "stops": [
    {
      "id": 1,
      "name": "First Stop Name",
      "latitude": 52.4064,
      "longitude": 16.9342,
      "triggerRadius": 25,
      "audioFile": "audio/01-stop.mp3",
      "audioDuration": 90,
      "imageFile": "images/01-stop.jpg",
      "script": "Full transcript of what is spoken...",
      "directionToNext": "Walk north along the main street",
      "distanceToNext": 150
    }
  ],
  
  "route": {
    "type": "walking",
    "waypoints": [
      [52.4064, 16.9342],
      [52.4078, 16.9335]
    ]
  }
}
```

### Step-by-Step Tour Creation

#### 1. Research & Plan

- Identify 8-15 stops (typical for 1-2 hour tour)
- Plan a logical walking route
- Research history/facts for each location

#### 2. Get GPS Coordinates

**Method A: Google Maps**
- Right-click any location
- First option shows coordinates
- Click to copy

**Method B: What3Words or GPS app**
- Use any GPS app to record coordinates on location

#### 3. Generate Scripts with Claude/ChatGPT

Use this prompt template:

```
I'm creating an audio walking tour. Write a 60-90 second 
narration script for [LOCATION NAME] that:

- Opens with a hook or interesting fact
- Provides historical context
- Describes what the visitor is seeing
- Ends with a transition to walking to the next stop

Location: [NAME]
Type: [museum/church/square/etc]
Key facts: [YOUR RESEARCH]

Style: Conversational, engaging, as if a knowledgeable 
friend is showing you around.
```

#### 4. Generate Audio (Free)

Install Edge TTS:
```bash
pip install edge-tts
```

Run the generator:
```bash
python tools/generate_audio.py ./tours/my-city-tour
```

Options:
```bash
# List available voices
python tools/generate_audio.py --list-voices

# Use different voice
python tools/generate_audio.py ./tours/my-city-tour --voice en-US-GuyNeural

# Overwrite existing files
python tools/generate_audio.py ./tours/my-city-tour --overwrite
```

**Recommended Voices:**
- `en-GB-RyanNeural` - Warm British male (default)
- `en-GB-SoniaNeural` - Clear British female
- `en-US-GuyNeural` - Friendly American male
- `en-AU-WilliamNeural` - Relaxed Australian male

#### 5. Add Images

- Take photos at each stop, or
- Use Google Street View screenshots
- Resize to ~800x600px
- Name matching audioFile pattern

#### 6. Map the Route

For the waypoints array:
1. Use Google Maps directions (walking)
2. Add waypoints every 50-100m along the route
3. Extract as coordinate pairs

Or use the simpler approach: just use stop coordinates and the app will draw a straight-line route.

### Copying Tours to Device

**Option A: USB Transfer**
1. Connect phone to computer
2. Copy tour folder to: `Android/data/com.daniels.audiotour/files/tours/`

**Option B: ADB**
```bash
adb push ./tours/my-city-tour /sdcard/Android/data/com.daniels.audiotour/files/tours/
```

## Development

### Project Structure

```

Note: `src/services/seedData.ts` uses static `require()` statements for tour assets. React Native bundling does not allow dynamic `require()` for local files, so add each asset explicitly.
audio-tour-app/
├── App.tsx                 # Main app entry
├── app.json               # Expo configuration
├── src/
│   ├── components/        # UI components
│   │   ├── AudioPlayerBar.tsx
│   │   ├── MapDisplay.tsx
│   │   ├── StopListPanel.tsx
│   │   └── ScriptViewer.tsx
│   ├── screens/           # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── TourScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── hooks/             # Custom hooks
│   │   ├── useLocation.ts
│   │   ├── useAudioPlayer.ts
│   │   ├── useGeofence.ts
│   │   └── useTourProgress.ts
│   ├── services/          # Business logic
│   │   └── tourLoader.ts
│   └── types/             # TypeScript definitions
│       └── tour.ts
└── tools/
    └── generate_audio.py  # Audio generation script
```

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure build
eas build:configure

# Build APK for testing
eas build --platform android --profile preview

# Build for Play Store
eas build --platform android --profile production
```

### Key Dependencies

- `expo-location` - GPS tracking
- `expo-av` - Audio playback
- `react-native-maps` - Map display
- `@react-navigation/native` - Navigation

## Troubleshooting

### Location not updating
- Check location permissions in device settings
- Ensure GPS is enabled
- Try stepping outside for better signal

### Audio not playing
- Check file paths in tour.json match actual files
- Verify MP3 files are valid
- Check device volume

### Map not showing
- Verify Google Maps API key is set
- Check API key has Maps SDK enabled
- Check network connection for initial map tiles

## Cost Summary

| Item | Cost |
|------|------|
| React Native / Expo | Free |
| Google Maps API | Free (28k loads/month) |
| Edge TTS audio | Free (unlimited) |
| Script generation | Free (your LLM subscriptions) |

**Total: £0**

## License

Personal use only. Not for commercial distribution.
