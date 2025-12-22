import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { Tour } from '../types';

const OFFLINE_DIR = FileSystem.documentDirectory + 'offline/';
const MAP_TILES_DIR = OFFLINE_DIR + 'map-tiles/';

interface DownloadProgress {
  downloaded: number;
  total: number;
  currentFile: string;
  stage: 'audio' | 'images' | 'maps' | 'complete';
}

interface OfflineManagerProps {
  visible: boolean;
  tour: Tour;
  basePath: string;
  onClose: () => void;
  onDownloadComplete: () => void;
}

export function OfflineManager({
  visible,
  tour,
  basePath,
  onClose,
  onDownloadComplete,
}: OfflineManagerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<{
    audio: boolean;
    images: boolean;
    maps: boolean;
  }>({ audio: false, images: false, maps: false });

  useEffect(() => {
    if (visible) {
      checkOfflineStatus();
    }
  }, [visible]);

  const checkOfflineStatus = async () => {
    const tourOfflineDir = OFFLINE_DIR + tour.id + '/';
    
    try {
      // Check if audio files exist
      const audioDir = tourOfflineDir + 'audio/';
      const audioInfo = await FileSystem.getInfoAsync(audioDir);
      
      // Check if images exist
      const imagesDir = tourOfflineDir + 'images/';
      const imagesInfo = await FileSystem.getInfoAsync(imagesDir);
      
      // Check if map tiles exist
      const mapsDir = MAP_TILES_DIR + tour.id + '/';
      const mapsInfo = await FileSystem.getInfoAsync(mapsDir);

      setOfflineStatus({
        audio: audioInfo.exists,
        images: imagesInfo.exists,
        maps: mapsInfo.exists,
      });
    } catch (error) {
      console.error('Error checking offline status:', error);
    }
  };

  const downloadTour = async () => {
    setIsDownloading(true);
    const tourOfflineDir = OFFLINE_DIR + tour.id + '/';

    try {
      // Ensure directories exist
      await FileSystem.makeDirectoryAsync(tourOfflineDir + 'audio/', { intermediates: true });
      await FileSystem.makeDirectoryAsync(tourOfflineDir + 'images/', { intermediates: true });
      await FileSystem.makeDirectoryAsync(MAP_TILES_DIR + tour.id + '/', { intermediates: true });

      // 1. Download/copy audio files
      setProgress({ downloaded: 0, total: tour.stops.length, currentFile: 'Preparing audio...', stage: 'audio' });
      
      for (let i = 0; i < tour.stops.length; i++) {
        const stop = tour.stops[i];
        const sourceAudio = basePath + stop.audioFile;
        const destAudio = tourOfflineDir + stop.audioFile;

        setProgress({
          downloaded: i,
          total: tour.stops.length,
          currentFile: `Audio: ${stop.name}`,
          stage: 'audio',
        });

        // Copy from app bundle to offline storage
        const sourceInfo = await FileSystem.getInfoAsync(sourceAudio);
        if (sourceInfo.exists) {
          await FileSystem.copyAsync({ from: sourceAudio, to: destAudio });
        }
      }

      // 2. Download/copy images
      setProgress({ downloaded: 0, total: tour.stops.length, currentFile: 'Preparing images...', stage: 'images' });
      
      for (let i = 0; i < tour.stops.length; i++) {
        const stop = tour.stops[i];
        if (!stop.imageFile) continue;

        const sourceImage = basePath + stop.imageFile;
        const destImage = tourOfflineDir + stop.imageFile;

        setProgress({
          downloaded: i,
          total: tour.stops.length,
          currentFile: `Image: ${stop.name}`,
          stage: 'images',
        });

        const sourceInfo = await FileSystem.getInfoAsync(sourceImage);
        if (sourceInfo.exists) {
          await FileSystem.copyAsync({ from: sourceImage, to: destImage });
        }
      }

      // 3. Download map tiles for the tour area
      setProgress({ downloaded: 0, total: 100, currentFile: 'Downloading map tiles...', stage: 'maps' });
      await downloadMapTiles(tour);

      // Complete
      setProgress({ downloaded: 100, total: 100, currentFile: 'Complete!', stage: 'complete' });
      
      await checkOfflineStatus();
      onDownloadComplete();

      setTimeout(() => {
        setIsDownloading(false);
        setProgress(null);
      }, 1500);

    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'There was an error downloading the tour for offline use.');
      setIsDownloading(false);
      setProgress(null);
    }
  };

  const downloadMapTiles = async (tour: Tour) => {
    // Calculate bounding box from all stops
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    tour.stops.forEach(stop => {
      minLat = Math.min(minLat, stop.latitude);
      maxLat = Math.max(maxLat, stop.latitude);
      minLng = Math.min(minLng, stop.longitude);
      maxLng = Math.max(maxLng, stop.longitude);
    });

    // Add padding
    const padding = 0.005; // ~500m
    minLat -= padding;
    maxLat += padding;
    minLng -= padding;
    maxLng += padding;

    // Download tiles for zoom levels 14-17 (street level)
    const zoomLevels = [14, 15, 16, 17];
    const tileDir = MAP_TILES_DIR + tour.id + '/';
    
    let totalTiles = 0;
    let downloadedTiles = 0;

    // Calculate total tiles needed
    for (const zoom of zoomLevels) {
      const tiles = getTilesForBounds(minLat, minLng, maxLat, maxLng, zoom);
      totalTiles += tiles.length;
    }

    // Download tiles
    for (const zoom of zoomLevels) {
      const tiles = getTilesForBounds(minLat, minLng, maxLat, maxLng, zoom);
      
      for (const tile of tiles) {
        try {
          const url = `https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`;
          const tilePath = `${tileDir}${zoom}/${tile.x}/${tile.y}.png`;
          
          // Create directory
          const tileSubDir = `${tileDir}${zoom}/${tile.x}/`;
          await FileSystem.makeDirectoryAsync(tileSubDir, { intermediates: true });

          // Download tile
          await FileSystem.downloadAsync(url, tilePath, {
            headers: {
              'User-Agent': 'AudioTourApp/1.0',
            },
          });

          downloadedTiles++;
          setProgress({
            downloaded: Math.round((downloadedTiles / totalTiles) * 100),
            total: 100,
            currentFile: `Map tiles: ${downloadedTiles}/${totalTiles}`,
            stage: 'maps',
          });

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.warn('Failed to download tile:', tile, error);
        }
      }
    }
  };

  const getTilesForBounds = (
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
    zoom: number
  ): Array<{ x: number; y: number }> => {
    const tiles: Array<{ x: number; y: number }> = [];
    
    const minTileX = lng2tile(minLng, zoom);
    const maxTileX = lng2tile(maxLng, zoom);
    const minTileY = lat2tile(maxLat, zoom); // Note: Y is inverted
    const maxTileY = lat2tile(minLat, zoom);

    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        tiles.push({ x, y });
      }
    }

    return tiles;
  };

  const lng2tile = (lng: number, zoom: number): number => {
    return Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  };

  const lat2tile = (lat: number, zoom: number): number => {
    return Math.floor(
      (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)
    );
  };

  const deleteOfflineData = async () => {
    Alert.alert(
      'Delete Offline Data',
      'Are you sure you want to delete the offline data for this tour?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FileSystem.deleteAsync(OFFLINE_DIR + tour.id, { idempotent: true });
              await FileSystem.deleteAsync(MAP_TILES_DIR + tour.id, { idempotent: true });
              await checkOfflineStatus();
            } catch (error) {
              console.error('Error deleting offline data:', error);
            }
          },
        },
      ]
    );
  };

  const isFullyOffline = offlineStatus.audio && offlineStatus.images && offlineStatus.maps;

  const getStorageSize = async (): Promise<string> => {
    // Estimate: ~1MB per stop for audio, ~100KB for images, ~2MB for maps
    const estimatedMB = tour.stops.length * 1.1 + 2;
    return `~${Math.round(estimatedMB)}MB`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Offline Mode</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons
                name={isFullyOffline ? 'checkmark-circle' : 'cloud-offline-outline'}
                size={32}
                color={isFullyOffline ? '#22c55e' : '#f59e0b'}
              />
              <View style={styles.statusText}>
                <Text style={styles.statusTitle}>
                  {isFullyOffline ? 'Ready for Offline Use' : 'Download Required'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {isFullyOffline
                    ? 'This tour will work without internet'
                    : 'Download content to use without internet'}
                </Text>
              </View>
            </View>
          </View>

          {/* Content checklist */}
          <View style={styles.checklist}>
            <Text style={styles.checklistTitle}>Content Status</Text>

            <View style={styles.checkItem}>
              <Ionicons
                name={offlineStatus.audio ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={offlineStatus.audio ? '#22c55e' : '#ccc'}
              />
              <Text style={styles.checkItemText}>Audio narrations</Text>
              <Text style={styles.checkItemCount}>{tour.stops.length} files</Text>
            </View>

            <View style={styles.checkItem}>
              <Ionicons
                name={offlineStatus.images ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={offlineStatus.images ? '#22c55e' : '#ccc'}
              />
              <Text style={styles.checkItemText}>Stop images</Text>
              <Text style={styles.checkItemCount}>
                {tour.stops.filter(s => s.imageFile).length} files
              </Text>
            </View>

            <View style={styles.checkItem}>
              <Ionicons
                name={offlineStatus.maps ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={offlineStatus.maps ? '#22c55e' : '#ccc'}
              />
              <Text style={styles.checkItemText}>Map tiles</Text>
              <Text style={styles.checkItemCount}>Tour area</Text>
            </View>
          </View>

          {/* Download progress */}
          {isDownloading && progress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <ActivityIndicator size="small" color="#0891b2" />
                <Text style={styles.progressText}>{progress.currentFile}</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(progress.downloaded / progress.total) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressPercent}>
                {Math.round((progress.downloaded / progress.total) * 100)}%
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {!isFullyOffline && !isDownloading && (
              <TouchableOpacity style={styles.downloadButton} onPress={downloadTour}>
                <Ionicons name="cloud-download" size={20} color="white" />
                <Text style={styles.downloadButtonText}>Download for Offline Use</Text>
              </TouchableOpacity>
            )}

            {isFullyOffline && (
              <TouchableOpacity style={styles.deleteButton} onPress={deleteOfflineData}>
                <Ionicons name="trash-outline" size={20} color="#dc2626" />
                <Text style={styles.deleteButtonText}>Delete Offline Data</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {isFullyOffline
                ? 'You can now enable Airplane Mode. GPS will still work for location tracking.'
                : 'Download while connected to WiFi. Map tiles require approximately 2-5MB depending on tour size.'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  checklist: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkItemText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  checkItemCount: {
    fontSize: 13,
    color: '#888',
  },
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0891b2',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    textAlign: 'right',
  },
  actions: {
    marginBottom: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

// Offline status indicator badge
interface OfflineStatusBadgeProps {
  isOffline?: boolean;
}

export function OfflineStatusBadge({ isOffline = false }: OfflineStatusBadgeProps) {
  if (!isOffline) return null;
  
  return (
    <View style={offlineBadgeStyles.container}>
      <Ionicons name="cloud-offline-outline" size={14} color="#f59e0b" />
      <Text style={offlineBadgeStyles.text}>Offline</Text>
    </View>
  );
}

const offlineBadgeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
});
