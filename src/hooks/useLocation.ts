import { useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LocationState } from '../types';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task in the global scope
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }: any) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    // Emit the location to the UI
    DeviceEventEmitter.emit('background-location-update', locations[0]);
  }
});

interface UseLocationResult {
  location: LocationState | null;
  errorMsg: string | null;
  isTracking: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  requestPermissions: () => Promise<boolean>;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const handleLocationUpdate = useCallback((newLocation: any) => {
    // Standardize the location object
    // Handle both direct objects (foreground) and array-wrapped (background) if needed
    const coords = newLocation.coords || newLocation;

    setLocation({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      heading: coords.heading,
      timestamp: newLocation.timestamp || Date.now(),
    });
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        setErrorMsg('Location permission denied.');
        return false;
      }

      // Background permissions are required for the task manager to work fully
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        console.warn('Background location denied. App may stop when locked.');
      }

      setErrorMsg(null);
      return true;
    } catch (error) {
      setErrorMsg('Failed to request permissions');
      return false;
    }
  }, []);

  const startTracking = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      // Listen for updates from the background task
      const subscription = DeviceEventEmitter.addListener(
        'background-location-update',
        handleLocationUpdate
      );

      // Start the persistent location service
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 5,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "Audio Tour Active",
          notificationBody: "Tracking your location for the tour.",
        },
      });

      setIsTracking(true);
      setErrorMsg(null);
    } catch (error) {
      setErrorMsg('Failed to start location tracking');
      console.error(error);
    }
  }, [requestPermissions, handleLocationUpdate]);

  const stopTracking = useCallback(async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      DeviceEventEmitter.removeAllListeners('background-location-update');
      setIsTracking(false);
    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  }, []);

  // Cleanup on unmount (optional: allows tracking to continue if you navigate away)
  // For this app, we generally want to stop if the hook unmounts completely,
  // but usually HomeScreen -> TourScreen keeps it alive.
  useEffect(() => {
    // Check if already tracking on mount (e.g. recovering from background)
    TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME).then((isRegistered) => {
      setIsTracking(isRegistered);
      if (isRegistered) {
        DeviceEventEmitter.addListener('background-location-update', handleLocationUpdate);
      }
    });

    return () => {
      DeviceEventEmitter.removeAllListeners('background-location-update');
    };
  }, [handleLocationUpdate]);

  return {
    location,
    errorMsg,
    isTracking,
    startTracking,
    stopTracking,
    requestPermissions,
  };
}

// Utility functions (preserved from original)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2)
    + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2)
    - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function formatDistance(meters: number, useMetric: boolean = true): string {
  if (useMetric) {
    return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
  }
  const feet = meters * 3.28084;
  return feet < 5280 ? `${Math.round(feet)} ft` : `${(feet / 5280).toFixed(1)} mi`;
}
