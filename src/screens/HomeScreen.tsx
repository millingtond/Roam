import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Tour } from '../types';
import { TourCard } from '../components/TourCard';
import { ResumeTourBanner } from '../components/ResumeTourBanner';
import { TourRatingModal } from '../components/TourRatingModal';
import { TourNotesModal } from '../components/TourNotesModal';
import { ShareTourModal } from '../components/ShareTourModal';
import { OfflineManager } from '../components/OfflineManager';
import {
  useFavorites,
  useTourRatings,
  useTourNotes,
  useTourProgressData,
} from '../hooks/useTourUserData';

// Storage key for dismissed resume banner
const DISMISSED_RESUME_KEY = 'dismissed_resume_tour';

interface HomeScreenProps {
  navigation: any;
}

type FilterType = 'all' | 'favorites' | 'in-progress' | 'completed';

export function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  
  // Tours data
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<Record<string, boolean>>({});
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Modal states
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  
  // Resume banner state
  const [showResumeBanner, setShowResumeBanner] = useState(true);
  
  // User data hooks
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { ratings, getRating, setRating, deleteRating } = useTourRatings();
  const { notes, getNotesForTour, addNote, updateNote, deleteNote } = useTourNotes();
  const { lastPlayed, getProgressPercentage, clearProgress } = useTourProgressData();

  // Load tours
  useEffect(() => {
    loadTours();
    checkDismissedResume();
  }, []);

  const loadTours = async () => {
    try {
      // Load tours from the assets or documents directory
      const toursDir = FileSystem.documentDirectory + 'tours/';
      const dirInfo = await FileSystem.getInfoAsync(toursDir);
      
      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(toursDir);
        const tourFiles = files.filter(f => f.endsWith('.json'));
        
        const loadedTours: Tour[] = [];
        for (const file of tourFiles) {
          try {
            const content = await FileSystem.readAsStringAsync(toursDir + file);
            const tour = JSON.parse(content);
            loadedTours.push(tour);
          } catch (e) {
            console.warn(`Failed to load tour ${file}:`, e);
          }
        }
        setTours(loadedTours);
      } else {
        // Load sample tour from assets
        // In production, this would load from your API or bundled assets
        setTours([createSampleTour()]);
      }
      
      // Check offline status for each tour
      await checkAllOfflineStatus();
    } catch (error) {
      console.error('Failed to load tours:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAllOfflineStatus = async () => {
    const offlineDir = FileSystem.documentDirectory + 'offline/';
    const status: Record<string, boolean> = {};
    
    for (const tour of tours) {
      const tourOfflineDir = offlineDir + tour.id + '/';
      const info = await FileSystem.getInfoAsync(tourOfflineDir);
      status[tour.id] = info.exists;
    }
    
    setOfflineStatus(status);
  };

  const checkDismissedResume = async () => {
    try {
      const dismissed = await AsyncStorage.getItem(DISMISSED_RESUME_KEY);
      if (dismissed) {
        const { tourId, timestamp } = JSON.parse(dismissed);
        // Only hide if dismissed within last 24 hours for same tour
        const dayAgo = Date.now() - 86400000;
        if (lastPlayed && tourId === lastPlayed.tourId && new Date(timestamp).getTime() > dayAgo) {
          setShowResumeBanner(false);
        }
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadTours();
    setIsRefreshing(false);
  }, []);

  const handleTourPress = (tour: Tour) => {
    navigation.navigate('TourDetail', { tour });
  };

  const handleResumeTour = () => {
    if (lastPlayed) {
      const tour = tours.find(t => t.id === lastPlayed.tourId);
      if (tour) {
        navigation.navigate('Tour', { 
          tour, 
          resumeFromStop: lastPlayed.currentStopIndex 
        });
      }
    }
  };

  const handleDismissResume = async () => {
    setShowResumeBanner(false);
    if (lastPlayed) {
      try {
        await AsyncStorage.setItem(DISMISSED_RESUME_KEY, JSON.stringify({
          tourId: lastPlayed.tourId,
          timestamp: new Date().toISOString(),
        }));
      } catch (e) {
        // Ignore
      }
    }
  };

  const handleFavoriteToggle = async (tourId: string) => {
    await toggleFavorite(tourId);
  };

  const handleOptionsPress = (tour: Tour) => {
    setSelectedTour(tour);
    
    const options = [
      'Rate Tour',
      'View Notes',
      'Share Tour',
      'Download for Offline',
      'Cancel',
    ];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: tour.name,
        },
        (buttonIndex) => {
          handleOptionSelected(buttonIndex, tour);
        }
      );
    } else {
      // Android: Use Alert or a custom modal
      Alert.alert(
        tour.name,
        'Choose an action',
        options.slice(0, -1).map((option, index) => ({
          text: option,
          onPress: () => handleOptionSelected(index, tour),
        })).concat([{ text: 'Cancel', style: 'cancel' }])
      );
    }
  };

  const handleOptionSelected = (index: number, tour: Tour) => {
    switch (index) {
      case 0: // Rate Tour
        setSelectedTour(tour);
        setShowRatingModal(true);
        break;
      case 1: // View Notes
        setSelectedTour(tour);
        setShowNotesModal(true);
        break;
      case 2: // Share Tour
        setSelectedTour(tour);
        setShowShareModal(true);
        break;
      case 3: // Download for Offline
        setSelectedTour(tour);
        setShowOfflineModal(true);
        break;
    }
  };

  const handleRatingSubmit = async (rating: number, review: string) => {
    if (selectedTour) {
      await setRating(selectedTour.id, rating, review);
    }
  };

  const handleRatingDelete = async () => {
    if (selectedTour) {
      await deleteRating(selectedTour.id);
      setShowRatingModal(false);
    }
  };

  // Filter tours based on active filter
  const filteredTours = tours.filter(tour => {
    switch (activeFilter) {
      case 'favorites':
        return isFavorite(tour.id);
      case 'in-progress':
        const progress = getProgressPercentage(tour.id);
        return progress > 0 && progress < 100;
      case 'completed':
        return getProgressPercentage(tour.id) === 100;
      default:
        return true;
    }
  });

  const renderTourCard = ({ item: tour }: { item: Tour }) => {
    const rating = getRating(tour.id);
    const tourNotes = getNotesForTour(tour.id);
    const progress = getProgressPercentage(tour.id);
    
    return (
      <TourCard
        tour={tour}
        isFavorite={isFavorite(tour.id)}
        rating={rating?.rating}
        noteCount={tourNotes.length}
        progressPercentage={progress}
        isOfflineReady={offlineStatus[tour.id] || false}
        onPress={() => handleTourPress(tour)}
        onFavoriteToggle={() => handleFavoriteToggle(tour.id)}
        onOptionsPress={() => handleOptionsPress(tour)}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Resume Banner */}
      {showResumeBanner && lastPlayed && (
        <ResumeTourBanner
          lastPlayed={lastPlayed}
          onResume={handleResumeTour}
          onDismiss={handleDismissResume}
        />
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'favorites', 'in-progress', 'completed'] as FilterType[]).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter === 'all' ? 'All Tours' :
               filter === 'favorites' ? 'Favorites' :
               filter === 'in-progress' ? 'In Progress' : 'Completed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={
          activeFilter === 'favorites' ? 'heart-outline' :
          activeFilter === 'in-progress' ? 'play-circle-outline' :
          activeFilter === 'completed' ? 'checkmark-circle-outline' :
          'map-outline'
        }
        size={64}
        color="#d1d5db"
      />
      <Text style={styles.emptyTitle}>
        {activeFilter === 'favorites' ? 'No Favorites Yet' :
         activeFilter === 'in-progress' ? 'No Tours In Progress' :
         activeFilter === 'completed' ? 'No Completed Tours' :
         'No Tours Available'}
      </Text>
      <Text style={styles.emptyText}>
        {activeFilter === 'favorites'
          ? 'Tap the heart icon on any tour to add it to your favorites.'
          : activeFilter === 'in-progress'
          ? 'Start a tour and your progress will appear here.'
          : activeFilter === 'completed'
          ? 'Complete a tour to see it here.'
          : 'Add tours to get started exploring!'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Audio Tours</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Tour List */}
      <FlatList
        data={filteredTours}
        keyExtractor={item => item.id}
        renderItem={renderTourCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#0891b2"
          />
        }
      />

      {/* Modals */}
      {selectedTour && (
        <>
          <TourRatingModal
            visible={showRatingModal}
            tourName={selectedTour.name}
            currentRating={getRating(selectedTour.id)?.rating}
            currentReview={getRating(selectedTour.id)?.review}
            onClose={() => setShowRatingModal(false)}
            onSubmit={handleRatingSubmit}
            onDelete={getRating(selectedTour.id) ? handleRatingDelete : undefined}
          />

          <TourNotesModal
            visible={showNotesModal}
            tourId={selectedTour.id}
            tourName={selectedTour.name}
            stops={selectedTour.stops}
            notes={getNotesForTour(selectedTour.id)}
            onClose={() => setShowNotesModal(false)}
            onAddNote={(text, stopId) => addNote(selectedTour.id, text, stopId)}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
          />

          <ShareTourModal
            visible={showShareModal}
            tour={selectedTour}
            onClose={() => setShowShareModal(false)}
          />

          <OfflineManager
            visible={showOfflineModal}
            tour={selectedTour}
            basePath={FileSystem.documentDirectory + 'tours/' + selectedTour.id + '/'}
            onClose={() => setShowOfflineModal(false)}
            onDownloadComplete={() => {
              setOfflineStatus(prev => ({ ...prev, [selectedTour.id]: true }));
            }}
          />
        </>
      )}
    </View>
  );
}

// Sample tour for testing
function createSampleTour(): Tour {
  return {
    id: 'sample-tour',
    name: 'Sample Walking Tour',
    description: 'A demonstration tour to showcase the app features.',
    version: '1.0',
    author: 'Audio Tour App',
    language: 'en',
    stops: [
      {
        id: 1,
        name: 'Starting Point',
        latitude: 53.4808,
        longitude: -2.2426,
        triggerRadius: 30,
        audioFile: 'audio/stop1.mp3',
        script: 'Welcome to the tour!',
      },
      {
        id: 2,
        name: 'Second Stop',
        latitude: 53.4815,
        longitude: -2.2440,
        triggerRadius: 30,
        audioFile: 'audio/stop2.mp3',
        script: 'This is the second stop.',
      },
    ],
    startPoint: {
      latitude: 53.4808,
      longitude: -2.2426,
      address: 'Manchester, UK',
    },
    totalDistance: 0.5,
    estimatedDuration: 30,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  settingsButton: {
    padding: 8,
  },
  headerContainer: {
    paddingTop: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: {
    backgroundColor: '#0891b2',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: 'white',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
