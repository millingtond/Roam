import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { Tour } from '../types/tour';
import { StarRatingDisplay } from '../components/TourRatingModal';
import { useFavorites, useTourRatings, useTourProgressData } from '../hooks/useTourUserData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TourDetailScreenProps {
  route: { params: { tour: Tour } };
  navigation: any;
}

export function TourDetailScreen({ route, navigation }: TourDetailScreenProps) {
  const { tour } = route.params;
  const insets = useSafeAreaInsets();
  
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getRating } = useTourRatings();
  const { getProgress, getProgressPercentage } = useTourProgressData();
  
  const rating = getRating(tour.id);
  const progress = getProgress(tour.id);
  const progressPercentage = getProgressPercentage(tour.id);
  
  const hasProgress = progressPercentage > 0 && progressPercentage < 100;

  // Calculate map region to fit all stops
  const getMapRegion = () => {
    if (tour.stops.length === 0) {
      return {
        latitude: tour.startPoint.latitude,
        longitude: tour.startPoint.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    tour.stops.forEach(stop => {
      minLat = Math.min(minLat, stop.latitude);
      maxLat = Math.max(maxLat, stop.latitude);
      minLng = Math.min(minLng, stop.longitude);
      maxLng = Math.max(maxLng, stop.longitude);
    });

    const padding = 0.002;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) + padding,
      longitudeDelta: (maxLng - minLng) + padding,
    };
  };

  const handleStartTour = () => {
    navigation.navigate('Tour', { tour });
  };

  const handleResumeTour = () => {
    navigation.navigate('Tour', { 
      tour, 
      resumeFromStop: progress?.currentStopIndex || 0 
    });
  };

  const handleFavoritePress = () => {
    toggleFavorite(tour.id);
  };

  const routeCoordinates = tour.stops.map(stop => ({
    latitude: stop.latitude,
    longitude: stop.longitude,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleFavoritePress}>
            <Ionicons
              name={isFavorite(tour.id) ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite(tour.id) ? '#ef4444' : '#111827'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image / Map Preview */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={getMapRegion()}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {tour.stops.map((stop, index) => (
              <Marker
                key={stop.id}
                coordinate={{
                  latitude: stop.latitude,
                  longitude: stop.longitude,
                }}
                title={stop.name}
              >
                <View style={styles.markerContainer}>
                  <View style={styles.marker}>
                    <Text style={styles.markerText}>{index + 1}</Text>
                  </View>
                </View>
              </Marker>
            ))}
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#0891b2"
              strokeWidth={3}
            />
          </MapView>
        </View>

        {/* Tour Info */}
        <View style={styles.content}>
          <Text style={styles.title}>{tour.name}</Text>
          
          {rating && (
            <View style={styles.ratingRow}>
              <StarRatingDisplay rating={rating.rating} size={16} />
              {rating.review && (
                <Text style={styles.reviewText}>"{rating.review}"</Text>
              )}
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="location" size={20} color="#0891b2" />
              <Text style={styles.statValue}>{tour.stops.length}</Text>
              <Text style={styles.statLabel}>stops</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="walk" size={20} color="#0891b2" />
              <Text style={styles.statValue}>{tour.totalDistance?.toFixed(1) || '?'}</Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="time" size={20} color="#0891b2" />
              <Text style={styles.statValue}>{tour.estimatedDuration}</Text>
              <Text style={styles.statLabel}>min</Text>
            </View>
          </View>

          {/* Description */}
          {tour.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this tour</Text>
              <Text style={styles.description}>{tour.description}</Text>
            </View>
          )}

          {/* Difficulty & Accessibility */}
          {(tour.difficulty || tour.accessibility) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Accessibility</Text>
              <View style={styles.tagsRow}>
                {tour.difficulty && (
                  <View style={styles.tag}>
                    <Ionicons 
                      name={
                        tour.difficulty === 'easy' ? 'walk' :
                        tour.difficulty === 'moderate' ? 'trending-up' : 'flame'
                      } 
                      size={14} 
                      color="#6b7280" 
                    />
                    <Text style={styles.tagText}>
                      {tour.difficulty.charAt(0).toUpperCase() + tour.difficulty.slice(1)}
                    </Text>
                  </View>
                )}
                {tour.accessibility?.wheelchairAccessible && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>♿ Wheelchair OK</Text>
                  </View>
                )}
                {tour.accessibility?.strollerFriendly && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>🍼 Stroller OK</Text>
                  </View>
                )}
                {tour.accessibility?.hasStairs && (
                  <View style={[styles.tag, styles.tagWarning]}>
                    <Text style={styles.tagText}>⚠️ Has Stairs</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Starting Point */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Starting Point</Text>
            <View style={styles.startingPoint}>
              <Ionicons name="flag" size={20} color="#22c55e" />
              <View style={styles.startingPointText}>
                <Text style={styles.startingPointAddress}>
                  {tour.startPoint.address || 'See map for location'}
                </Text>
                {tour.startPoint.instructions && (
                  <Text style={styles.startingPointInstructions}>
                    {tour.startPoint.instructions}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Stops Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stops</Text>
            {tour.stops.slice(0, 5).map((stop, index) => (
              <View key={stop.id} style={styles.stopPreview}>
                <View style={styles.stopNumber}>
                  <Text style={styles.stopNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{stop.name}</Text>
                  {stop.estimatedDuration && (
                    <Text style={styles.stopDuration}>
                      ~{Math.ceil(stop.estimatedDuration / 60)} min
                    </Text>
                  )}
                </View>
                {progress?.completedStopIds.includes(stop.id) && (
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                )}
              </View>
            ))}
            {tour.stops.length > 5 && (
              <Text style={styles.moreStops}>
                +{tour.stops.length - 5} more stops
              </Text>
            )}
          </View>

          {/* Tips */}
          {tour.tips && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tips</Text>
              <View style={styles.tipsBox}>
                <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
                <Text style={styles.tipsText}>{tour.tips}</Text>
              </View>
            </View>
          )}

          {/* Spacer for button */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Start/Resume Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {hasProgress ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.startFreshButton}
              onPress={handleStartTour}
            >
              <Text style={styles.startFreshButtonText}>Start Fresh</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.resumeButton}
              onPress={handleResumeTour}
            >
              <Ionicons name="play" size={20} color="white" />
              <Text style={styles.resumeButtonText}>
                Resume ({progressPercentage}%)
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartTour}
          >
            <Ionicons name="walk" size={22} color="white" />
            <Text style={styles.startButtonText}>Start Tour</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  markerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  ratingRow: {
    marginBottom: 16,
  },
  reviewText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagWarning: {
    backgroundColor: '#fef3c7',
  },
  tagText: {
    fontSize: 13,
    color: '#374151',
  },
  startingPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  startingPointText: {
    flex: 1,
  },
  startingPointAddress: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  startingPointInstructions: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  stopPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  stopNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  stopDuration: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  moreStops: {
    fontSize: 14,
    color: '#0891b2',
    fontWeight: '500',
    marginTop: 12,
  },
  tipsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipsText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  startFreshButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  startFreshButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  resumeButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  resumeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
});
