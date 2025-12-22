# Audio Tour App - Test Plan

## Overview

This document outlines the testing strategy for the Audio Tour mobile application. It covers unit tests, integration tests, and manual testing procedures.

---

## 1. Unit Tests

### 1.1 Hooks Tests

#### `useTourUserData.ts`

```typescript
// __tests__/hooks/useTourUserData.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFavorites, useTourRatings, useTourNotes, useTourProgressData } from '../../src/hooks/useTourUserData';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('useFavorites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should load favorites from storage on mount', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['tour1', 'tour2']));
    
    const { result, waitForNextUpdate } = renderHook(() => useFavorites());
    
    expect(result.current.isLoading).toBe(true);
    await waitForNextUpdate();
    
    expect(result.current.favorites).toEqual(['tour1', 'tour2']);
    expect(result.current.isLoading).toBe(false);
  });

  test('should toggle favorite status', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    
    const { result, waitForNextUpdate } = renderHook(() => useFavorites());
    await waitForNextUpdate();
    
    await act(async () => {
      await result.current.toggleFavorite('tour1');
    });
    
    expect(result.current.isFavorite('tour1')).toBe(true);
    
    await act(async () => {
      await result.current.toggleFavorite('tour1');
    });
    
    expect(result.current.isFavorite('tour1')).toBe(false);
  });
});

describe('useTourRatings', () => {
  test('should save and retrieve ratings', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    
    const { result, waitForNextUpdate } = renderHook(() => useTourRatings());
    await waitForNextUpdate();
    
    await act(async () => {
      await result.current.setRating('tour1', 5, 'Great tour!');
    });
    
    const rating = result.current.getRating('tour1');
    expect(rating?.rating).toBe(5);
    expect(rating?.review).toBe('Great tour!');
  });
});

describe('useTourProgressData', () => {
  test('should track progress percentage correctly', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    
    const { result, waitForNextUpdate } = renderHook(() => useTourProgressData());
    await waitForNextUpdate();
    
    await act(async () => {
      await result.current.saveProgress('tour1', 'Test Tour', 2, [1, 2], 5);
    });
    
    expect(result.current.getProgressPercentage('tour1')).toBe(40);
  });
});
```

#### `useGeofence.ts`

```typescript
// __tests__/hooks/useGeofence.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useGeofence } from '../../src/hooks/useGeofence';

describe('useGeofence', () => {
  const mockStops = [
    { id: 1, latitude: 53.4808, longitude: -2.2426, triggerRadius: 30 },
    { id: 2, latitude: 53.4815, longitude: -2.2440, triggerRadius: 30 },
  ];

  test('should calculate distance correctly', () => {
    const { result } = renderHook(() => 
      useGeofence({
        stops: mockStops,
        currentStopIndex: 0,
        userLocation: { latitude: 53.4808, longitude: -2.2426 },
        onEnterGeofence: jest.fn(),
      })
    );
    
    // User is at stop 1, should show distance to stop 2
    expect(result.current.distanceToNextStop).toBeGreaterThan(0);
  });

  test('should trigger geofence callback when inside radius', () => {
    const onEnterGeofence = jest.fn();
    
    renderHook(() => 
      useGeofence({
        stops: mockStops,
        currentStopIndex: 0,
        userLocation: { latitude: 53.4815, longitude: -2.2440 }, // At stop 2
        onEnterGeofence,
      })
    );
    
    expect(onEnterGeofence).toHaveBeenCalledWith(1);
  });
});
```

### 1.2 Component Tests

#### `TourCard.tsx`

```typescript
// __tests__/components/TourCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TourCard } from '../../src/components/TourCard';

const mockTour = {
  id: 'test-tour',
  name: 'Test Walking Tour',
  description: 'A test tour description',
  stops: [{ id: 1 }, { id: 2 }, { id: 3 }],
  totalDistance: 2.5,
  estimatedDuration: 45,
};

describe('TourCard', () => {
  const defaultProps = {
    tour: mockTour,
    isFavorite: false,
    rating: undefined,
    noteCount: 0,
    progressPercentage: 0,
    isOfflineReady: false,
    onPress: jest.fn(),
    onFavoriteToggle: jest.fn(),
    onOptionsPress: jest.fn(),
  };

  test('should render tour name and stats', () => {
    const { getByText } = render(<TourCard {...defaultProps} />);
    
    expect(getByText('Test Walking Tour')).toBeTruthy();
    expect(getByText('3 stops')).toBeTruthy();
    expect(getByText('2.5 km')).toBeTruthy();
    expect(getByText('45 min')).toBeTruthy();
  });

  test('should show progress when in progress', () => {
    const { getByText } = render(
      <TourCard {...defaultProps} progressPercentage={50} />
    );
    
    expect(getByText('50%')).toBeTruthy();
  });

  test('should call onFavoriteToggle when heart pressed', () => {
    const onFavoriteToggle = jest.fn();
    const { getByTestId } = render(
      <TourCard {...defaultProps} onFavoriteToggle={onFavoriteToggle} />
    );
    
    fireEvent.press(getByTestId('favorite-button'));
    expect(onFavoriteToggle).toHaveBeenCalled();
  });
});
```

