import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TourStop } from '../types';

interface ScriptViewerProps {
  visible: boolean;
  stop: TourStop | null;
  onClose: () => void;
}

export function ScriptViewer({ visible, stop, onClose }: ScriptViewerProps) {
  if (!stop) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{stop.name}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Directions section */}
          {stop.directionToNext && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="navigate" size={20} color="#ef4444" />
                <Text style={styles.sectionTitle}>Text Directions</Text>
              </View>
              <Text style={styles.directionText}>{stop.directionToNext}</Text>
            </View>
          )}

          {/* Full script section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#0891b2" />
              <Text style={styles.sectionTitle}>Full Script</Text>
            </View>
            <Text style={styles.scriptText}>{stop.script}</Text>
          </View>

          {/* Distance to next */}
          {stop.distanceToNext && (
            <View style={styles.distanceInfo}>
              <Ionicons name="walk-outline" size={18} color="#666" />
              <Text style={styles.distanceText}>
                {stop.distanceToNext}m to next stop
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// End Tour Dialog
interface EndTourDialogProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function EndTourDialog({ visible, onCancel, onConfirm }: EndTourDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={dialogStyles.overlay}>
        <View style={dialogStyles.dialog}>
          <View style={dialogStyles.iconContainer}>
            <Ionicons name="close" size={32} color="#ef4444" />
          </View>

          <Text style={dialogStyles.title}>End Tour</Text>
          <Text style={dialogStyles.message}>
            Would you like to end this tour?
          </Text>

          <View style={dialogStyles.buttons}>
            <TouchableOpacity
              style={[dialogStyles.button, dialogStyles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={dialogStyles.cancelText}>No, Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[dialogStyles.button, dialogStyles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={dialogStyles.confirmText}>Yes, End Tour</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Photo Viewer
interface PhotoViewerProps {
  visible: boolean;
  imageUri: string | null;
  stopName: string;
  onClose: () => void;
}

export function PhotoViewer({ visible, imageUri, stopName, onClose }: PhotoViewerProps) {
  const [imageError, setImageError] = React.useState(false);

  if (!imageUri) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={photoStyles.container}>
        <TouchableOpacity style={photoStyles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        <View style={photoStyles.imageContainer}>
          {imageError ? (
            <View style={photoStyles.imagePlaceholder}>
              <Ionicons name="image-outline" size={64} color="#666" />
              <Text style={photoStyles.errorText}>Failed to load image</Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={photoStyles.image}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          )}
        </View>

        <View style={photoStyles.caption}>
          <Text style={photoStyles.captionText}>{stopName}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  directionText: {
    fontSize: 15,
    color: '#0891b2',
    lineHeight: 22,
  },
  scriptText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});

const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#ef4444',
    marginLeft: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});

const photoStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#999',
    marginTop: 16,
    fontSize: 14,
  },
  caption: {
    padding: 20,
    paddingBottom: 40,
  },
  captionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});
