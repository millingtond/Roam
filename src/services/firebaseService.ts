/**
 * Firebase Service for Audio Tour App
 * 
 * Handles:
 * - Fetching tour list from Firestore
 * - Downloading audio/images from Firebase Storage
 * - Version checking for tour updates
 * - Caching and offline support
 */

import * as FileSystem from 'expo-file-system';
const { documentDirectory, cacheDirectory } = FileSystem;
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query,
  orderBy,
  Firestore 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  getDownloadURL,
  FirebaseStorage 
} from 'firebase/storage';
import { Tour, TourStop } from '../types';

// Firebase configuration - same as tour-creator
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBnXqzs7n7Q16Np-74z2lpYI44_M4wimtE",
  authDomain: "roam-ec797.firebaseapp.com",
  projectId: "roam-ec797",
  storageBucket: "roam-ec797.firebasestorage.app",
  messagingSenderId: "754058859162",
  appId: "1:754058859162:web:9e9bf19b0caa1e4d32c523"
};

// Local directories
const TOURS_DIR = documentDirectory + 'tours/';
const CACHE_DIR = cacheDirectory + 'tour-cache/';

// Storage keys
const TOUR_VERSIONS_KEY = 'tour_versions';
const LAST_SYNC_KEY = 'last_tour_sync';

// Types
export interface CloudTour {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  language: string;
  coverImage?: string;
  totalDistance?: number;
  estimatedDuration: number;
  difficulty?: 'easy' | 'moderate' | 'challenging';
  stops: TourStop[];
  startPoint: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  updatedAt: string;
  createdAt?: string;
  audioGenerated?: boolean;
}

export interface TourVersion {
  tourId: string;
  version: string;
  downloadedAt: string;
}

export interface DownloadProgress {
  tourId: string;
  stage: 'metadata' | 'audio' | 'images' | 'complete';
  current: number;
  total: number;
  currentFile?: string;
}

type ProgressCallback = (progress: DownloadProgress) => void;

// Firebase instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

/**
 * Initialize Firebase connection
 */
export function initializeFirebase(): boolean {
  try {
    if (getApps().length === 0) {
      app = initializeApp(FIREBASE_CONFIG);
    } else {
      app = getApps()[0];
    }
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('✅ Firebase initialized');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return false;
  }
}

/**
 * Check if Firebase is connected
 */
export function isFirebaseConnected(): boolean {
  return db !== null && storage !== null;
}

/**
 * Ensure local directories exist
 */
async function ensureDirectories(): Promise<void> {
  const dirs = [TOURS_DIR, CACHE_DIR];
  for (const dir of dirs) {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }
}

/**
 * Fetch list of all available tours from Firestore
 */
export async function fetchAvailableTours(): Promise<CloudTour[]> {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    const toursRef = collection(db, 'tours');
    const q = query(toursRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const tours: CloudTour[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      tours.push({
        id: doc.id,
        ...data,
      } as CloudTour);
    });

    // Cache the last sync time
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    
    console.log(`📥 Fetched ${tours.length} tours from cloud`);
    return tours;
  } catch (error) {
    console.error('Failed to fetch tours:', error);
    throw error;
  }
}

/**
 * Fetch a single tour by ID
 */
export async function fetchTourById(tourId: string): Promise<CloudTour | null> {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    const tourRef = doc(db, 'tours', tourId);
    const snapshot = await getDoc(tourRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as CloudTour;
  } catch (error) {
    console.error(`Failed to fetch tour ${tourId}:`, error);
    throw error;
  }
}

/**
 * Get download URL for a file in Firebase Storage
 */
export async function getStorageUrl(path: string): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const fileRef = ref(storage, path);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error(`Failed to get URL for ${path}:`, error);
    throw error;
  }
}

/**
 * Download a tour and all its assets for offline use
 */
