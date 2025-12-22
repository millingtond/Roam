import * as FileSystem from 'expo-file-system/legacy';
import { Tour } from '../types';

const TOURS_DIRECTORY = FileSystem.documentDirectory + 'tours/';

interface TourLoaderResult {
  tour: Tour;
  basePath: string;
}

// Ensure tours directory exists
export async function ensureToursDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(TOURS_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(TOURS_DIRECTORY, { intermediates: true });
  }
}

// List all available tours
export async function listTours(): Promise<Array<{ id: string; name: string; path: string }>> {
  await ensureToursDirectory();
  
  const tours: Array<{ id: string; name: string; path: string }> = [];
  
  try {
    const tourFolders = await FileSystem.readDirectoryAsync(TOURS_DIRECTORY);
    
    for (const folder of tourFolders) {
      const tourJsonPath = TOURS_DIRECTORY + folder + '/tour.json';
      const fileInfo = await FileSystem.getInfoAsync(tourJsonPath);
      
      if (fileInfo.exists) {
        try {
          const content = await FileSystem.readAsStringAsync(tourJsonPath);
          const tourData = JSON.parse(content) as Tour;
          tours.push({
            id: tourData.id,
            name: tourData.name,
            path: TOURS_DIRECTORY + folder + '/',
          });
        } catch (e) {
          console.warn(`Invalid tour.json in ${folder}`);
        }
      }
    }
  } catch (error) {
    console.error('Error listing tours:', error);
  }
  
  return tours;
}

// Load a specific tour
export async function loadTour(tourId: string): Promise<TourLoaderResult | null> {
  const tourPath = TOURS_DIRECTORY + tourId + '/';
  const tourJsonPath = tourPath + 'tour.json';
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(tourJsonPath);
    if (!fileInfo.exists) {
      console.error(`Tour not found: ${tourId}`);
      return null;
    }
    
    const content = await FileSystem.readAsStringAsync(tourJsonPath);
    const tour = JSON.parse(content) as Tour;
    
    return {
      tour,
      basePath: tourPath,
    };
  } catch (error) {
    console.error(`Error loading tour ${tourId}:`, error);
    return null;
  }
}

// Get full path for a tour asset (audio/image file)
export function getAssetPath(basePath: string, relativePath: string): string {
  return basePath + relativePath;
}

// Import a tour from a zip file or folder (for future use)
export async function importTourFromJson(jsonString: string, tourId: string): Promise<boolean> {
  try {
    const tour = JSON.parse(jsonString) as Tour;
    const tourPath = TOURS_DIRECTORY + tourId + '/';
    
    await FileSystem.makeDirectoryAsync(tourPath, { intermediates: true });
    await FileSystem.writeAsStringAsync(tourPath + 'tour.json', JSON.stringify(tour, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error importing tour:', error);
    return false;
  }
}

// Delete a tour
export async function deleteTour(tourId: string): Promise<boolean> {
  try {
    const tourPath = TOURS_DIRECTORY + tourId + '/';
    await FileSystem.deleteAsync(tourPath, { idempotent: true });
    return true;
  } catch (error) {
    console.error(`Error deleting tour ${tourId}:`, error);
    return false;
  }
}

// Validate tour data structure
export function validateTour(tour: unknown): tour is Tour {
  if (!tour || typeof tour !== 'object') return false;
  
  const t = tour as Record<string, unknown>;
  
  // Check required fields
  if (typeof t.id !== 'string') return false;
  if (typeof t.name !== 'string') return false;
  if (!Array.isArray(t.stops)) return false;
  if (!t.startPoint || typeof t.startPoint !== 'object') return false;
  
  // Check each stop has required fields
  for (const stop of t.stops) {
    if (typeof stop !== 'object' || !stop) return false;
    const s = stop as Record<string, unknown>;
    if (typeof s.id !== 'number') return false;
    if (typeof s.name !== 'string') return false;
    if (typeof s.latitude !== 'number') return false;
    if (typeof s.longitude !== 'number') return false;
    if (typeof s.audioFile !== 'string') return false;
  }
  
  return true;
}

// Get tour statistics
export function getTourStats(tour: Tour): {
  totalStops: number;
  totalDistance: number;
  estimatedDuration: number;
  totalAudioDuration: number;
} {
  const totalAudioDuration = tour.stops.reduce(
    (sum, stop) => sum + (stop.audioDuration || 0),
    0
  );
  
  return {
    totalStops: tour.stops.length,
    totalDistance: tour.totalDistance || 0,
    estimatedDuration: tour.estimatedDuration || 0,
    totalAudioDuration,
  };
}
