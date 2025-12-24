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
  ActivityIndicator,
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
import {
  useFavorites,
  useTourRatings,
  useTourNotes,
  useTourProgressData,
} from '../hooks/useTourUserData';
import {
  initializeFirebase,
  isFirebaseConnected,
  fetchAvailableTours,
  downloadTourForOffline,
  isTourDownloaded,
  checkForTourUpdate,
  deleteTourDownload,
  cloudTourToLocal,
  getLocalTourPath,
  CloudTour,
  DownloadProgress,
} from '../services/firebaseService';
import { loadTour } from '../services/tourLoader';

// Storage key for dismissed resume banner
const DISMISSED_RESUME_KEY = 'dismissed_resume_tour';

interface HomeScreenProps {
  navigation: any;
}

type FilterType = 'all' | 'favorites' | 'downloaded' | 'completed';

interface TourWithStatus extends Tour {
  isDownloaded: boolean;
  hasUpdate: boolean;
  isCloud: boolean;
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  
  // Tours data
  const [tours, setTours] = useState<TourWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  
  // Download state
  const [downloadingTourId, setDownloadingTourId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Modal states
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Resume banner state
  const [showResumeBanner, setShowResumeBanner] = useState(true);
  
  // User data hooks
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { ratings, getRating, setRating, deleteRating } = useTourRatings();
  const { notes, getNotesForTour, addNote, updateNote, deleteNote } = useTourNotes();
  const { lastPlayed, getProgressPercentage, clearProgress } = useTourProgressData();

  // Initialize Firebase and load tours
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    // Initialize Firebase
    const connected = initializeFirebase();
    setFirebaseConnected(connected);
    
    // Load tours
    await loadTours();
    checkDismissedResume();
  };

