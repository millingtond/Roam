import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NavigationControlsProps {
  isManualMode: boolean;
  onToggleMode: (manual: boolean) => void;
  onPreviousStop: () => void;
  onNextStop: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  currentStopNumber: number;
  totalStops: number;
  gpsAccuracy: number | null;
  isGpsAvailable: boolean;
}

export function NavigationControls({
  isManualMode,
  onToggleMode,
  onPreviousStop,
  onNextStop,
  canGoPrevious,
  canGoNext,
  currentStopNumber,
  totalStops,
  gpsAccuracy,
  isGpsAvailable,
}: NavigationControlsProps) {
  const getGpsStatusColor = () => {
    if (!isGpsAvailable) return '#ef4444'; // Red - no GPS
    if (gpsAccuracy === null) return '#f59e0b'; // Amber - waiting
    if (gpsAccuracy <= 10) return '#22c55e'; // Green - excellent
    if (gpsAccuracy <= 30) return '#84cc16'; // Light green - good
    if (gpsAccuracy <= 50) return '#f59e0b'; // Amber - fair
    return '#ef4444'; // Red - poor
  };

  const getGpsStatusText = () => {
    if (!isGpsAvailable) return 'GPS unavailable';
    if (gpsAccuracy === null) return 'Locating...';
    if (gpsAccuracy <= 10) return `±${Math.round(gpsAccuracy)}m (Excellent)`;
    if (gpsAccuracy <= 30) return `±${Math.round(gpsAccuracy)}m (Good)`;
    if (gpsAccuracy <= 50) return `±${Math.round(gpsAccuracy)}m (Fair)`;
    return `±${Math.round(gpsAccuracy)}m (Poor)`;
  };

  return (
    <View style={styles.container}>
      {/* GPS Status & Mode Toggle */}
      <View style={styles.topRow}>
        <View style={styles.gpsStatus}>
          <View style={[styles.gpsIndicator, { backgroundColor: getGpsStatusColor() }]} />
          <Text style={styles.gpsText}>{getGpsStatusText()}</Text>
        </View>

        <View style={styles.modeToggle}>
          <Text style={styles.modeLabel}>
            {isManualMode ? 'Manual' : 'Auto GPS'}
          </Text>
          <Switch
            value={isManualMode}
            onValueChange={onToggleMode}
            trackColor={{ false: '#0891b2', true: '#f59e0b' }}
            thumbColor="white"
          />
        </View>
      </View>

      {/* Manual Navigation Buttons */}
      {isManualMode && (
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navButton, !canGoPrevious && styles.navButtonDisabled]}
            onPress={onPreviousStop}
            disabled={!canGoPrevious}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={canGoPrevious ? '#333' : '#ccc'}
            />
            <Text style={[styles.navButtonText, !canGoPrevious && styles.navButtonTextDisabled]}>
              Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.stopIndicator}>
            <Text style={styles.stopNumber}>{currentStopNumber}</Text>
            <Text style={styles.stopTotal}>of {totalStops}</Text>
          </View>

          <TouchableOpacity
            style={[styles.navButton, styles.navButtonNext, !canGoNext && styles.navButtonDisabled]}
            onPress={onNextStop}
            disabled={!canGoNext}
          >
            <Text style={[styles.navButtonText, styles.navButtonTextNext, !canGoNext && styles.navButtonTextDisabled]}>
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={canGoNext ? 'white' : '#ccc'}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Auto mode hint */}
      {!isManualMode && (
        <View style={styles.autoModeHint}>
          <Ionicons name="navigate" size={16} color="#0891b2" />
          <Text style={styles.autoModeText}>
            Audio will play automatically when you reach each stop
          </Text>
        </View>
      )}
    </View>
  );
}

// Simplified version for poor GPS / indoor use
interface ManualModeBarProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  stopName: string;
  stopNumber: number;
  totalStops: number;
}

export function ManualModeBar({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  stopName,
  stopNumber,
  totalStops,
}: ManualModeBarProps) {
  return (
    <View style={styles.manualBar}>
      <TouchableOpacity
        style={[styles.manualNavBtn, !canGoPrevious && styles.manualNavBtnDisabled]}
        onPress={onPrevious}
        disabled={!canGoPrevious}
      >
        <Ionicons name="play-back" size={20} color={canGoPrevious ? '#333' : '#ccc'} />
      </TouchableOpacity>

      <View style={styles.manualBarCenter}>
        <Text style={styles.manualBarStop}>
          Stop {stopNumber} of {totalStops}
        </Text>
        <Text style={styles.manualBarName} numberOfLines={1}>
          {stopName}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.manualNavBtn, styles.manualNavBtnNext, !canGoNext && styles.manualNavBtnDisabled]}
        onPress={onNext}
        disabled={!canGoNext}
      >
        <Ionicons name="play-forward" size={20} color={canGoNext ? 'white' : '#ccc'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  gpsText: {
    fontSize: 13,
    color: '#666',
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
    color: '#333',
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  navButtonNext: {
    backgroundColor: '#0891b2',
  },
  navButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  navButtonTextNext: {
    color: 'white',
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
  stopIndicator: {
    alignItems: 'center',
  },
  stopNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0891b2',
  },
  stopTotal: {
    fontSize: 12,
    color: '#888',
  },
  autoModeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
  },
  autoModeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },

  // Manual Mode Bar styles
  manualBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  manualNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualNavBtnNext: {
    backgroundColor: '#0891b2',
  },
  manualNavBtnDisabled: {
    backgroundColor: '#f0f0f0',
  },
  manualBarCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  manualBarStop: {
    fontSize: 12,
    color: '#888',
  },
  manualBarName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
