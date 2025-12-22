import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tour, TourProgress, TourStop } from '../types';

interface UseTourProgressResult {
  currentStopIndex: number;
  currentStop: TourStop | null;
  nextStop: TourStop | null;
  previousStop: TourStop | null;
  progress: number; // 0-1
  isFirstStop: boolean;
  isLastStop: boolean;
  isTourComplete: boolean;
  goToStop: (index: number) => void;
  goToNextStop: () => void;
  goToPreviousStop: () => void;
  markCurrentComplete: () => void;
  resetTour: () => void;
  completedStopIds: Set<number>;
}

const PROGRESS_STORAGE_KEY = 'tour_progress_';

export function useTourProgress(tour: Tour | null): UseTourProgressResult {
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [completedStopIds, setCompletedStopIds] = useState<Set<number>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const stops = tour?.stops || [];
  const totalStops = stops.length;

  // Load saved progress on mount
  useEffect(() => {
    if (!tour) return;

    const loadProgress = async () => {
      try {
        const saved = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY + tour.id);
        if (saved) {
          const progress = JSON.parse(saved);
          setCurrentStopIndex(progress.currentStopIndex || 0);
          setCompletedStopIds(new Set(progress.completedStopIds || []));
        }
      } catch (error) {
        console.log('No saved progress found');
      } finally {
        setIsLoaded(true);
      }
    };

    loadProgress();
  }, [tour?.id]);

  // Save progress when it changes
  useEffect(() => {
    if (!tour || !isLoaded) return;

    const saveProgress = async () => {
      try {
        await AsyncStorage.setItem(
          PROGRESS_STORAGE_KEY + tour.id,
          JSON.stringify({
            currentStopIndex,
            completedStopIds: Array.from(completedStopIds),
          })
        );
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    };

    saveProgress();
  }, [tour?.id, currentStopIndex, completedStopIds]);

  const currentStop = stops[currentStopIndex] || null;
  const nextStop = stops[currentStopIndex + 1] || null;
  const previousStop = stops[currentStopIndex - 1] || null;

  const progress = totalStops > 0 ? (currentStopIndex + 1) / totalStops : 0;
  const isFirstStop = currentStopIndex === 0;
  const isLastStop = currentStopIndex === totalStops - 1;
  const isTourComplete = completedStopIds.size === totalStops && totalStops > 0;

  const goToStop = useCallback((index: number) => {
    if (index >= 0 && index < totalStops) {
      setCurrentStopIndex(index);
    }
  }, [totalStops]);

  const goToNextStop = useCallback(() => {
    if (currentStopIndex < totalStops - 1) {
      setCurrentStopIndex(prev => prev + 1);
    }
  }, [currentStopIndex, totalStops]);

  const goToPreviousStop = useCallback(() => {
    if (currentStopIndex > 0) {
      setCurrentStopIndex(prev => prev - 1);
    }
  }, [currentStopIndex]);

  const markCurrentComplete = useCallback(() => {
    if (currentStop) {
      setCompletedStopIds(prev => new Set([...prev, currentStop.id]));
    }
  }, [currentStop]);

  const resetTour = useCallback(async () => {
    setCurrentStopIndex(0);
    setCompletedStopIds(new Set());
    
    if (tour) {
      try {
        await AsyncStorage.removeItem(PROGRESS_STORAGE_KEY + tour.id);
      } catch (error) {
        console.error('Failed to clear saved progress:', error);
      }
    }
  }, [tour?.id]);

  return {
    currentStopIndex,
    currentStop,
    nextStop,
    previousStop,
    progress,
    isFirstStop,
    isLastStop,
    isTourComplete,
    goToStop,
    goToNextStop,
    goToPreviousStop,
    markCurrentComplete,
    resetTour,
    completedStopIds,
  };
}
