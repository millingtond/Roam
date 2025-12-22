import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TourStop, AudioState } from '../types';
import { formatTime, formatRemainingTime } from '../hooks';

interface AudioPlayerBarProps {
  currentStop: TourStop | null;
  stopNumber: number;
  audioState: AudioState;
  basePath: string;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSpeedChange: () => void;
  onSeek: (position: number) => void;
  onShowScript: () => void;
}

export function AudioPlayerBar({
  currentStop,
  stopNumber,
  audioState,
  basePath,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onSpeedChange,
  onSeek,
  onShowScript,
}: AudioPlayerBarProps) {
  if (!currentStop) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No stop selected</Text>
        </View>
      </View>
    );
  }

  const isLoading = !audioState.isLoaded && audioState.duration === 0;

  const progressPercent = audioState.duration > 0
    ? (audioState.position / audioState.duration) * 100
    : 0;

  const imageUri = currentStop.imageFile
    ? basePath + currentStop.imageFile
    : null;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
              <Ionicons name="image-outline" size={24} color="#999" />
            </View>
          )}
        </View>

        {/* Stop info and controls */}
        <View style={styles.mainSection}>
          {/* Stop name */}
          <Text style={styles.stopName} numberOfLines={1}>
            {stopNumber}. {currentStop.name}
          </Text>

          {/* Time display */}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(audioState.position)}</Text>
            <View style={styles.progressBarWrapper}>
              <View
                style={styles.progressBarBackground}
                onTouchEnd={(e) => {
                  const touchX = e.nativeEvent.locationX;
                  const barWidth = e.nativeEvent.target
                    ? (e.nativeEvent as any).layout?.width || 150
                    : 150;
                  // Calculate position based on touch
                  const percent = Math.max(0, Math.min(1, touchX / barWidth));
                  onSeek(percent * audioState.duration);
                }}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
                <View
                  style={[
                    styles.progressBarThumb,
                    { left: `${progressPercent}%` },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.timeText}>
              {formatRemainingTime(audioState.position, audioState.duration)}
            </Text>
          </View>
        </View>
      </View>

      {/* Playback controls */}
      <View style={styles.controls}>
        {/* Speed button */}
        <TouchableOpacity style={styles.speedButton} onPress={onSpeedChange}>
          <Text style={styles.speedText}>{audioState.playbackSpeed}x</Text>
          <Text style={styles.speedLabel}>Speed</Text>
        </TouchableOpacity>

        {/* Skip back */}
        <TouchableOpacity style={styles.skipButton} onPress={onSkipBack}>
          <View style={styles.skipButtonInner}>
            <Ionicons name="play-back" size={16} color="#333" />
            <Text style={styles.skipText}>15</Text>
          </View>
        </TouchableOpacity>

        {/* Play/Pause */}
        <TouchableOpacity
          style={[styles.playButton, isLoading && styles.playButtonLoading]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPlayPause();
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons
              name={audioState.isPlaying ? 'pause' : 'play'}
              size={32}
              color="white"
            />
          )}
        </TouchableOpacity>

        {/* Skip forward */}
        <TouchableOpacity style={styles.skipButton} onPress={onSkipForward}>
          <View style={styles.skipButtonInner}>
            <Text style={styles.skipText}>15</Text>
            <Ionicons name="play-forward" size={16} color="#333" />
          </View>
        </TouchableOpacity>

        {/* Restart button */}
        <TouchableOpacity
          style={styles.restartButton}
          onPress={() => onSeek(0)}
        >
          <Ionicons name="refresh-outline" size={20} color="#333" />
        </TouchableOpacity>

        {/* Script button */}
        <TouchableOpacity style={styles.scriptButton} onPress={onShowScript}>
          <Ionicons name="document-text-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20,
  },
  progressContainer: {
    height: 3,
    backgroundColor: '#e0e0e0',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0891b2',
  },
  content: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  thumbnailContainer: {
    marginRight: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderThumbnail: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainSection: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    width: 45,
  },
  progressBarWrapper: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'visible',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0891b2',
    borderRadius: 3,
  },
  progressBarThumb: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0891b2',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  speedButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  speedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  speedLabel: {
    fontSize: 10,
    color: '#666',
  },
  skipButton: {
    padding: 12,
  },
  skipButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  playButtonLoading: {
    opacity: 0.7,
  },
  restartButton: {
    padding: 8,
  },
  scriptButton: {
    padding: 12,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});
