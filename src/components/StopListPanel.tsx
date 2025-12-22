import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TourStop } from '../types';

interface StopListPanelProps {
  stops: TourStop[];
  currentStopIndex: number;
  visitedStops: Set<number>;
  onSelectStop: (index: number) => void;
  onViewPhoto: (stop: TourStop) => void;
  onFocusMap: (stop: TourStop) => void;
}

export function StopListPanel({
  stops,
  currentStopIndex,
  visitedStops,
  onSelectStop,
  onViewPhoto,
  onFocusMap,
}: StopListPanelProps) {
  const [contextMenuStop, setContextMenuStop] = React.useState<{
    stop: TourStop;
    index: number;
  } | null>(null);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {stops.map((stop, index) => {
          const isPlaying = index === currentStopIndex;
          const isVisited = visitedStops.has(stop.id);
          const isFuture = !isVisited && !isPlaying;

          return (
            <TouchableOpacity
              key={stop.id}
              style={[
                styles.stopItem,
                isPlaying && styles.playingItem,
              ]}
              onPress={() => onSelectStop(index)}
              onLongPress={() => setContextMenuStop({ stop, index })}
            >
              <View style={styles.stopContent}>
                <Text
                  style={[
                    styles.stopName,
                    isPlaying && styles.playingText,
                    isVisited && styles.visitedText,
                  ]}
                >
                  {stop.name}
                </Text>
                {stop.nameTranslated && (
                  <Text style={styles.translatedName}>
                    {stop.nameTranslated}
                  </Text>
                )}
              </View>

              <View style={styles.stopIndicator}>
                {isPlaying ? (
                  <View style={styles.playingIndicator}>
                    <Ionicons name="pause" size={16} color="white" />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.numberBadge,
                      isVisited && styles.visitedBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.numberText,
                        isVisited && styles.visitedNumberText,
                      ]}
                    >
                      {stop.id}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Context Menu Modal */}
      <Modal
        visible={contextMenuStop !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setContextMenuStop(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setContextMenuStop(null)}
        >
          <View style={styles.contextMenu}>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => {
                if (contextMenuStop) {
                  onViewPhoto(contextMenuStop.stop);
                }
                setContextMenuStop(null);
              }}
            >
              <Ionicons name="image-outline" size={20} color="#333" />
              <Text style={styles.contextMenuText}>View Photo</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => {
                if (contextMenuStop) {
                  onFocusMap(contextMenuStop.stop);
                }
                setContextMenuStop(null);
              }}
            >
              <Ionicons name="locate-outline" size={20} color="#333" />
              <Text style={styles.contextMenuText}>Focus Map</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Compact version for collapsible panel
interface UpNextPanelProps {
  currentStop: TourStop | null;
  nextStop: TourStop | null;
  distanceToNext: number | null;
  onExpand: () => void;
  isExpanded: boolean;
}

export function UpNextPanel({
  currentStop,
  nextStop,
  distanceToNext,
  onExpand,
  isExpanded,
}: UpNextPanelProps) {
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <TouchableOpacity style={styles.upNextContainer} onPress={onExpand}>
      <View style={styles.upNextHeader}>
        <Text style={styles.upNextLabel}>Up Next</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
        />
      </View>

      <View style={styles.upNextContent}>
        <View style={styles.distanceBadge}>
          <Ionicons name="walk-outline" size={16} color="#0891b2" />
          <Text style={styles.distanceText}>
            {distanceToNext ? formatDistance(distanceToNext) : '--'}
          </Text>
        </View>

        <Text style={styles.nextStopName} numberOfLines={1}>
          {nextStop?.name || currentStop?.name || 'Start Tour'}
        </Text>

        <View style={styles.stopNumberBadge}>
          <Text style={styles.stopNumberText}>
            {nextStop?.id || currentStop?.id || 1}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playingItem: {
    backgroundColor: '#f0f9ff',
  },
  stopContent: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    color: '#333',
  },
  playingText: {
    fontWeight: '600',
    color: '#0891b2',
  },
  visitedText: {
    color: '#999',
  },
  translatedName: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  stopIndicator: {
    marginLeft: 12,
  },
  playingIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitedBadge: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  numberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  visitedNumberText: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenu: {
    backgroundColor: 'white',
    borderRadius: 12,
    minWidth: 200,
    overflow: 'hidden',
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contextMenuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },

  // Up Next Panel styles
  upNextContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  upNextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  upNextLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  upNextContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891b2',
    marginLeft: 4,
  },
  nextStopName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  stopNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  stopNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
});
