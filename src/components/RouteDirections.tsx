import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { TourStop } from '../types';

interface RouteDirectionsProps {
  currentStop: TourStop | null;
  nextStop: TourStop | null;
  distanceToNext: number | null;
  isAudioPlaying: boolean; // Main tour audio
  autoPlayDirections: boolean;
}

export function RouteDirections({
  currentStop,
  nextStop,
  distanceToNext,
  isAudioPlaying,
  autoPlayDirections,
}: RouteDirectionsProps) {
  const [showDirections, setShowDirections] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];

  // Show directions panel when main audio finishes
  useEffect(() => {
    if (!isAudioPlaying && currentStop?.directionToNext && !hasSpoken) {
      setShowDirections(true);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      // Auto-speak directions if enabled
      if (autoPlayDirections) {
        speakDirections();
      }
    }
  }, [isAudioPlaying, currentStop, hasSpoken, autoPlayDirections]);

  // Reset when stop changes
  useEffect(() => {
    setHasSpoken(false);
    setShowDirections(false);
    slideAnim.setValue(0);
  }, [currentStop?.id]);

  const speakDirections = useCallback(async () => {
    if (!currentStop?.directionToNext) return;

    // Use device TTS or play pre-generated direction audio
    // For now, we'll just mark as spoken
    // In production, you'd use expo-speech or pre-generated audio
    setHasSpoken(true);
  }, [currentStop]);

  const dismissDirections = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowDirections(false));
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  if (!showDirections || !currentStop?.directionToNext) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ],
          opacity: slideAnim,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="navigate" size={20} color="white" />
        </View>
        <Text style={styles.headerText}>Directions to Next Stop</Text>
        <TouchableOpacity style={styles.closeButton} onPress={dismissDirections}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.directionText}>{currentStop.directionToNext}</Text>

        {distanceToNext && (
          <View style={styles.distanceRow}>
            <Ionicons name="walk-outline" size={18} color="#0891b2" />
            <Text style={styles.distanceText}>
              {formatDistance(distanceToNext)} to {nextStop?.name || 'next stop'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.speakButton} onPress={speakDirections}>
          <Ionicons name="volume-high" size={18} color="#0891b2" />
          <Text style={styles.speakButtonText}>Repeat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gotItButton} onPress={dismissDirections}>
          <Text style={styles.gotItText}>Got it</Text>
          <Ionicons name="checkmark" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Compact direction banner shown at top of map
interface DirectionBannerProps {
  direction: string | null;
  distance: number | null;
  nextStopName: string | null;
  visible: boolean;
}

export function DirectionBanner({
  direction,
  distance,
  nextStopName,
  visible,
}: DirectionBannerProps) {
  if (!visible || !direction) return null;

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Determine icon based on direction text
  const getDirectionIcon = (): string => {
    const lower = direction.toLowerCase();
    if (lower.includes('left')) return 'arrow-back';
    if (lower.includes('right')) return 'arrow-forward';
    if (lower.includes('back') || lower.includes('return')) return 'arrow-undo';
    if (lower.includes('cross')) return 'git-compare';
    return 'arrow-up'; // Default: straight ahead
  };

  return (
    <View style={bannerStyles.container}>
      <View style={bannerStyles.iconContainer}>
        <Ionicons name={getDirectionIcon() as any} size={24} color="white" />
      </View>
      <View style={bannerStyles.textContainer}>
        <Text style={bannerStyles.directionText} numberOfLines={2}>
          {direction}
        </Text>
        {distance && nextStopName && (
          <Text style={bannerStyles.distanceText}>
            {formatDistance(distance)} to {nextStopName}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  directionText: {
    fontSize: 17,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 14,
    color: '#0891b2',
    marginLeft: 6,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  speakButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    gap: 8,
  },
  speakButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0891b2',
  },
  gotItButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#0891b2',
    gap: 8,
  },
  gotItText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});

const bannerStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0891b2',
    padding: 12,
    paddingTop: 50, // Account for status bar
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  directionText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  distanceText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});
