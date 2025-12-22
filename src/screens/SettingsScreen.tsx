import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useSettings, PLAYBACK_SPEEDS } from '../hooks';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { settings, updateSettings, resetSettings } = useSettings();

  const handleSpeedChange = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(settings.defaultPlaybackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    updateSettings({ defaultPlaybackSpeed: PLAYBACK_SPEEDS[nextIndex] });
  };

  const handleRadiusChange = (increase: boolean) => {
    const newRadius = increase
      ? Math.min(settings.defaultTriggerRadius + 5, 50)
      : Math.max(settings.defaultTriggerRadius - 5, 10);
    updateSettings({ defaultTriggerRadius: newRadius });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Playback section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Default Speed</Text>
              <Text style={styles.settingDescription}>
                Starting playback speed for audio
              </Text>
            </View>
            <TouchableOpacity
              style={styles.speedButton}
              onPress={handleSpeedChange}
            >
              <Text style={styles.speedText}>
                {settings.defaultPlaybackSpeed}x
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Play</Text>
              <Text style={styles.settingDescription}>
                Automatically play audio when reaching a stop
              </Text>
            </View>
            <Switch
              value={settings.autoPlayEnabled}
              onValueChange={(value) => updateSettings({ autoPlayEnabled: value })}
              trackColor={{ false: '#e0e0e0', true: '#0891b2' }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Location section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Trigger Radius</Text>
              <Text style={styles.settingDescription}>
                Distance to trigger stop audio ({settings.defaultTriggerRadius}m)
              </Text>
            </View>
            <View style={styles.radiusControls}>
              <TouchableOpacity
                style={styles.radiusButton}
                onPress={() => handleRadiusChange(false)}
              >
                <Ionicons name="remove" size={20} color="#333" />
              </TouchableOpacity>
              <Text style={styles.radiusValue}>
                {settings.defaultTriggerRadius}m
              </Text>
              <TouchableOpacity
                style={styles.radiusButton}
                onPress={() => handleRadiusChange(true)}
              >
                <Ionicons name="add" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Distance Units</Text>
              <Text style={styles.settingDescription}>
                Show distances in meters or feet
              </Text>
            </View>
            <TouchableOpacity
              style={styles.unitButton}
              onPress={() =>
                updateSettings({
                  showDistanceInMeters: !settings.showDistanceInMeters,
                })
              }
            >
              <Text style={styles.unitText}>
                {settings.showDistanceInMeters ? 'Metric' : 'Imperial'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Display section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Keep Screen On</Text>
              <Text style={styles.settingDescription}>
                Prevent screen from sleeping during tours
              </Text>
            </View>
            <Switch
              value={settings.keepScreenOn}
              onValueChange={(value) => updateSettings({ keepScreenOn: value })}
              trackColor={{ false: '#e0e0e0', true: '#0891b2' }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Reset section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetSettings}
          >
            <Ionicons name="refresh-outline" size={20} color="#ef4444" />
            <Text style={styles.resetText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Audio Tour</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appCredit}>Personal Walking Tour App</Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingVertical: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  speedButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  speedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  radiusControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  unitButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  resetText: {
    fontSize: 16,
    color: '#ef4444',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  appCredit: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});
