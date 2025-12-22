import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, StatusBar, AppState, AppStateStatus } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList, Tour, TourStop } from '../types';
import { loadTour, getAssetPath } from '../services';
import {
  useLocation,
  useAudioPlayer,
  useGeofence,
  useTourProgress,
  useSettings,
  getNextPlaybackSpeed,
} from '../hooks';
import {
  MapDisplay,
  AudioPlayerBar,
  UpNextPanel,
  StopListPanel,
  ScriptViewer,
  EndTourDialog,
  PhotoViewer,
} from '../components';
import { NavigationControls } from '../components/NavigationControls';
import { RouteDirections, DirectionBanner } from '../components/RouteDirections';
import { OfflineManager } from '../components/OfflineManager';

type TourScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tour'>;
type TourScreenRouteProp = RouteProp<RootStackParamList, 'Tour'>;

interface TourScreenProps {
  navigation: TourScreenNavigationProp;
  route: TourScreenRouteProp;
}

export function TourScreen({ navigation, route }: TourScreenProps) {
  const { tourId } = route.params;

  // State
  const [tour, setTour] = useState<Tour | null>(null);
  const [basePath, setBasePath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [photoStop, setPhotoStop] = useState<TourStop | null>(null);
  
  // New state for manual mode and offline
  const [isManualMode, setIsManualMode] = useState(false);
  const [showOfflineManager, setShowOfflineManager] = useState(false);
  const [showDirectionBanner, setShowDirectionBanner] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  // Hooks
  const { settings } = useSettings();
  const { location, startTracking, stopTracking, errorMsg: locationError } = useLocation();
  const {
    currentStopIndex,
    currentStop,
    nextStop,
    previousStop,
    goToStop,
    goToNextStop,
    goToPreviousStop,
    markCurrentComplete,
    resetTour,
    completedStopIds,
    isFirstStop,
    isLastStop,
    isTourComplete,
  } = useTourProgress(tour);

  const insets = useSafeAreaInsets();

  const handleAudioComplete = useCallback(() => {
    markCurrentComplete();
    
    // Show direction banner after audio completes
    if (currentStop?.directionToNext) {
      setShowDirectionBanner(true);
    }
    
    // In manual mode, don't auto-advance
    if (!isManualMode && settings.autoPlayEnabled && nextStop) {
      // Wait a moment before advancing (let user hear directions)
      setTimeout(() => {
        goToNextStop();
        setShowDirectionBanner(false);
      }, 3000);
    }
  }, [markCurrentComplete, settings.autoPlayEnabled, nextStop, goToNextStop, isManualMode, currentStop]);

  const {
    audioState,
    loadAudio,
    play,
    pause,
    togglePlayPause,
    skip,
    setPlaybackSpeed,
    seekTo,
    unload,
  } = useAudioPlayer(handleAudioComplete);

  const {
    triggeredStop,
    distanceToNextStop,
    visitedStops,
    markStopVisited,
    clearTriggeredStop,
  } = useGeofence(
    tour?.stops || [],
    location,
    currentStopIndex,
    { 
      defaultTriggerRadius: settings.defaultTriggerRadius, 
      enabled: !isManualMode // Disable geofencing in manual mode
    }
  );

  // Show completion modal
  useEffect(() => {
    if (isTourComplete && tour) {
      Alert.alert(
        '🎉 Tour Complete!',
        `Congratulations! You've completed the ${tour.name} tour.`,
        [
          { text: 'View Summary', onPress: () => setIsListExpanded(true) },
          { text: 'End Tour', onPress: confirmEndTour },
        ]
      );
    }
  }, [isTourComplete, tour?.name]);

  // Configure audio for background playback
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true, // KEY: Continue in background
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Failed to configure background audio:', error);
      }
    };

    configureAudio();
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
      
      // Audio continues in background due to staysActiveInBackground setting
      if (nextAppState === 'background') {
        console.log('App in background - audio continues playing');
      } else if (nextAppState === 'active') {
        console.log('App in foreground');
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Load tour data
  useEffect(() => {
    const loadTourData = async () => {
      try {
        const result = await loadTour(tourId);
        if (result) {
          setTour(result.tour);
          setBasePath(result.basePath);
        } else {
          Alert.alert('Error', 'Tour not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading tour:', error);
        Alert.alert('Error', 'Failed to load tour');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    loadTourData();
  }, [tourId, navigation]);

  // Start location tracking when tour loads (unless manual mode)
  useEffect(() => {
    if (tour && !isManualMode) {
      startTracking();
    }
    return () => {
      stopTracking();
    };
  }, [tour, isManualMode, startTracking, stopTracking]);

  // Auto-switch to manual mode if GPS is poor
  useEffect(() => {
    if (locationError && !isManualMode) {
      Alert.alert(
        'GPS Issue',
        'Location tracking is unavailable. Would you like to switch to manual mode?',
        [
          { text: 'Try Again', onPress: () => startTracking() },
          { text: 'Use Manual Mode', onPress: () => setIsManualMode(true) },
        ]
      );
    }
  }, [locationError, isManualMode, startTracking]);

  // Keep screen on during tour
  useEffect(() => {
    if (settings.keepScreenOn) {
      activateKeepAwakeAsync();
    }
    return () => {
      deactivateKeepAwake();
    };
  }, [settings.keepScreenOn]);

  // Load audio when current stop changes
  useEffect(() => {
    if (currentStop && basePath) {
      const audioPath = getAssetPath(basePath, currentStop.audioFile);
      loadAudio(audioPath);
      setShowDirectionBanner(false);
      
      // Auto-play in manual mode when navigating to new stop
      if (isManualMode) {
        setTimeout(() => play(), 500);
      }
    }
  }, [currentStop?.id, basePath, loadAudio, isManualMode, play]);

  // Handle geofence triggers (auto-play when entering stop radius) - only in GPS mode
  useEffect(() => {
    if (!isManualMode && triggeredStop && settings.autoPlayEnabled) {
      const stopIndex = tour?.stops.findIndex(s => s.id === triggeredStop.id);
      if (stopIndex !== undefined && stopIndex >= 0) {
        goToStop(stopIndex);
        markStopVisited(triggeredStop.id);
        clearTriggeredStop();
      }
    }
  }, [triggeredStop, settings.autoPlayEnabled, tour?.stops, goToStop, markStopVisited, clearTriggeredStop, isManualMode]);

  // Set initial playback speed from settings
  useEffect(() => {
    setPlaybackSpeed(settings.defaultPlaybackSpeed);
  }, [settings.defaultPlaybackSpeed, setPlaybackSpeed]);

  // Handlers
  const handleSpeedChange = () => {
    const newSpeed = getNextPlaybackSpeed(audioState.playbackSpeed);
    setPlaybackSpeed(newSpeed);
  };

  const handleStopPress = (stop: TourStop) => {
    const index = tour?.stops.findIndex(s => s.id === stop.id);
    if (index !== undefined && index >= 0) {
      goToStop(index);
      setIsListExpanded(false);
    }
  };

  const handleViewPhoto = (stop: TourStop) => {
    setPhotoStop(stop);
    setShowPhoto(true);
  };

  const handleFocusMap = (stop: TourStop) => {
    handleStopPress(stop);
  };

  const handleEndTour = () => {
    setShowEndDialog(true);
  };

  const confirmEndTour = async () => {
    await unload();
    stopTracking();
    navigation.goBack();
  };

  const handleToggleManualMode = (manual: boolean) => {
    setIsManualMode(manual);
    if (manual) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const handleManualNext = () => {
    if (!isLastStop) {
      goToNextStop();
    }
  };

  const handleManualPrevious = () => {
    if (!isFirstStop) {
      goToPreviousStop();
    }
  };

  if (isLoading || !tour) {
    return <View style={styles.loading} />;
  }

  const gpsAccuracy = location?.accuracy ?? null;
  const isGpsAvailable = !locationError && location !== null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header with back button */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleEndTour}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {tour.name}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowOfflineManager(true)}
        >
          <Ionicons name="cloud-download-outline" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Direction Banner (shown after audio completes) */}
      <DirectionBanner
        direction={currentStop?.directionToNext || null}
        distance={distanceToNextStop}
        nextStopName={nextStop?.name || null}
        visible={showDirectionBanner && !audioState.isPlaying}
      />

      {/* Navigation Controls (GPS status + mode toggle) */}
      <NavigationControls
        isManualMode={isManualMode}
        onToggleMode={handleToggleManualMode}
        onPreviousStop={handleManualPrevious}
        onNextStop={handleManualNext}
        canGoPrevious={!isFirstStop}
        canGoNext={!isLastStop}
        currentStopNumber={currentStopIndex + 1}
        totalStops={tour.stops.length}
        gpsAccuracy={gpsAccuracy}
        isGpsAvailable={isGpsAvailable}
      />

      {/* Map (takes remaining space) */}
      <View style={styles.mapContainer}>
        <MapDisplay
          tour={tour}
          currentLocation={location}
          currentStopIndex={currentStopIndex}
          visitedStops={visitedStops}
          onStopPress={handleStopPress}
        />
      </View>

      {/* Up Next panel */}
      <UpNextPanel
        currentStop={currentStop}
        nextStop={nextStop}
        distanceToNext={distanceToNextStop}
        onExpand={() => setIsListExpanded(!isListExpanded)}
        isExpanded={isListExpanded}
      />

      {/* Expanded stop list */}
      {isListExpanded && (
        <View style={styles.expandedList}>
          <StopListPanel
            stops={tour.stops}
            currentStopIndex={currentStopIndex}
            visitedStops={visitedStops}
            onSelectStop={goToStop}
            onViewPhoto={handleViewPhoto}
            onFocusMap={handleFocusMap}
          />
        </View>
      )}

      {/* Audio player */}
      <AudioPlayerBar
        currentStop={currentStop}
        stopNumber={currentStopIndex + 1}
        audioState={audioState}
        basePath={basePath}
        onPlayPause={togglePlayPause}
        onSkipBack={() => skip(-15)}
        onSkipForward={() => skip(15)}
        onSpeedChange={handleSpeedChange}
        onSeek={seekTo}
        onShowScript={() => setShowScript(true)}
      />

      {/* Route Directions overlay */}
      <RouteDirections
        currentStop={currentStop}
        nextStop={nextStop}
        distanceToNext={distanceToNextStop}
        isAudioPlaying={audioState.isPlaying}
        autoPlayDirections={true}
      />

      {/* Script viewer modal */}
      <ScriptViewer
        visible={showScript}
        stop={currentStop}
        onClose={() => setShowScript(false)}
      />

      {/* Photo viewer modal */}
      <PhotoViewer
        visible={showPhoto}
        imageUri={photoStop?.imageFile ? getAssetPath(basePath, photoStop.imageFile) : null}
        stopName={photoStop?.name || ''}
        onClose={() => setShowPhoto(false)}
      />

      {/* Offline manager modal */}
      <OfflineManager
        visible={showOfflineManager}
        tour={tour}
        basePath={basePath}
        onClose={() => setShowOfflineManager(false)}
        onDownloadComplete={() => {
          Alert.alert('Success', 'Tour downloaded for offline use!');
        }}
      />

      {/* End tour dialog */}
      <EndTourDialog
        visible={showEndDialog}
        onCancel={() => setShowEndDialog(false)}
        onConfirm={confirmEndTour}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerButton: {
    padding: 8,
  },
  loading: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
  },
  expandedList: {
    maxHeight: 300,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
