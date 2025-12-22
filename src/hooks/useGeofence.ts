import { useState, useEffect, useRef, useCallback } from 'react';
import { TourStop, LocationState } from '../types';
import { calculateDistance } from './useLocation';

interface UseGeofenceResult {
  triggeredStop: TourStop | null;
  distanceToNextStop: number | null;
  nearestUnvisitedStop: TourStop | null;
  visitedStops: Set<number>;
  markStopVisited: (stopId: number) => void;
  resetVisited: () => void;
  clearTriggeredStop: () => void;
}

interface UseGeofenceOptions {
  defaultTriggerRadius?: number;
  enabled?: boolean;
}

export function useGeofence(
  stops: TourStop[],
  currentLocation: LocationState | null,
  currentStopIndex: number,
  options: UseGeofenceOptions = {}
): UseGeofenceResult {
  const { defaultTriggerRadius = 25, enabled = true } = options;
  
  const [triggeredStop, setTriggeredStop] = useState<TourStop | null>(null);
  const [distanceToNextStop, setDistanceToNextStop] = useState<number | null>(null);
  const [nearestUnvisitedStop, setNearestUnvisitedStop] = useState<TourStop | null>(null);
  const visitedStopsRef = useRef<Set<number>>(new Set());
  const [visitedStops, setVisitedStops] = useState<Set<number>>(new Set());

  const markStopVisited = useCallback((stopId: number) => {
    visitedStopsRef.current.add(stopId);
    setVisitedStops(new Set(visitedStopsRef.current));
  }, []);

  const resetVisited = useCallback(() => {
    visitedStopsRef.current.clear();
    setVisitedStops(new Set());
    setTriggeredStop(null);
  }, []);

  const clearTriggeredStop = useCallback(() => {
    setTriggeredStop(null);
  }, []);

  // Check for geofence triggers whenever location updates
  useEffect(() => {
    if (!currentLocation || !enabled || stops.length === 0) {
      return;
    }

    let closestUnvisitedDistance = Infinity;
    let closestUnvisitedStop: TourStop | null = null;
    let newTriggeredStop: TourStop | null = null;

    // Check each stop
    for (const stop of stops) {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        stop.latitude,
        stop.longitude
      );

      const triggerRadius = stop.triggerRadius || defaultTriggerRadius;

      // Track closest unvisited stop
      if (!visitedStopsRef.current.has(stop.id) && distance < closestUnvisitedDistance) {
        closestUnvisitedDistance = distance;
        closestUnvisitedStop = stop;
      }

      // Check if we've entered a geofence (and haven't visited this stop yet)
      if (distance <= triggerRadius && !visitedStopsRef.current.has(stop.id)) {
        newTriggeredStop = stop;
        // Don't break - we want to check all stops to find the closest one
        // But prioritize the one we're actually inside
      }
    }

    // Update nearest unvisited stop
    setNearestUnvisitedStop(closestUnvisitedStop);

    // Calculate distance to current stop (the one we're heading toward)
    const targetStop = stops[currentStopIndex];
    if (targetStop) {
      const distToTarget = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        targetStop.latitude,
        targetStop.longitude
      );
      setDistanceToNextStop(distToTarget);
    } else {
      setDistanceToNextStop(null);
    }

    // Trigger the stop if we found one
    if (newTriggeredStop && !triggeredStop) {
      setTriggeredStop(newTriggeredStop);
    }
  }, [currentLocation, stops, enabled, defaultTriggerRadius, currentStopIndex, triggeredStop]);

  return {
    triggeredStop,
    distanceToNextStop,
    nearestUnvisitedStop,
    visitedStops,
    markStopVisited,
    resetVisited,
    clearTriggeredStop,
  };
}

// Utility: Check if user is approaching a stop (within 2x trigger radius)
export function isApproachingStop(
  location: LocationState,
  stop: TourStop,
  multiplier: number = 2
): boolean {
  const distance = calculateDistance(
    location.latitude,
    location.longitude,
    stop.latitude,
    stop.longitude
  );
  return distance <= stop.triggerRadius * multiplier;
}

// Utility: Get stops sorted by distance from current location
export function getStopsByDistance(
  stops: TourStop[],
  location: LocationState
): Array<{ stop: TourStop; distance: number }> {
  return stops
    .map(stop => ({
      stop,
      distance: calculateDistance(
        location.latitude,
        location.longitude,
        stop.latitude,
        stop.longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
}