export async function downloadTourForOffline(
  tourId: string,
  onProgress?: ProgressCallback
): Promise<boolean> {
  await ensureDirectories();

  try {
    // 1. Fetch tour metadata
    onProgress?.({
      tourId,
      stage: 'metadata',
      current: 0,
      total: 1,
      currentFile: 'Fetching tour data...',
    });

    const tour = await fetchTourById(tourId);
    if (!tour) {
      throw new Error('Tour not found');
    }

    const tourDir = TOURS_DIR + tourId + '/';
    const audioDir = tourDir + 'audio/';
    const imagesDir = tourDir + 'images/';

    // Create directories
    await FileSystem.makeDirectoryAsync(tourDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });

    // 2. Download audio files
    const audioFiles = tour.stops.filter(s => s.audioFile);
    for (let i = 0; i < audioFiles.length; i++) {
      const stop = audioFiles[i];
      const audioFileName = stop.audioFile.split('/').pop() || `${stop.id}.mp3`;
      
      onProgress?.({
        tourId,
        stage: 'audio',
        current: i + 1,
        total: audioFiles.length,
        currentFile: `Audio: ${stop.name}`,
      });

      try {
        // Get download URL from Firebase Storage
        const storagePath = `tours/${tourId}/audio/${audioFileName}`;
        const downloadUrl = await getStorageUrl(storagePath);
        
        // Download to local storage
        const localPath = audioDir + audioFileName;
        await FileSystem.downloadAsync(downloadUrl, localPath);
        
        console.log(`✅ Downloaded audio: ${audioFileName}`);
      } catch (error) {
        console.warn(`⚠️ Failed to download audio for stop ${stop.id}:`, error);
        // Continue with other files
      }
    }

    // 3. Download images
    const imageFiles = tour.stops.filter(s => s.imageFile);
    for (let i = 0; i < imageFiles.length; i++) {
      const stop = imageFiles[i];
      const imageFileName = stop.imageFile!.split('/').pop() || `${stop.id}.jpg`;
      
      onProgress?.({
        tourId,
        stage: 'images',
        current: i + 1,
        total: imageFiles.length,
        currentFile: `Image: ${stop.name}`,
      });

      try {
        const storagePath = `tours/${tourId}/images/${imageFileName}`;
        const downloadUrl = await getStorageUrl(storagePath);
        
        const localPath = imagesDir + imageFileName;
        await FileSystem.downloadAsync(downloadUrl, localPath);
        
        console.log(`✅ Downloaded image: ${imageFileName}`);
      } catch (error) {
        console.warn(`⚠️ Failed to download image for stop ${stop.id}:`, error);
      }
    }

    // 4. Download cover image if exists
    if (tour.coverImage) {
      try {
        const coverFileName = tour.coverImage.split('/').pop() || 'cover.jpg';
        const storagePath = `tours/${tourId}/${coverFileName}`;
        const downloadUrl = await getStorageUrl(storagePath);
        await FileSystem.downloadAsync(downloadUrl, tourDir + coverFileName);
        tour.coverImage = coverFileName;
      } catch (error) {
        console.warn('⚠️ Failed to download cover image:', error);
      }
    }

    // 5. Save tour.json with LOCAL paths
    const localTour: Tour = {
      ...tour,
      stops: tour.stops.map(stop => ({
        ...stop,
        audioFile: `audio/${stop.audioFile.split('/').pop()}`,
        imageFile: stop.imageFile ? `images/${stop.imageFile.split('/').pop()}` : undefined,
      })),
    };

    await FileSystem.writeAsStringAsync(
      tourDir + 'tour.json',
      JSON.stringify(localTour, null, 2)
    );

    // 6. Save version info
    await saveTourVersion(tourId, tour.version);

    onProgress?.({
      tourId,
      stage: 'complete',
      current: 1,
      total: 1,
      currentFile: 'Complete!',
    });

    console.log(`✅ Tour ${tourId} downloaded successfully`);
    return true;

  } catch (error) {
    console.error(`❌ Failed to download tour ${tourId}:`, error);
    throw error;
  }
}

/**
 * Check if a tour needs updating
 */
