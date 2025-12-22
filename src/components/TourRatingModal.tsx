import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TourRatingModalProps {
  visible: boolean;
  tourName: string;
  currentRating?: number;
  currentReview?: string;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
  onDelete?: () => void;
}

export function TourRatingModal({
  visible,
  tourName,
  currentRating = 0,
  currentReview = '',
  onClose,
  onSubmit,
  onDelete,
}: TourRatingModalProps) {
  const [rating, setRating] = useState(currentRating);
  const [review, setReview] = useState(currentReview);

  useEffect(() => {
    if (visible) {
      setRating(currentRating);
      setReview(currentReview);
    }
  }, [visible, currentRating, currentReview]);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, review);
      onClose();
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={40}
            color={i <= rating ? '#f59e0b' : '#d1d5db'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingText = () => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Great';
      case 5: return 'Excellent!';
      default: return 'Tap to rate';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Tour</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.tourName}>{tourName}</Text>

          {/* Star Rating */}
          <View style={styles.starsContainer}>
            {renderStars()}
          </View>
          <Text style={styles.ratingText}>{getRatingText()}</Text>

          {/* Review Input */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Write a review (optional)</Text>
            <TextInput
              style={styles.reviewInput}
              multiline
              numberOfLines={4}
              placeholder="Share your experience with this tour..."
              placeholderTextColor="#9ca3af"
              value={review}
              onChangeText={setReview}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{review.length}/500</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={rating === 0}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {currentRating > 0 ? 'Update Rating' : 'Submit Rating'}
              </Text>
            </TouchableOpacity>

            {currentRating > 0 && onDelete && (
              <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
                <Text style={styles.deleteButtonText}>Delete Rating</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Compact star display for tour cards
interface StarRatingDisplayProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
}

export function StarRatingDisplay({ rating, size = 14, showNumber = true }: StarRatingDisplayProps) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(
        <Ionicons key={i} name="star" size={size} color="#f59e0b" />
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <Ionicons key={i} name="star-half" size={size} color="#f59e0b" />
      );
    } else {
      stars.push(
        <Ionicons key={i} name="star-outline" size={size} color="#d1d5db" />
      );
    }
  }

  return (
    <View style={displayStyles.container}>
      <View style={displayStyles.stars}>{stars}</View>
      {showNumber && rating > 0 && (
        <Text style={displayStyles.number}>{rating.toFixed(1)}</Text>
      )}
    </View>
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
    justifyContent: 'space-between',
    padding: 16,
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
    padding: 24,
    alignItems: 'center',
  },
  tourName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  reviewSection: {
    width: '100%',
    marginBottom: 32,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  reviewInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 8,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
});

const displayStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  number: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
});
