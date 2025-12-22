// Hooks index - export all hooks for easy importing

export * from './useAudioPlayer';
export { useGeofence } from './useGeofence';
export { useLocation } from './useLocation';
export { useSettings } from './useSettings';
export { useTourProgress } from './useTourProgress';
export {
  useFavorites,
  useTourRatings,
  useTourNotes,
  useTourProgressData,
  useTourUserData,
} from './useTourUserData';

// Re-export types from useTourUserData
export type {
  TourRating,
  TourNote,
  TourProgressData,
  LastPlayedTour,
} from './useTourUserData';
