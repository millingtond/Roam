import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Tour } from '../types';
import { listTours, loadTour, ensureToursDirectory, getTourStats } from '../services';
import { OfflineStatusBadge } from '../components';
import { seedSampleTour } from '../services/seedData';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

interface TourListItem {
  id: string;
  name: string;
  path: string;
  tour?: Tour;
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [tours, setTours] = useState<TourListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTours = useCallback(async () => {
    try {
      await ensureToursDirectory();
      const tourList = await listTours();
      
      // Load full tour data for each tour (for stats display)
      const toursWithData: TourListItem[] = await Promise.all(
        tourList.map(async (item) => {
          const result = await loadTour(item.id);
          return {
            ...item,
            tour: result?.tour,
          };
        })
      );
      
      setTours(toursWithData);
    } catch (error) {
      console.error('Error loading tours:', error);
      Alert.alert('Error', 'Failed to load tours');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      console.log('🚀 Auto-running repair script...');
      await seedSampleTour();
      loadTours();
    };
    init();
  }, [loadTours]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTours();
  }, [loadTours]);

  const handleTourPress = (tourId: string) => {
    navigation.navigate('Tour', { tourId });
  };

  const renderTourItem = ({ item }: { item: TourListItem }) => {
    const stats = item.tour ? getTourStats(item.tour) : null;

    return (
      <TouchableOpacity
        style={styles.tourCard}
        onPress={() => handleTourPress(item.id)}
      >
        <View style={styles.tourImagePlaceholder}>
          <Ionicons name="map-outline" size={40} color="#0891b2" />
        </View>

        <View style={styles.tourInfo}>
          <Text style={styles.tourName}>{item.name}</Text>
          
          {item.tour && (
            <Text style={styles.tourDescription} numberOfLines={2}>
              {item.tour.description}
            </Text>
          )}

          {stats && (
            <View style={styles.tourStats}>
              <View style={styles.stat}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.statText}>{stats.totalStops} stops</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.statText}>{stats.estimatedDuration} min</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="walk-outline" size={14} color="#666" />
                <Text style={styles.statText}>{stats.totalDistance} km</Text>
              </View>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="map" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Tours Yet</Text>
      <TouchableOpacity
        style={{
          marginTop: 20,
          backgroundColor: '#f59e0b',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
        }}
        onPress={async () => {
          const success = await seedSampleTour();
          if (success) {
            Alert.alert('Success', 'Sample tour created! Pull down to refresh.');
            onRefresh();
          } else {
            Alert.alert('Error', 'Failed to create sample tour.');
          }
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          🛠️ Generate Debug Tour
        </Text>
      </TouchableOpacity>
      <Text style={styles.emptyText}>
        Add tour folders to your device's Documents/tours directory to get started.
      </Text>
      
      <View style={styles.instructionBox}>
        <Text style={styles.instructionTitle}>How to add tours:</Text>
        <Text style={styles.instructionText}>
          1. Create a folder with your tour ID{'\n'}
          2. Add a tour.json file with stop data{'\n'}
          3. Add audio/ folder with MP3 files{'\n'}
          4. Add images/ folder with photos{'\n'}
          5. Pull to refresh this screen
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Audio Tours</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        renderItem={renderTourItem}
        contentContainerStyle={tours.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0891b2']}
          />
        }
      />
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    padding: 16,
  },
  tourCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tourImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tourInfo: {
    flex: 1,
    marginLeft: 16,
  },
  tourName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tourDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tourStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructionBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
