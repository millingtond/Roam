import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TourNote } from '../hooks/useTourUserData';
import { TourStop } from '../types';

interface TourNotesModalProps {
  visible: boolean;
  tourId: string;
  tourName: string;
  stops: TourStop[];
  notes: TourNote[];
  onClose: () => void;
  onAddNote: (text: string, stopId?: number) => Promise<TourNote>;
  onUpdateNote: (noteId: string, text: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
}

export function TourNotesModal({
  visible,
  tourId,
  tourName,
  stops,
  notes,
  onClose,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: TourNotesModalProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedStopId, setSelectedStopId] = useState<number | undefined>(undefined);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;

    await onAddNote(newNoteText.trim(), selectedStopId);
    setNewNoteText('');
    setSelectedStopId(undefined);
    setIsAddingNote(false);
  };

  const handleEditNote = (note: TourNote) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  };

  const handleSaveEdit = async () => {
    if (!editingNoteId || !editingText.trim()) return;

    await onUpdateNote(editingNoteId, editingText.trim());
    setEditingNoteId(null);
    setEditingText('');
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteNote(noteId),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStopName = (stopId?: number) => {
    if (!stopId) return 'General Note';
    const stop = stops.find(s => s.id === stopId);
    return stop ? `Stop ${stop.id}: ${stop.name}` : `Stop ${stopId}`;
  };

  const renderNote = ({ item: note }: { item: TourNote }) => {
    const isEditing = editingNoteId === note.id;

    return (
      <View style={styles.noteCard}>
        <View style={styles.noteHeader}>
          <View style={styles.noteLocation}>
            <Ionicons
              name={note.stopId ? 'location' : 'document-text'}
              size={14}
              color="#6b7280"
            />
            <Text style={styles.noteLocationText}>
              {getStopName(note.stopId)}
            </Text>
          </View>
          <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
        </View>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              multiline
              value={editingText}
              onChangeText={setEditingText}
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditingNoteId(null)}
              >
                <Text style={styles.editButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={[styles.editButtonText, styles.saveButtonText]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.noteText}>{note.text}</Text>
            <View style={styles.noteActions}>
              <TouchableOpacity
                style={styles.noteActionButton}
                onPress={() => handleEditNote(note)}
              >
                <Ionicons name="pencil-outline" size={16} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.noteActionButton}
                onPress={() => handleDeleteNote(note.id)}
              >
                <Ionicons name="trash-outline" size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
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
          <Text style={styles.headerTitle}>Tour Notes</Text>
          <TouchableOpacity
            onPress={() => setIsAddingNote(true)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#0891b2" />
          </TouchableOpacity>
        </View>

        <Text style={styles.tourName}>{tourName}</Text>

        {/* Add Note Form */}
        {isAddingNote && (
          <View style={styles.addNoteContainer}>
            <View style={styles.addNoteHeader}>
              <Text style={styles.addNoteTitle}>New Note</Text>
              <TouchableOpacity onPress={() => setIsAddingNote(false)}>
                <Ionicons name="close-circle" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Stop Selector */}
            <View style={styles.stopSelector}>
              <Text style={styles.stopSelectorLabel}>Attach to stop (optional):</Text>
              <View style={styles.stopOptions}>
                <TouchableOpacity
                  style={[
                    styles.stopOption,
                    selectedStopId === undefined && styles.stopOptionSelected,
                  ]}
                  onPress={() => setSelectedStopId(undefined)}
                >
                  <Text style={styles.stopOptionText}>General</Text>
                </TouchableOpacity>
                {stops.slice(0, 8).map(stop => (
                  <TouchableOpacity
                    key={stop.id}
                    style={[
                      styles.stopOption,
                      selectedStopId === stop.id && styles.stopOptionSelected,
                    ]}
                    onPress={() => setSelectedStopId(stop.id)}
                  >
                    <Text style={styles.stopOptionText}>{stop.id}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.noteInput}
              multiline
              numberOfLines={4}
              placeholder="Write your note here..."
              placeholderTextColor="#9ca3af"
              value={newNoteText}
              onChangeText={setNewNoteText}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.addNoteButton,
                !newNoteText.trim() && styles.addNoteButtonDisabled,
              ]}
              onPress={handleAddNote}
              disabled={!newNoteText.trim()}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={styles.addNoteButtonText}>Add Note</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Notes Yet</Text>
            <Text style={styles.emptyText}>
              Add notes to remember interesting details, tips, or personal thoughts about this tour.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setIsAddingNote(true)}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={styles.emptyButtonText}>Add First Note</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={notes.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )}
            keyExtractor={item => item.id}
            renderItem={renderNote}
            contentContainerStyle={styles.notesList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Compact note indicator for tour cards
interface NoteIndicatorProps {
  noteCount: number;
}

export function NoteIndicator({ noteCount }: NoteIndicatorProps) {
  if (noteCount === 0) return null;

  return (
    <View style={indicatorStyles.container}>
      <Ionicons name="document-text" size={12} color="#6b7280" />
      <Text style={indicatorStyles.count}>{noteCount}</Text>
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
  addButton: {
    padding: 8,
  },
  tourName: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  addNoteContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addNoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  stopSelector: {
    marginBottom: 12,
  },
  stopSelectorLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  stopOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stopOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  stopOptionSelected: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0891b2',
  },
  stopOptionText: {
    fontSize: 13,
    color: '#374151',
  },
  noteInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
    marginBottom: 12,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
    padding: 14,
    borderRadius: 10,
    gap: 6,
  },
  addNoteButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addNoteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  notesList: {
    padding: 16,
    paddingBottom: 32,
  },
  noteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteLocationText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  noteDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  noteText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  noteActionButton: {
    padding: 6,
  },
  editContainer: {
    marginTop: 8,
  },
  editInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#0891b2',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    marginBottom: 10,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  editButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#0891b2',
  },
  saveButtonText: {
    color: 'white',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});

const indicatorStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  count: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});