---

## 2. Integration Tests

### 2.1 Tour Loading & Storage

```typescript
// __tests__/integration/tourStorage.test.ts
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Tour Storage Integration', () => {
  test('should save and load tour progress across sessions', async () => {
    // Simulate saving progress
    const progressData = {
      tourId: 'test-tour',
      currentStopIndex: 3,
      completedStopIds: [1, 2, 3],
      totalStops: 5,
    };
    
    await AsyncStorage.setItem(
      'tour_progress_test-tour',
      JSON.stringify(progressData)
    );
    
    // Simulate app restart - load progress
    const loaded = await AsyncStorage.getItem('tour_progress_test-tour');
    const parsed = JSON.parse(loaded!);
    
    expect(parsed.currentStopIndex).toBe(3);
    expect(parsed.completedStopIds).toEqual([1, 2, 3]);
  });

  test('should download and verify offline tour data', async () => {
    const offlineDir = FileSystem.documentDirectory + 'offline/test-tour/';
    
    // This would be a mock in actual tests
    await FileSystem.makeDirectoryAsync(offlineDir, { intermediates: true });
    await FileSystem.writeAsStringAsync(
      offlineDir + 'tour.json',
      JSON.stringify({ id: 'test-tour' })
    );
    
    const info = await FileSystem.getInfoAsync(offlineDir + 'tour.json');
    expect(info.exists).toBe(true);
  });
});
```

---

## 3. Manual Test Procedures

### 3.1 Home Screen Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| HS-001 | Tour list loads | 1. Open app | Tours display in list |
| HS-002 | Pull to refresh | 1. Pull down on list | Refresh indicator shows, list updates |
| HS-003 | Favorite toggle | 1. Tap heart icon on tour card | Heart fills, tour appears in Favorites filter |
| HS-004 | Filter tabs | 1. Tap each filter tab | List filters correctly |
| HS-005 | Resume banner | 1. Start tour 2. Exit partway 3. Return home | Resume banner shows with correct progress |
| HS-006 | Options menu | 1. Tap ⋯ on tour card | Action sheet shows with options |

### 3.2 Tour Playback Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| TP-001 | Audio plays on geofence enter | 1. Start tour 2. Walk to first stop | Audio plays automatically |
| TP-002 | Play/pause toggle | 1. Tap play button during audio | Audio pauses/resumes |
| TP-003 | Seek functionality | 1. Drag seek bar during playback | Audio jumps to position |
| TP-004 | Next/previous stops | 1. Tap next/previous buttons | Navigates between stops |
| TP-005 | Progress persistence | 1. Exit tour mid-way 2. Reopen tour | Progress restored correctly |
| TP-006 | Tour completion | 1. Complete all stops | Completion celebration shows |

### 3.3 Map Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| MP-001 | User location shows | 1. Open tour with GPS enabled | Blue dot shows current location |
| MP-002 | Stop markers display | 1. Open tour | All stops show numbered markers |
| MP-003 | Map panning | 1. Drag map away from user | Map stays where dragged |
| MP-004 | Re-center button | 1. Pan away 2. Tap re-center | Map centers on user |
| MP-005 | Route line | 1. Open tour | Route line connects stops |

### 3.4 Offline Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| OF-001 | Download tour | 1. Tap ⋯ → Download 2. Confirm | Progress shows, all assets download |
| OF-002 | Offline playback | 1. Download tour 2. Enable airplane mode 3. Play tour | Audio plays, map shows |
| OF-003 | Delete offline data | 1. Open offline modal 2. Tap delete | Data removed, badge updates |
| OF-004 | Partial download resume | 1. Start download 2. Kill app 3. Reopen | Can restart/continue download |

