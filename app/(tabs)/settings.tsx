import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { BookOpen, Plus, CreditCard as Edit3, Trash2, Eye, X } from 'lucide-react-native';

interface WordPair {
  id: number;
  civilian: string;
  undercover: string;
  category: string;
}

interface WordLibrary {
  name: string;
  pairs: WordPair[];
  isActive: boolean;
}

export default function SettingsScreen() {
  const [wordLibraries, setWordLibraries] = useState<WordLibrary[]>([
    {
      name: "Classic Pack",
      pairs: [
        { id: 1, civilian: "Cat", undercover: "Dog", category: "Animals" },
        { id: 2, civilian: "Coffee", undercover: "Tea", category: "Drinks" },
        { id: 3, civilian: "Pizza", undercover: "Burger", category: "Food" },
        { id: 4, civilian: "Apple", undercover: "Orange", category: "Fruits" },
        { id: 5, civilian: "Car", undercover: "Motorcycle", category: "Vehicles" },
      ],
      isActive: true
    },
    {
      name: "Entertainment",
      pairs: [
        { id: 6, civilian: "Movie", undercover: "TV Show", category: "Media" },
        { id: 7, civilian: "Guitar", undercover: "Piano", category: "Music" },
        { id: 8, civilian: "Football", undercover: "Basketball", category: "Sports" },
        { id: 9, civilian: "Book", undercover: "Magazine", category: "Reading" },
        { id: 10, civilian: "Theatre", undercover: "Cinema", category: "Entertainment" },
      ],
      isActive: true
    },
    {
      name: "Custom Pack",
      pairs: [],
      isActive: false
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<WordLibrary | null>(null);
  const [newPair, setNewPair] = useState({ civilian: '', undercover: '', category: '' });
  const [editingPair, setEditingPair] = useState<WordPair | null>(null);

  const toggleLibrary = (libraryName: string) => {
    setWordLibraries(libraries =>
      libraries.map(lib =>
        lib.name === libraryName ? { ...lib, isActive: !lib.isActive } : lib
      )
    );
  };

  const addWordPair = () => {
    if (!newPair.civilian.trim() || !newPair.undercover.trim()) {
      Alert.alert('Error', 'Please fill in both words');
      return;
    }

    const customLib = wordLibraries.find(lib => lib.name === 'Custom Pack');
    if (customLib) {
      const newId = Math.max(...wordLibraries.flatMap(lib => lib.pairs.map(p => p.id)), 0) + 1;
      
      setWordLibraries(libraries =>
        libraries.map(lib =>
          lib.name === 'Custom Pack'
            ? {
                ...lib,
                pairs: [
                  ...lib.pairs,
                  {
                    id: newId,
                    civilian: newPair.civilian.trim(),
                    undercover: newPair.undercover.trim(),
                    category: newPair.category.trim() || 'Custom'
                  }
                ]
              }
            : lib
        )
      );

      setNewPair({ civilian: '', undercover: '', category: '' });
      setShowAddModal(false);
      
      Alert.alert('Success', 'Word pair added to Custom Pack!');
    }
  };

  const editWordPair = () => {
    if (!editingPair || !editingPair.civilian.trim() || !editingPair.undercover.trim()) {
      Alert.alert('Error', 'Please fill in both words');
      return;
    }

    setWordLibraries(libraries =>
      libraries.map(lib => ({
        ...lib,
        pairs: lib.pairs.map(pair =>
          pair.id === editingPair.id ? editingPair : pair
        )
      }))
    );

    setEditingPair(null);
    Alert.alert('Success', 'Word pair updated!');
  };

  const deleteWordPair = (pairId: number) => {
    Alert.alert(
      'Delete Word Pair',
      'Are you sure you want to delete this word pair?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setWordLibraries(libraries =>
              libraries.map(lib => ({
                ...lib,
                pairs: lib.pairs.filter(pair => pair.id !== pairId)
              }))
            );
          }
        }
      ]
    );
  };

  const getTotalActivePairs = () => {
    return wordLibraries
      .filter(lib => lib.isActive)
      .reduce((total, lib) => total + lib.pairs.length, 0);
  };

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
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {wordLibraries.map((library) => (
          <View key={library.name} style={styles.libraryCard}>
            <View style={styles.libraryHeader}>
              <View style={styles.libraryInfo}>
                <Text style={styles.libraryName}>{library.name}</Text>
                <Text style={styles.libraryCount}>
                  {library.pairs.length} pairs
                </Text>
              </View>
              
              <View style={styles.libraryActions}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => {
                    setSelectedLibrary(library);
                    setShowLibraryModal(true);
                  }}
                >
                  <Eye size={16} color="#8B5CF6" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    { backgroundColor: library.isActive ? '#10B981' : '#6B7280' }
                  ]}
                  onPress={() => toggleLibrary(library.name)}
                >
                  <Text style={styles.toggleButtonText}>
                    {library.isActive ? 'ON' : 'OFF'}
                  </Text>
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

            <TouchableOpacity style={styles.saveButton} onPress={addWordPair}>
              <Text style={styles.saveButtonText}>Add Word Pair</Text>
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
                    👥 {pair.civilian} vs 🕵️ {pair.undercover}
                  </Text>
                  <Text style={styles.categoryText}>
                    Category: {pair.category}
                  </Text>
                </View>
                
                {selectedLibrary.name === 'Custom Pack' && (
                  <View style={styles.wordPairActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => setEditingPair(pair)}
                    >
                      <Edit3 size={14} color="#8B5CF6" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteWordPair(pair.id)}
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
                value={editingPair?.civilian || ''}
                onChangeText={(text) => setEditingPair(prev => prev ? { ...prev, civilian: text } : null)}
                placeholder="e.g., Cat"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Undercover Word</Text>
              <TextInput
                style={styles.textInput}
                value={editingPair?.undercover || ''}
                onChangeText={(text) => setEditingPair(prev => prev ? { ...prev, undercover: text } : null)}
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

            <TouchableOpacity style={styles.saveButton} onPress={editWordPair}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
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
    alignItems: 'center',
  },
  libraryInfo: {
    flex: 1,
  },
  libraryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  libraryCount: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  libraryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
    backgroundColor: '#374151',
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
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#9CA3AF',
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