import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LastPlayedTour } from '../hooks/useTourUserData';

interface ResumeTourBannerProps {
  lastPlayed: LastPlayedTour;
  onResume: () => void;
  onDismiss: () => void;
}

export function ResumeTourBanner({
  lastPlayed,
  onResume,
  onDismiss,
}: ResumeTourBannerProps) {
  const progressPercentage = Math.round(
    (lastPlayed.currentStopIndex / lastPlayed.totalStops) * 100
  );
  
  const timeAgo = getTimeAgo(lastPlayed.timestamp);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="play-circle" size={32} color="#0891b2" />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.label}>Continue where you left off</Text>
        <Text style={styles.tourName} numberOfLines={1}>{lastPlayed.tourName}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {lastPlayed.currentStopIndex}/{lastPlayed.totalStops} stops
          </Text>
        </View>
        <Text style={styles.timeAgo}>{timeAgo}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.resumeButton} onPress={onResume}>
          <Ionicons name="play" size={18} color="white" />
          <Text style={styles.resumeButtonText}>Resume</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Ionicons name="close" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Minimal version for smaller spaces
interface ResumeTourMiniBannerProps {
  tourName: string;
  currentStop: number;
  totalStops: number;
  onPress: () => void;
}

export function ResumeTourMiniBanner({
  tourName,
  currentStop,
  totalStops,
  onPress,
}: ResumeTourMiniBannerProps) {
  return (
    <TouchableOpacity style={miniStyles.container} onPress={onPress}>
      <View style={miniStyles.playIcon}>
        <Ionicons name="play" size={14} color="white" />
      </View>
      <View style={miniStyles.content}>
        <Text style={miniStyles.title} numberOfLines={1}>Resume: {tourName}</Text>
        <Text style={miniStyles.progress}>
          Stop {currentStop} of {totalStops}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#0891b2" />
    </TouchableOpacity>
  );
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  iconContainer: {
    marginRight: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#0891b2',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tourName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0891b2',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 11,
    color: '#9ca3af',
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    marginLeft: 12,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0891b2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  resumeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  dismissButton: {
    padding: 4,
  },
});

const miniStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  playIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0891b2',
  },
  progress: {
    fontSize: 12,
    color: '#6b7280',
  },
});
