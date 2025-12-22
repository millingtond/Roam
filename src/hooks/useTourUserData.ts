import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const FAVORITES_KEY = 'tour_favorites';
const RATINGS_KEY = 'tour_ratings';
const NOTES_KEY = 'tour_notes';
const PROGRESS_KEY = 'tour_progress_';
const LAST_PLAYED_KEY = 'last_played_tour';

// Types
export interface TourRating {
  tourId: string;
  rating: number; // 1-5 stars
  review: string;
  createdAt: string;
  updatedAt: string;
}

export interface TourNote {
  id: string;
  tourId: string;
  stopId?: number;
  text: string;
  createdAt: string;
}

export interface TourProgressData {
  tourId: string;
  currentStopIndex: number;
  completedStopIds: number[];
  lastPlayedAt: string;
  audioPosition?: number; // milliseconds into current audio
  isComplete: boolean;
  totalStops: number;
}

export interface LastPlayedTour {
  tourId: string;
  tourName: string;
  currentStopIndex: number;
  totalStops: number;
  timestamp: string;
}

// Hook for managing favorites
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem(FAVORITES_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = useCallback(async (tourId: string) => {
    const newFavorites = favorites.includes(tourId)
      ? favorites.filter(id => id !== tourId)
      : [...favorites, tourId];
    
    setFavorites(newFavorites);
    
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
    
    return !favorites.includes(tourId); // Returns new favorite status
  }, [favorites]);

  const isFavorite = useCallback((tourId: string) => {
    return favorites.includes(tourId);
  }, [favorites]);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
  };
}

// Hook for managing tour ratings
export function useTourRatings() {
  const [ratings, setRatings] = useState<Record<string, TourRating>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      const saved = await AsyncStorage.getItem(RATINGS_KEY);
      if (saved) {
        setRatings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load ratings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setRating = useCallback(async (tourId: string, rating: number, review: string = '') => {
    const now = new Date().toISOString();
    const existing = ratings[tourId];
    
    const newRating: TourRating = {
      tourId,
      rating,
      review,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    
    const newRatings = { ...ratings, [tourId]: newRating };
    setRatings(newRatings);
    
    try {
      await AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(newRatings));
    } catch (error) {
      console.error('Failed to save rating:', error);
    }
  }, [ratings]);

  const getRating = useCallback((tourId: string): TourRating | null => {
    return ratings[tourId] || null;
  }, [ratings]);

  const deleteRating = useCallback(async (tourId: string) => {
    const newRatings = { ...ratings };
    delete newRatings[tourId];
    setRatings(newRatings);
    
    try {
      await AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(newRatings));
    } catch (error) {
      console.error('Failed to delete rating:', error);
    }
  }, [ratings]);

  return {
    ratings,
    isLoading,
    setRating,
    getRating,
    deleteRating,
  };
}

// Hook for managing tour notes
export function useTourNotes() {
  const [notes, setNotes] = useState<TourNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTES_KEY);
      if (saved) {
        setNotes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNote = useCallback(async (tourId: string, text: string, stopId?: number) => {
    const newNote: TourNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tourId,
      stopId,
      text,
      createdAt: new Date().toISOString(),
    };
    
    const newNotes = [...notes, newNote];
    setNotes(newNotes);
    
    try {
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(newNotes));
    } catch (error) {
      console.error('Failed to save note:', error);
    }
    
    return newNote;
  }, [notes]);

  const updateNote = useCallback(async (noteId: string, text: string) => {
    const newNotes = notes.map(note => 
      note.id === noteId ? { ...note, text } : note
    );
    setNotes(newNotes);
    
    try {
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(newNotes));
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  }, [notes]);

  const deleteNote = useCallback(async (noteId: string) => {
    const newNotes = notes.filter(note => note.id !== noteId);
    setNotes(newNotes);
    
    try {
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(newNotes));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }, [notes]);

  const getNotesForTour = useCallback((tourId: string) => {
    return notes.filter(note => note.tourId === tourId);
  }, [notes]);

  const getNotesForStop = useCallback((tourId: string, stopId: number) => {
    return notes.filter(note => note.tourId === tourId && note.stopId === stopId);
  }, [notes]);

  return {
    notes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    getNotesForTour,
    getNotesForStop,
  };
}

