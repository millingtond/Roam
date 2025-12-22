import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tour } from '../types';
import { StarRatingDisplay } from './TourRatingModal';
import { NoteIndicator } from './TourNotesModal';
import { OfflineStatusBadge } from './OfflineManager';

interface TourCardProps {
  tour: Tour;
  isFavorite: boolean;
  rating?: number;
  noteCount: number;
  progressPercentage: number;
  isOfflineReady: boolean;
  onPress: () => void;
  onFavoriteToggle: () => void;
  onOptionsPress: () => void;
}

export function TourCard({
  tour,
  isFavorite,
  rating,
  noteCount,
  progressPercentage,
  isOfflineReady,
  onPress,
  onFavoriteToggle,
  onOptionsPress,
}: TourCardProps) {
  const hasProgress = progressPercentage > 0 && progressPercentage < 100;
  const isComplete = progressPercentage === 100;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Tour Image */}
      <View style={styles.imageContainer}>
        {tour.coverImage ? (
          <Image source={{ uri: tour.coverImage }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="map-outline" size={40} color="#9ca3af" />
          </View>
        )}
        
        {/* Favorite Button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onFavoriteToggle}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? '#ef4444' : 'white'}
          />
        </TouchableOpacity>

        {/* Progress Overlay */}
        {hasProgress && (
          <View style={styles.progressOverlay}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>{progressPercentage}%</Text>
            </View>
          </View>
        )}

        {/* Complete Badge */}
        {isComplete && (
          <View style={styles.completeBadge}>
            <Ionicons name="checkmark-circle" size={16} color="white" />
            <Text style={styles.completeBadgeText}>Completed</Text>
          </View>
        )}
      </View>

      {/* Tour Info */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{tour.name}</Text>
          <TouchableOpacity onPress={onOptionsPress} style={styles.optionsButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {tour.description && (
          <Text style={styles.description} numberOfLines={2}>
            {tour.description}
          </Text>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.statText}>{tour.stops.length} stops</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="walk-outline" size={14} color="#6b7280" />
            <Text style={styles.statText}>
              {tour.totalDistance?.toFixed(1) || '?'} km
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={14} color="#6b7280" />
            <Text style={styles.statText}>{tour.estimatedDuration} min</Text>
          </View>
        </View>

        {/* Bottom Row - Rating, Notes, Offline Status */}
        <View style={styles.bottomRow}>
          <View style={styles.indicators}>
            {rating && rating > 0 && (
              <StarRatingDisplay rating={rating} size={12} showNumber={false} />
            )}
            <NoteIndicator noteCount={noteCount} />
          </View>
          <OfflineStatusBadge isOffline={isOfflineReady} />
        </View>

        {/* Progress Bar */}
        {hasProgress && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progressPercentage}%` }]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {Math.round((progressPercentage / 100) * tour.stops.length)} of {tour.stops.length} stops
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Compact card for horizontal scrolling lists
interface TourCardCompactProps {
  tour: Tour;
  progressPercentage: number;
  onPress: () => void;
}

export function TourCardCompact({
  tour,
  progressPercentage,
  onPress,
}: TourCardCompactProps) {
  return (
    <TouchableOpacity style={compactStyles.card} onPress={onPress}>
      <View style={compactStyles.imageContainer}>
        {tour.coverImage ? (
          <Image source={{ uri: tour.coverImage }} style={compactStyles.image} />
        ) : (
          <View style={compactStyles.imagePlaceholder}>
            <Ionicons name="map-outline" size={24} color="#9ca3af" />
          </View>
        )}
        {progressPercentage > 0 && progressPercentage < 100 && (
          <View style={compactStyles.progressBadge}>
            <Text style={compactStyles.progressText}>{progressPercentage}%</Text>
          </View>
        )}
      </View>
      <Text style={compactStyles.title} numberOfLines={1}>{tour.name}</Text>
      <Text style={compactStyles.subtitle}>
        {tour.stops.length} stops • {tour.estimatedDuration} min
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 160,
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(8, 145, 178, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  completeBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  completeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  optionsButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#6b7280',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicators: {
    flexDirection: 'row',
    gap: 8,
  },
  progressBarContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0891b2',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});

const compactStyles = StyleSheet.create({
  card: {
    width: 160,
    marginRight: 12,
  },
  imageContainer: {
    height: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(8, 145, 178, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  progressText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
});