export async function checkForTourUpdate(tourId: string): Promise<{
  hasUpdate: boolean;
  cloudVersion?: string;
  localVersion?: string;
}> {
  try {
    const cloudTour = await fetchTourById(tourId);
    if (!cloudTour) {
      return { hasUpdate: false };
    }

    const localVersion = await getLocalTourVersion(tourId);
    
    if (!localVersion) {
      // Tour not downloaded yet
      return { 
        hasUpdate: true, 
        cloudVersion: cloudTour.version,
      };
    }

    const hasUpdate = cloudTour.version !== localVersion;
    
    return {
      hasUpdate,
      cloudVersion: cloudTour.version,
      localVersion,
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { hasUpdate: false };
  }
}

/**
 * Check all downloaded tours for updates
 */
export async function checkAllToursForUpdates(): Promise<Map<string, boolean>> {
  const updates = new Map<string, boolean>();
  
  try {
    const versions = await getSavedVersions();
    
    for (const [tourId] of Object.entries(versions)) {
      const result = await checkForTourUpdate(tourId);
      updates.set(tourId, result.hasUpdate);
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
  
  return updates;
}

/**
 * Get locally saved tour versions
 */
async function getSavedVersions(): Promise<Record<string, TourVersion>> {
  try {
    const data = await AsyncStorage.getItem(TOUR_VERSIONS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Save a tour's version info
 */
async function saveTourVersion(tourId: string, version: string): Promise<void> {
  const versions = await getSavedVersions();
  versions[tourId] = {
    tourId,
    version,
    downloadedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(TOUR_VERSIONS_KEY, JSON.stringify(versions));
}

/**
 * Get local version of a specific tour
 */
async function getLocalTourVersion(tourId: string): Promise<string | null> {
  const versions = await getSavedVersions();
  return versions[tourId]?.version || null;
}

/**
 * Check if a tour is downloaded locally
 */
export async function isTourDownloaded(tourId: string): Promise<boolean> {
  const tourJsonPath = TOURS_DIR + tourId + '/tour.json';
  const info = await FileSystem.getInfoAsync(tourJsonPath);
  return info.exists;
}

/**
 * Get download status for multiple tours
 */
export async function getToursDownloadStatus(
  tourIds: string[]
): Promise<Map<string, boolean>> {
  const status = new Map<string, boolean>();
  
  for (const id of tourIds) {
    status.set(id, await isTourDownloaded(id));
  }
  
  return status;
}

/**
 * Delete a downloaded tour
 */
export async function deleteTourDownload(tourId: string): Promise<boolean> {
  try {
    const tourDir = TOURS_DIR + tourId;
    await FileSystem.deleteAsync(tourDir, { idempotent: true });
    
    // Remove version info
    const versions = await getSavedVersions();
    delete versions[tourId];
    await AsyncStorage.setItem(TOUR_VERSIONS_KEY, JSON.stringify(versions));
    
    console.log(`🗑️ Deleted tour ${tourId}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete tour ${tourId}:`, error);
    return false;
  }
}

/**
 * Get the local path for a downloaded tour
 */
export function getLocalTourPath(tourId: string): string {
  return TOURS_DIR + tourId + '/';
}

/**
 * Convert cloud tour to local Tour type (for display before download)
 */
export function cloudTourToLocal(cloudTour: CloudTour): Tour {
  return {
    id: cloudTour.id,
    name: cloudTour.name,
    description: cloudTour.description,
    version: cloudTour.version,
    author: cloudTour.author,
    language: cloudTour.language,
    coverImage: cloudTour.coverImage,
    totalDistance: cloudTour.totalDistance,
    estimatedDuration: cloudTour.estimatedDuration,
    difficulty: cloudTour.difficulty,
    stops: cloudTour.stops,
    startPoint: cloudTour.startPoint,
  };
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<Date | null> {
  const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
  return timestamp ? new Date(timestamp) : null;
}

// Export types
export type { ProgressCallback };
