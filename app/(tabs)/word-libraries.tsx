import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { BookOpen, Plus, Edit3, Trash2, Eye, X, ToggleLeft, ToggleRight } from 'lucide-react-native';
import { useWordLibraries } from '@/hooks/useGameData';
import { WordPair } from '@/types/game';

export default function WordLibrariesScreen() {
  const { 
    libraries, 
    loading, 
    error, 
    toggleLibrary, 
    addCustomWordPair, 
    deleteWordPair, 
    updateWordPair 
  } = useWordLibraries();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [selectedLibraryIndex, setSelectedLibraryIndex] = useState<number>(-1);
  const [newPair, setNewPair] = useState({ civilian: '', undercover: '', category: '' });
  const [editingPair, setEditingPair] = useState<WordPair | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleLibrary = async (libraryId: string, currentState: boolean) => {
    try {
      await toggleLibrary(libraryId, !currentState);
    } catch (err) {
      Alert.alert('Error', 'Failed to update library status');
    }
  };

  const handleAddWordPair = async () => {
    if (!newPair.civilian.trim() || !newPair.undercover.trim()) {
      Alert.alert('Error', 'Please fill in both words');
      return;
    }

    try {
      setIsSubmitting(true);
      await addCustomWordPair(
        newPair.civilian.trim(),
        newPair.undercover.trim(),
        newPair.category.trim() || 'Custom'
      );
      
      setNewPair({ civilian: '', undercover: '', category: '' });
      setShowAddModal(false);
      Alert.alert('Success', 'Word pair added to Custom Pack!');
    } catch (err) {
      Alert.alert('Error', 'Failed to add word pair');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditWordPair = async () => {
    if (!editingPair || !editingPair.civilian_word.trim() || !editingPair.undercover_word.trim()) {
      Alert.alert('Error', 'Please fill in both words');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateWordPair(
        editingPair.id,
        editingPair.civilian_word.trim(),
        editingPair.undercover_word.trim(),
        editingPair.category.trim()
      );
      
      setEditingPair(null);
      Alert.alert('Success', 'Word pair updated!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update word pair');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWordPair = (pairId: string) => {
    Alert.alert(
      'Delete Word Pair',
      'Are you sure you want to delete this word pair?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWordPair(pairId);
              Alert.alert('Success', 'Word pair deleted');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete word pair');
            }
          }
        }
      ]
    );
  };

  const getTotalActivePairs = () => {
    return libraries
      .filter(lib => lib.is_active)
      .reduce((total, lib) => total + lib.pairs.length, 0);
  };

  const selectedLibrary = selectedLibraryIndex >= 0 ? libraries[selectedLibraryIndex] : null;

  if (loading) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading word libraries...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#1F2937', '#111827']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>📚 Word Libraries</Text>
        <Text style={styles.subtitle}>Manage your word collections</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsText}>
          Active Word Pairs: {getTotalActivePairs()}
        </Text>
        <Text style={styles.statsSubtext}>
          From {libraries.filter(lib => lib.is_active).length} active libraries
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {libraries.map((library, index) => (
          <View key={library.id} style={styles.libraryCard}>
            <View style={styles.libraryHeader}>
              <View style={styles.libraryInfo}>
                <View style={styles.libraryTitleRow}>
                  <Text style={styles.libraryName}>{library.name}</Text>
                  {library.is_official && (
                    <View style={styles.officialBadge}>
                      <Text style={styles.officialBadgeText}>OFFICIAL</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.libraryCount}>
                  {library.pairs.length} pairs
                </Text>
                {library.description && (
                  <Text style={styles.libraryDescription}>
                    {library.description}
                  </Text>
                )}
              </View>
              
              <View style={styles.libraryActions}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => {
                    setSelectedLibraryIndex(index);
                    setShowLibraryModal(true);
                  }}
                >
                  <Eye size={16} color="#8B5CF6" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.toggleContainer}
                  onPress={() => handleToggleLibrary(library.id, library.is_active)}
                >
                  {library.is_active ? (
                    <ToggleRight size={24} color="#10B981" />
                  ) : (
                    <ToggleLeft size={24} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="white" />
          <Text style={styles.addButtonText}>Add Custom Word Pair</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Word Pair Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#1F2937', '#111827']}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Word Pair</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#F3F4F6" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalInstructions}>
              Create a pair of similar words that could confuse players
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Civilian Word</Text>
              <TextInput
                style={styles.textInput}
                value={newPair.civilian}
                onChangeText={(text) => setNewPair({ ...newPair, civilian: text })}
                placeholder="e.g., Cat"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Undercover Word</Text>
              <TextInput
                style={styles.textInput}
                value={newPair.undercover}
                onChangeText={(text) => setNewPair({ ...newPair, undercover: text })}
                placeholder="e.g., Dog"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={newPair.category}
                onChangeText={(text) => setNewPair({ ...newPair, category: text })}
                placeholder="e.g., Animals"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { opacity: isSubmitting ? 0.6 : 1 }]} 
              onPress={handleAddWordPair}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Add Word Pair</Text>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>

      {/* Library View Modal */}
      <Modal
        visible={showLibraryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#1F2937', '#111827']}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedLibrary?.name}</Text>
            <TouchableOpacity onPress={() => setShowLibraryModal(false)}>
              <X size={24} color="#F3F4F6" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedLibrary?.pairs.map((pair) => (
              <View key={pair.id} style={styles.wordPairCard}>
                <View style={styles.wordPairInfo}>
                  <Text style={styles.wordText}>
                    👥 {pair.civilian_word} vs 🕵️ {pair.undercover_word}
                  </Text>
                  <View style={styles.pairMetadata}>
                    <Text style={styles.categoryText}>
                      {pair.category}
                    </Text>
                    <Text style={styles.usageText}>
                      Used {pair.usage_count} times
                    </Text>
                  </View>
                </View>
                
                {!selectedLibrary.is_official && (
                  <View style={styles.wordPairActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => setEditingPair(pair)}
                    >
                      <Edit3 size={14} color="#8B5CF6" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteWordPair(pair.id)}
                    >
                      <Trash2 size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
            
            {selectedLibrary?.pairs.length === 0 && (
              <Text style={styles.emptyText}>
                No word pairs in this library yet.
              </Text>
            )}
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Edit Word Pair Modal */}
      <Modal
        visible={!!editingPair}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#1F2937', '#111827']}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Word Pair</Text>
            <TouchableOpacity onPress={() => setEditingPair(null)}>
              <X size={24} color="#F3F4F6" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Civilian Word</Text>
              <TextInput
                style={styles.textInput}
                value={editingPair?.civilian_word || ''}
                onChangeText={(text) => setEditingPair(prev => prev ? { ...prev, civilian_word: text } : null)}
                placeholder="e.g., Cat"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Undercover Word</Text>
              <TextInput
                style={styles.textInput}
                value={editingPair?.undercover_word || ''}
                onChangeText={(text) => setEditingPair(prev => prev ? { ...prev, undercover_word: text } : null)}
                placeholder="e.g., Dog"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.textInput}
                value={editingPair?.category || ''}
                onChangeText={(text) => setEditingPair(prev => prev ? { ...prev, category: text } : null)}
                placeholder="e.g., Animals"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { opacity: isSubmitting ? 0.6 : 1 }]} 
              onPress={handleEditWordPair}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  statsCard: {
    backgroundColor: '#374151',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  statsSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  libraryCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  libraryInfo: {
    flex: 1,
    marginRight: 12,
  },
  libraryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  libraryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  officialBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  officialBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  libraryCount: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  libraryDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  libraryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  toggleContainer: {
    padding: 4,
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalInstructions: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#374151',
    color: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  wordPairCard: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordPairInfo: {
    flex: 1,
  },
  wordText: {
    fontSize: 16,
    color: '#F3F4F6',
    fontWeight: '500',
    marginBottom: 8,
  },
  pairMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  usageText: {
    fontSize: 10,
    color: '#6B7280',
  },
  wordPairActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 40,
  },
});