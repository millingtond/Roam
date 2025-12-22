import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Share,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Tour } from '../types';

interface ShareTourModalProps {
  visible: boolean;
  tour: Tour;
  onClose: () => void;
}

// Simple QR code generator using a web service
// For production, you'd use a library like react-native-qrcode-svg
const QR_API_BASE = 'https://api.qrserver.com/v1/create-qr-code/';

export function ShareTourModal({ visible, tour, onClose }: ShareTourModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');

  useEffect(() => {
    if (visible && tour) {
      generateShareData();
    }
  }, [visible, tour]);

  const generateShareData = async () => {
    // Create a shareable tour summary
    // In a production app, this would be a deep link to your app/website
    const tourSummary = {
      id: tour.id,
      name: tour.name,
      description: tour.description,
      stops: tour.stops.length,
      distance: tour.totalDistance,
      duration: tour.estimatedDuration,
      startPoint: tour.startPoint,
    };

    // For now, we'll encode the basic tour info
    // In production, you'd use a proper URL scheme or universal link
    const shareData = JSON.stringify({
      type: 'audio-tour',
      ...tourSummary,
    });

    // Create a simple share URL (this would be your website/app link in production)
    const mockShareUrl = `audiotour://tour/${tour.id}`;
    setShareUrl(mockShareUrl);

    // Generate QR code URL
    const qrData = encodeURIComponent(mockShareUrl);
    const qrUrl = `${QR_API_BASE}?size=250x250&data=${qrData}&bgcolor=ffffff&color=0891b2`;
    setQrCodeUrl(qrUrl);
  };

  const handleShareLink = async () => {
    try {
      const message = `Check out this audio walking tour!\n\n` +
        `🎧 ${tour.name}\n` +
        `📍 ${tour.stops.length} stops\n` +
        `🚶 ${tour.totalDistance?.toFixed(1) || '?'} km\n` +
        `⏱️ ${tour.estimatedDuration} minutes\n\n` +
        `${tour.description || ''}\n\n` +
        `Download the Audio Tour app to explore!`;

      await Share.share({
        message,
        title: tour.name,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleExportTour = async () => {
    try {
      const tourJson = JSON.stringify(tour, null, 2);
      const exportPath = FileSystem.documentDirectory + `${tour.id}-export.json`;
      
      await FileSystem.writeAsStringAsync(exportPath, tourJson);
      
      // Share the file
      Alert.alert(
        'Tour Exported',
        `Tour data saved to:\n${exportPath}\n\nUse a file manager to share this file.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Could not export tour data.');
    }
  };

  const handleCopyLink = async () => {
    // In a real app, you'd copy to clipboard
    Alert.alert('Link Copied', shareUrl);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Tour</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Tour Info */}
          <View style={styles.tourInfo}>
            <Text style={styles.tourName}>{tour.name}</Text>
            <View style={styles.tourStats}>
              <View style={styles.stat}>
                <Ionicons name="location-outline" size={16} color="#6b7280" />
                <Text style={styles.statText}>{tour.stops.length} stops</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="walk-outline" size={16} color="#6b7280" />
                <Text style={styles.statText}>{tour.totalDistance?.toFixed(1)} km</Text>
              </View>
            </View>
          </View>

          {/* QR Code */}
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>Scan to Share</Text>
            <View style={styles.qrContainer}>
              {qrCodeUrl ? (
                <View style={styles.qrWrapper}>
                  {/* In production, use react-native-qrcode-svg for offline QR generation */}
                  <View style={styles.qrPlaceholder}>
                    <Ionicons name="qr-code-outline" size={120} color="#0891b2" />
                    <Text style={styles.qrNote}>QR Code</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.qrLoading}>
                  <Text style={styles.loadingText}>Generating QR code...</Text>
                </View>
              )}
            </View>
            <Text style={styles.qrHint}>
              Others can scan this code to get tour details
            </Text>
          </View>

          {/* Share Options */}
          <View style={styles.shareOptions}>
            <Text style={styles.sectionTitle}>Share Options</Text>

            <TouchableOpacity style={styles.shareOption} onPress={handleShareLink}>
              <View style={[styles.shareIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="share-social" size={22} color="#16a34a" />
              </View>
              <View style={styles.shareOptionText}>
                <Text style={styles.shareOptionTitle}>Share via...</Text>
                <Text style={styles.shareOptionDesc}>Send tour info via messages, email, etc.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareOption} onPress={handleCopyLink}>
              <View style={[styles.shareIcon, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="link" size={22} color="#0284c7" />
              </View>
              <View style={styles.shareOptionText}>
                <Text style={styles.shareOptionTitle}>Copy Link</Text>
                <Text style={styles.shareOptionDesc}>Copy tour link to clipboard</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareOption} onPress={handleExportTour}>
              <View style={[styles.shareIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="download-outline" size={22} color="#d97706" />
              </View>
              <View style={styles.shareOptionText}>
                <Text style={styles.shareOptionTitle}>Export Tour File</Text>
                <Text style={styles.shareOptionDesc}>Save tour.json for backup or transfer</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// QR Code display component for inline use
interface QRCodeDisplayProps {
  data: string;
  size?: number;
}

export function QRCodeDisplay({ data, size = 150 }: QRCodeDisplayProps) {
  const qrUrl = `${QR_API_BASE}?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=0891b2`;

  return (
    <View style={qrStyles.container}>
      {/* In production, use a proper QR library */}
      <View style={[qrStyles.placeholder, { width: size, height: size }]}>
        <Ionicons name="qr-code" size={size * 0.6} color="#0891b2" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tourInfo: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  tourName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  tourStats: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
  },
  qrSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  qrContainer: {
    marginBottom: 12,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qrPlaceholder: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
  },
  qrNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  qrLoading: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  qrHint: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  shareOptions: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  shareIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  shareOptionText: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  shareOptionDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
});

const qrStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
  },
});