// Hook for managing tour progress across sessions
export function useTourProgressData() {
  const [progressMap, setProgressMap] = useState<Record<string, TourProgressData>>({});
  const [lastPlayed, setLastPlayed] = useState<LastPlayedTour | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllProgress();
  }, []);

  const loadAllProgress = async () => {
    try {
      // Load last played tour
      const lastPlayedData = await AsyncStorage.getItem(LAST_PLAYED_KEY);
      if (lastPlayedData) {
        setLastPlayed(JSON.parse(lastPlayedData));
      }

      // Load all progress data
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(key => key.startsWith(PROGRESS_KEY));
      
      if (progressKeys.length > 0) {
        const progressEntries = await AsyncStorage.multiGet(progressKeys);
        const progressData: Record<string, TourProgressData> = {};
        
        progressEntries.forEach(([key, value]) => {
          if (value) {
            const tourId = key.replace(PROGRESS_KEY, '');
            progressData[tourId] = JSON.parse(value);
          }
        });
        
        setProgressMap(progressData);
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = useCallback(async (
    tourId: string,
    tourName: string,
    currentStopIndex: number,
    completedStopIds: number[],
    totalStops: number,
    audioPosition?: number
  ) => {
    const now = new Date().toISOString();
    const isComplete = completedStopIds.length >= totalStops;
    
    const progress: TourProgressData = {
      tourId,
      currentStopIndex,
      completedStopIds,
      lastPlayedAt: now,
      audioPosition,
      isComplete,
      totalStops,
    };
    
    const newProgressMap = { ...progressMap, [tourId]: progress };
    setProgressMap(newProgressMap);
    
    // Update last played
    const lastPlayedData: LastPlayedTour = {
      tourId,
      tourName,
      currentStopIndex,
      totalStops,
      timestamp: now,
    };
    setLastPlayed(lastPlayedData);
    
    try {
      await AsyncStorage.setItem(PROGRESS_KEY + tourId, JSON.stringify(progress));
      await AsyncStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(lastPlayedData));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [progressMap]);

  const getProgress = useCallback((tourId: string): TourProgressData | null => {
    return progressMap[tourId] || null;
  }, [progressMap]);

  const getProgressPercentage = useCallback((tourId: string): number => {
    const progress = progressMap[tourId];
    if (!progress || progress.totalStops === 0) return 0;
    return Math.round((progress.completedStopIds.length / progress.totalStops) * 100);
  }, [progressMap]);

  const clearProgress = useCallback(async (tourId: string) => {
    const newProgressMap = { ...progressMap };
    delete newProgressMap[tourId];
    setProgressMap(newProgressMap);
    
    // Clear last played if it matches
    if (lastPlayed?.tourId === tourId) {
      setLastPlayed(null);
      await AsyncStorage.removeItem(LAST_PLAYED_KEY);
    }
    
    try {
      await AsyncStorage.removeItem(PROGRESS_KEY + tourId);
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }, [progressMap, lastPlayed]);

  const clearAllProgress = useCallback(async () => {
    setProgressMap({});
    setLastPlayed(null);
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(key => key.startsWith(PROGRESS_KEY));
      await AsyncStorage.multiRemove([...progressKeys, LAST_PLAYED_KEY]);
    } catch (error) {
      console.error('Failed to clear all progress:', error);
    }
  }, []);

  return {
    progressMap,
    lastPlayed,
    isLoading,
    saveProgress,
    getProgress,
    getProgressPercentage,
    clearProgress,
    clearAllProgress,
  };
}

// Combined hook for all tour user data
export function useTourUserData() {
  const favorites = useFavorites();
  const ratings = useTourRatings();
  const notes = useTourNotes();
  const progress = useTourProgressData();

  return {
    favorites,
    ratings,
    notes,
    progress,
    isLoading: favorites.isLoading || ratings.isLoading || notes.isLoading || progress.isLoading,
  };
}