  const loadTours = async () => {
    setIsLoading(true);
    
    try {
      const loadedTours: TourWithStatus[] = [];
      
      // 1. Try to fetch from Firebase
      if (isFirebaseConnected()) {
        try {
          const cloudTours = await fetchAvailableTours();
          
          // Check download status for each cloud tour
          for (const cloudTour of cloudTours) {
            const isDownloaded = await isTourDownloaded(cloudTour.id);
            const updateCheck = isDownloaded 
              ? await checkForTourUpdate(cloudTour.id)
              : { hasUpdate: false };
            
            loadedTours.push({
              ...cloudTourToLocal(cloudTour),
              isDownloaded,
              hasUpdate: updateCheck.hasUpdate,
              isCloud: true,
            });
          }
        } catch (error) {
          console.warn('Failed to fetch cloud tours:', error);
        }
      }

      // 2. Also load any local-only tours (for backwards compatibility)
      const localTours = await loadLocalTours();
      for (const localTour of localTours) {
        // Don't add duplicates
        if (!loadedTours.find(t => t.id === localTour.id)) {
          loadedTours.push({
            ...localTour,
            isDownloaded: true,
            hasUpdate: false,
            isCloud: false,
          });
        }
      }

      setTours(loadedTours);
    } catch (error) {
      console.error('Failed to load tours:', error);
      Alert.alert('Error', 'Failed to load tours. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalTours = async (): Promise<Tour[]> => {
    const toursDir = FileSystem.documentDirectory + 'tours/';
    const dirInfo = await FileSystem.getInfoAsync(toursDir);
    
    if (!dirInfo.exists) return [];
    
    const folders = await FileSystem.readDirectoryAsync(toursDir);
    const tours: Tour[] = [];
    
    for (const folder of folders) {
      const tourJsonPath = toursDir + folder + '/tour.json';
      const fileInfo = await FileSystem.getInfoAsync(tourJsonPath);
      
      if (fileInfo.exists) {
        try {
          const content = await FileSystem.readAsStringAsync(tourJsonPath);
          tours.push(JSON.parse(content));
        } catch (e) {
          console.warn(`Failed to load local tour ${folder}:`, e);
        }
      }
    }
    
    return tours;
  };

  const checkDismissedResume = async () => {
    try {
      const dismissed = await AsyncStorage.getItem(DISMISSED_RESUME_KEY);
      if (dismissed) {
        const { tourId, timestamp } = JSON.parse(dismissed);
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

  const handleTourPress = async (tour: TourWithStatus) => {
    if (!tour.isDownloaded) {
      // Prompt to download
      Alert.alert(
        'Download Required',
        `"${tour.name}" needs to be downloaded before you can start the tour.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: () => handleDownloadTour(tour) },
        ]
      );
      return;
    }

    if (tour.hasUpdate) {
      // Offer to update
      Alert.alert(
        'Update Available',
        `A new version of "${tour.name}" is available. Would you like to update?`,
        [
          { text: 'Later', onPress: () => startTour(tour) },
          { text: 'Update', onPress: () => handleDownloadTour(tour) },
        ]
      );
      return;
    }

    startTour(tour);
  };

  const startTour = async (tour: TourWithStatus) => {
    // Load the tour from local storage to get full data
    const result = await loadTour(tour.id);
    if (result) {
      navigation.navigate('Tour', { tourId: tour.id });
    } else {
      Alert.alert('Error', 'Could not load tour data.');
    }
  };

  const handleDownloadTour = async (tour: TourWithStatus) => {
    setDownloadingTourId(tour.id);
    setDownloadProgress(null);

    try {
      await downloadTourForOffline(tour.id, (progress) => {
        setDownloadProgress(progress);
      });

      // Update tour status
      setTours(prev => prev.map(t => 
        t.id === tour.id 
          ? { ...t, isDownloaded: true, hasUpdate: false }
          : t
      ));

      Alert.alert('Success', `"${tour.name}" is ready for offline use!`);
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Download Failed', 'Please check your internet connection and try again.');
    } finally {
      setDownloadingTourId(null);
      setDownloadProgress(null);
    }
  };

  const handleResumeTour = () => {
    if (lastPlayed) {
      const tour = tours.find(t => t.id === lastPlayed.tourId);
      if (tour && tour.isDownloaded) {
        navigation.navigate('Tour', { 
          tourId: tour.id, 
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

  const handleOptionsPress = (tour: TourWithStatus) => {
    setSelectedTour(tour);
    
    const options = tour.isDownloaded
      ? ['Rate Tour', 'View Notes', 'Share Tour', 'Delete Download', 'Cancel']
      : ['Download Tour', 'Cancel'];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: tour.isDownloaded ? 3 : undefined,
          title: tour.name,
        },
        (buttonIndex) => {
          handleOptionSelected(buttonIndex, tour);
        }
      );
    } else {
      Alert.alert(
        tour.name,
        'Choose an action',
        options.slice(0, -1).map((option, index) => ({
          text: option,
          onPress: () => handleOptionSelected(index, tour),
          style: option === 'Delete Download' ? 'destructive' : 'default',
        })).concat([{ text: 'Cancel', style: 'cancel' }])
      );
    }
  };

  const handleOptionSelected = async (index: number, tour: TourWithStatus) => {
    if (tour.isDownloaded) {
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
        case 3: // Delete Download
          handleDeleteDownload(tour);
          break;
      }
    } else {
      if (index === 0) { // Download Tour
        handleDownloadTour(tour);
      }
    }
  };

  const handleDeleteDownload = async (tour: TourWithStatus) => {
    Alert.alert(
      'Delete Download',
      `Are you sure you want to delete "${tour.name}"? You can re-download it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTourDownload(tour.id);
            setTours(prev => prev.map(t => 
              t.id === tour.id 
                ? { ...t, isDownloaded: false, hasUpdate: false }
                : t
            ));
          },
        },
      ]
    );
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
      case 'downloaded':
        return tour.isDownloaded;
      case 'completed':
        return getProgressPercentage(tour.id) === 100;
      default:
        return true;
    }
  });

  const renderTourCard = ({ item: tour }: { item: TourWithStatus }) => {
    const rating = getRating(tour.id);
    const tourNotes = getNotesForTour(tour.id);
    const progress = getProgressPercentage(tour.id);
    const isDownloading = downloadingTourId === tour.id;
    
    return (
      <View>
        <TourCard
          tour={tour}
          isFavorite={isFavorite(tour.id)}
          rating={rating?.rating}
          noteCount={tourNotes.length}
          progressPercentage={progress}
          isOfflineReady={tour.isDownloaded}
          onPress={() => handleTourPress(tour)}
          onFavoriteToggle={() => handleFavoriteToggle(tour.id)}
          onOptionsPress={() => handleOptionsPress(tour)}
        />
        
        {/* Download indicator */}
        {!tour.isDownloaded && !isDownloading && (
          <View style={styles.cloudBadge}>
            <Ionicons name="cloud-download-outline" size={14} color="#0891b2" />
            <Text style={styles.cloudBadgeText}>Tap to download</Text>
          </View>
        )}
        
        {/* Update available indicator */}
        {tour.isDownloaded && tour.hasUpdate && (
          <View style={[styles.cloudBadge, styles.updateBadge]}>
            <Ionicons name="refresh" size={14} color="#f59e0b" />
            <Text style={[styles.cloudBadgeText, styles.updateText]}>Update available</Text>
          </View>
        )}
        
        {/* Download progress */}
        {isDownloading && downloadProgress && (
          <View style={styles.downloadProgress}>
            <View style={styles.downloadProgressBar}>
              <View 
                style={[
                  styles.downloadProgressFill, 
                  { width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.downloadProgressText}>
              {downloadProgress.currentFile}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Connection status */}
      {!firebaseConnected && (
        <View style={styles.offlineWarning}>
          <Ionicons name="cloud-offline" size={16} color="#f59e0b" />
          <Text style={styles.offlineWarningText}>
            Offline mode - showing downloaded tours only
          </Text>
        </View>
      )}
      
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
        {(['all', 'downloaded', 'favorites', 'completed'] as FilterType[]).map(filter => (
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
              {filter === 'all' ? 'All' :
               filter === 'downloaded' ? 'Downloaded' :
               filter === 'favorites' ? 'Favorites' : 'Completed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {isLoading ? (
        <>
          <ActivityIndicator size="large" color="#0891b2" />
          <Text style={styles.emptyText}>Loading tours...</Text>
        </>
      ) : (
        <>
          <Ionicons
            name={
              activeFilter === 'favorites' ? 'heart-outline' :
              activeFilter === 'downloaded' ? 'cloud-download-outline' :
              activeFilter === 'completed' ? 'checkmark-circle-outline' :
              'map-outline'
            }
            size={64}
            color="#d1d5db"
          />
          <Text style={styles.emptyTitle}>
            {activeFilter === 'favorites' ? 'No Favorites Yet' :
             activeFilter === 'downloaded' ? 'No Downloaded Tours' :
             activeFilter === 'completed' ? 'No Completed Tours' :
             'No Tours Available'}
          </Text>
          <Text style={styles.emptyText}>
            {activeFilter === 'favorites'
              ? 'Tap the heart icon on any tour to add it to your favorites.'
              : activeFilter === 'downloaded'
              ? 'Download a tour to use it offline.'
              : activeFilter === 'completed'
              ? 'Complete a tour to see it here.'
              : 'Pull down to refresh or check your connection.'}
          </Text>
          
          {activeFilter === 'all' && !firebaseConnected && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh" size={18} color="white" />
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Audio Tours</Text>
          {firebaseConnected && (
            <Text style={styles.subtitle}>{tours.length} tours available</Text>
          )}
        </View>
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
        </>
      )}
    </View>
  );
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
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  headerContainer: {
    paddingTop: 16,
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
  },
  offlineWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
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
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    position: 'absolute',
    top: 12,
    left: 12,
  },
  cloudBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0891b2',
  },
  updateBadge: {
    backgroundColor: '#fef3c7',
  },
  updateText: {
    color: '#92400e',
  },
  downloadProgress: {
    backgroundColor: 'white',
    marginTop: -8,
    marginBottom: 16,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
  },
  downloadProgressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  downloadProgressFill: {
    height: '100%',
    backgroundColor: '#0891b2',
    borderRadius: 3,
  },
  downloadProgressText: {
    fontSize: 12,
    color: '#6b7280',
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
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
