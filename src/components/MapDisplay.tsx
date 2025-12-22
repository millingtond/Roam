import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Tour, TourStop, UserLocation } from '../types';

interface MapDisplayProps {
  tour: Tour;
  currentLocation: UserLocation | null;
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
  
  // Animation value for the pulsing effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // OFFLINE MAP CONFIGURATION
  // Point to the specific tour folder where OfflineManager saves tiles
  const localTilePath = `${FileSystem.documentDirectory}offline/map-tiles/${tour.id}/{z}/{x}/{y}.png`;

  // Start the pulse animation loop
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Calculate initial region
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

    let minLat = startPoint.latitude, maxLat = startPoint.latitude;
    let minLng = startPoint.longitude, maxLng = startPoint.longitude;

    stops.forEach(stop => {
      minLat = Math.min(minLat, stop.latitude);
      maxLat = Math.max(maxLat, stop.latitude);
      minLng = Math.min(minLng, stop.longitude);
      maxLng = Math.max(maxLng, stop.longitude);
    });

    const latDelta = (maxLat - minLat) * 1.5 || 0.01;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.01;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.005),
      longitudeDelta: Math.max(lngDelta, 0.005),
    };
  };

  // Center on user
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

  // Convert route coordinates to polyline format
  const routeCoordinates = tour.route?.coordinates?.map((coord) => ({
    latitude: coord.latitude, 
    longitude: coord.longitude,
  })) || tour.stops.map(s => ({ latitude: s.latitude, longitude: s.longitude }));

  const getMarkerColor = (stop: TourStop, index: number): string => {
    if (visitedStops.has(stop.id)) return '#22c55e'; // Visited (Green)
    if (index === currentStopIndex) return '#0891b2'; // Current (Cyan)
    return '#ef4444'; // Upcoming (Red)
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={getInitialRegion()}
        showsUserLocation={true}
        showsMyLocationButton={false} // Custom button used instead
        showsCompass={true}
        rotateEnabled={true}
        pitchEnabled={false}
        onPanDrag={() => setFollowUser(false)}
      >
        {/* Offline Tiles Layer */}
        <UrlTile
          urlTemplate={localTilePath}
          zIndex={-1}
          maximumZ={19}
          flipY={false}
          tileSize={256}
        />

        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#0891b2"
          strokeWidth={4}
          lineDashPattern={[1, 0]} // Solid line for path
        />

        {tour.stops.map((stop, index) => {
          const isCurrent = index === currentStopIndex;
          const isVisited = visitedStops.has(stop.id);
          const backgroundColor = getMarkerColor(stop, index);

          return (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              onPress={() => onStopPress(stop)}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={isCurrent ? 999 : index} // Ensure current is always on top
            >
              <View style={styles.markerWrapper}>
                {/* Animated Pulse Halo for Current Stop */}
                {isCurrent && (
                  <Animated.View
                    style={[
                      styles.pulseHalo,
                      {
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseAnim.interpolate({
                          inputRange: [1, 1.4],
                          outputRange: [0.6, 0],
                        }),
                      },
                    ]}
                  />
                )}
                
                {/* The Marker Bubble */}
                <View
                  style={[
                    styles.markerBubble,
                    { backgroundColor },
                    isCurrent && styles.markerBubbleCurrent,
                  ]}
                >
                  {isVisited ? (
                    <Ionicons name="checkmark" size={14} color="white" />
                  ) : (
                    <Text style={styles.markerText}>{index + 1}</Text>
                  )}
                </View>
              </View>
            </Marker>
          );
        })}
        
        {/* Trigger Radius Circle (Static) */}
        {tour.stops[currentStopIndex] && (
           <Marker
             coordinate={{
               latitude: tour.stops[currentStopIndex].latitude,
               longitude: tour.stops[currentStopIndex].longitude,
             }}
             anchor={{ x: 0.5, y: 0.5 }}
             zIndex={1}
           >
             <View style={styles.radiusCircle} />
           </Marker>
         )}
      </MapView>

      {!followUser && currentLocation && (
        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
          <Ionicons name="locate" size={24} color="#0891b2" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  recenterButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  markerWrapper: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseHalo: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(8, 145, 178, 0.4)',
  },
  markerBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  markerBubbleCurrent: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
  },
  markerText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  radiusCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.3)',
  },
});