### 3.5 Ratings & Notes Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| RN-001 | Add rating | 1. Tap ⋯ → Rate 2. Select stars 3. Submit | Rating saves, shows on card |
| RN-002 | Edit rating | 1. Rate tour 2. Rate again with different value | Rating updates |
| RN-003 | Delete rating | 1. Open rating modal 2. Tap delete | Rating removed |
| RN-004 | Add note | 1. Tap ⋯ → Notes 2. Tap + 3. Enter text | Note saves and displays |
| RN-005 | Edit note | 1. Tap edit on note 2. Change text 3. Save | Note updates |
| RN-006 | Delete note | 1. Tap delete on note 2. Confirm | Note removed |
| RN-007 | Stop-specific note | 1. Add note with stop selected | Note shows stop label |

### 3.6 Share Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| SH-001 | Share via system | 1. Tap ⋯ → Share 2. Tap Share via... | System share sheet opens |
| SH-002 | QR code display | 1. Open share modal | QR code shows |
| SH-003 | Export tour file | 1. Tap Export Tour File | JSON file created |

---

## 4. GPS Testing

### 4.1 iOS Simulator GPS

```bash
# Set custom location in Simulator
# Debug → Location → Custom Location → Enter coordinates

# Or use GPX file for route simulation
# Debug → Location → GPX File
```

Example GPX file for testing:
```xml
<?xml version="1.0"?>
<gpx version="1.1">
  <wpt lat="53.4808" lon="-2.2426">
    <name>Stop 1</name>
  </wpt>
  <wpt lat="53.4815" lon="-2.2440">
    <name>Stop 2</name>
  </wpt>
  <wpt lat="53.4820" lon="-2.2455">
    <name>Stop 3</name>
  </wpt>
</gpx>
```

### 4.2 Android Emulator GPS

```bash
# Using adb
adb emu geo fix <longitude> <latitude>

# Example
adb emu geo fix -2.2426 53.4808
```

### 4.3 Physical Device Testing

For accurate GPS testing, use a real device outdoors. Walk the actual tour route to verify:
- Geofence triggers at correct distances
- Audio starts within reasonable time of entering zone
- Location accuracy indicator shows correctly

---

## 5. Performance Tests

### 5.1 Memory Usage

Monitor with Flipper or React Native Debugger:
- Baseline memory on home screen
- Memory during tour playback
- Memory after downloading large tour

Target: < 200MB during active use

### 5.2 Battery Impact

Test over 1-hour tour:
- Background location tracking drain
- Audio playback drain
- Combined drain

Target: < 10% battery per hour

### 5.3 Load Testing

- Test with 50+ tours in library
- Test tour with 100+ stops
- Test offline download of 500MB+ tour

---

## 6. Accessibility Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| AC-001 | VoiceOver navigation | 1. Enable VoiceOver 2. Navigate app | All elements announced correctly |
| AC-002 | Dynamic text sizing | 1. Increase system text size | App text scales appropriately |
| AC-003 | Reduce motion | 1. Enable reduce motion | Animations simplified |
| AC-004 | Color contrast | 1. Check all text/background combinations | WCAG AA compliance |

---

## 7. Edge Cases

### 7.1 Network Conditions
- No network during tour start
- Network loss mid-tour
- Slow 2G connection
- Network recovery

### 7.2 GPS Conditions
- GPS disabled
- GPS permission denied
- Low accuracy GPS
- GPS loss during tour

### 7.3 Storage Conditions
- Low storage warning during download
- Full storage
- Corrupted cache data

### 7.4 App State
- Background to foreground
- Lock screen during tour
- Incoming call during audio
- Notification interruption

---

## 8. Regression Test Suite

Run before each release:

1. [ ] HS-001 through HS-006 (Home Screen)
2. [ ] TP-001 through TP-006 (Tour Playback)
3. [ ] MP-001 through MP-005 (Map)
4. [ ] OF-001 through OF-003 (Offline)
5. [ ] RN-001 through RN-007 (Ratings & Notes)
6. [ ] SH-001 through SH-003 (Share)
7. [ ] AC-001 through AC-004 (Accessibility)

---

## 9. Known Issues & Workarounds

### Issue: Map tiles slow to load
**Workaround**: Pre-download tour for offline use

### Issue: GPS accuracy varies by device
**Workaround**: Adjust triggerRadius per stop based on testing

### Issue: Audio may not auto-play on some Android devices
**Workaround**: User must tap play button once, then auto-play works

---

## 10. Test Environment Requirements

### Devices
- iPhone 12 or newer (iOS 15+)
- Android phone with GPS (Android 10+)
- iOS Simulator
- Android Emulator

### Network
- WiFi connection
- 4G/LTE connection
- Ability to toggle airplane mode

### Accounts/Keys
- Test OpenAI API key (for audio generation)
- Test device with location permissions granted

---

*Last updated: December 2024*
