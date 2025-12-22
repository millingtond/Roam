import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Tour, TourStop, LocationState } from '../types';

interface MapDisplayProps {
  tour: Tour;
  currentLocation: LocationState | null;
  currentStopIndex: number;
  visitedStops: Set<number>;
  onStopPress: (stop: TourStop) => void;
}

export function MapDisplay({
  tour,
  currentLocation,
  currentStopIndex,
  visitedStops,
  onStopPress,
}: MapDisplayProps) {
  const mapRef = useRef<MapView>(null);
  const hasInitiallyCentered = useRef(false);
  const [followUser, setFollowUser] = useState(true);

  // Calculate initial region to show entire route
  const getInitialRegion = (): Region => {
    const { stops, startPoint } = tour;
    
    if (stops.length === 0) {
      return {
        latitude: startPoint.latitude,
        longitude: startPoint.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Find bounds of all stops
    let minLat = startPoint.latitude;
    let maxLat = startPoint.latitude;
    let minLng = startPoint.longitude;
    let maxLng = startPoint.longitude;

    stops.forEach(stop => {
      minLat = Math.min(minLat, stop.latitude);
      maxLat = Math.max(maxLat, stop.latitude);
      minLng = Math.min(minLng, stop.longitude);
      maxLng = Math.max(maxLng, stop.longitude);
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.5 || 0.01;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.01;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.005),
      longitudeDelta: Math.max(lngDelta, 0.005),
    };
  };

  // Center on user location only initially or when following is enabled
  useEffect(() => {
    if (currentLocation && mapRef.current && followUser) {
      if (!hasInitiallyCentered.current) {
        mapRef.current.animateToRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 500);
        hasInitiallyCentered.current = true;
      }
    }
  }, [currentLocation?.latitude, currentLocation?.longitude, followUser]);

  // Stop following when user pans the map
  const handleMapPanDrag = () => {
    setFollowUser(false);
  };

  // Re-center button handler
  const handleRecenter = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
      setFollowUser(true);
    }
  };

  // Convert route waypoints to polyline coordinates
  const routeCoordinates = tour.route?.waypoints?.map(([lat, lng]) => ({
    latitude: lat,
    longitude: lng,
  })) || tour.stops.map(stop => ({
    latitude: stop.latitude,
    longitude: stop.longitude,
  }));

  const getMarkerColor = (stop: TourStop, index: number): string => {
    if (visitedStops.has(stop.id)) {
      return '#22c55e'; // Green for visited
    }
    if (index === currentStopIndex) {
      return '#0891b2'; // Cyan for current
    }
    return '#ef4444'; // Red for upcoming
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={getInitialRegion()}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        rotateEnabled={true}
        pitchEnabled={false}
        onPanDrag={handleMapPanDrag}
      >
        {/* Route line */}
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#ef4444"
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />

        {/* Stop markers */}
        {tour.stops.map((stop, index) => (
          <Marker
            key={stop.id}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            onPress={() => onStopPress(stop)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.marker,
                  { backgroundColor: getMarkerColor(stop, index) },
                  index === currentStopIndex && styles.currentMarker,
                ]}
              >
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
              {index === currentStopIndex && (
                <View style={styles.markerPulse} />
              )}
            </View>
          </Marker>
        ))}

        {/* Current stop highlight circle */}
        {tour.stops[currentStopIndex] && (
          <Marker
            coordinate={{
              latitude: tour.stops[currentStopIndex].latitude,
              longitude: tour.stops[currentStopIndex].longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.triggerRadius} />
          </Marker>
        )}
      </MapView>

      {/* Re-center button */}
      {!followUser && currentLocation && (
        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
          <Ionicons name="locate" size={24} color="#0891b2" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  currentMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
  },
  markerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markerPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(8, 145, 178, 0.2)',
  },
  triggerRadius: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});
