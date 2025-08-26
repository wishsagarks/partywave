import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameService } from '@/services/gameService';
import { Player } from '@/types/game';

interface SpecialRoleModalsProps {
  // Revenger Modal
  showRevengerModal: boolean;
  revengerPlayer: Player | null;
  players: Player[];
  onRevengerChoice: (targetId: string) => void;
  
  // Special Role Card Modal
  showSpecialRoleCard: boolean;
  currentSpecialRolePlayer: Player | null;
  onCloseSpecialRoleCard: () => void;
}

export function SpecialRoleModals({
  showRevengerModal,
  revengerPlayer,
  players,
  onRevengerChoice,
  showSpecialRoleCard,
  currentSpecialRolePlayer,
  onCloseSpecialRoleCard,
}: SpecialRoleModalsProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'civilian': return '#10B981';
      case 'undercover': return '#EF4444';
      case 'mrwhite': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'civilian': return 'Civilian';
      case 'undercover': return 'Undercover';
      case 'mrwhite': return 'Mr. White';
      default: return 'Unknown';
    }
  };

  const getRoleEmoji = (role: string) => {
    switch (role) {
      case 'civilian': return '👥';
      case 'undercover': return '🕵️';
      case 'mrwhite': return '❓';
      default: return '❓';
    }
  };

  return (
    <>
      {/* Revenger Choice Modal */}
      <Modal
        visible={showRevengerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#1F2937', '#111827']}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>⚔️ Revenger's Choice</Text>
          </View>

          <View style={styles.centerContent}>
            <Text style={styles.revengerInstructions}>
              {revengerPlayer?.name}, you have been eliminated! 
              As the Revenger, choose one player to eliminate with you:
            </Text>
            
            <ScrollView style={styles.revengerTargets}>
              {players
                .filter(p => p.isAlive && p.id !== revengerPlayer?.id)
                .map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.revengerTargetButton}
                  onPress={() => onRevengerChoice(player.id)}
                >
                  <Text style={styles.revengerTargetName}>{player.name}</Text>
                  <Text style={styles.revengerTargetRole}>
                    {getRoleEmoji(player.role)} {getRoleName(player.role)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </LinearGradient>
      </Modal>

      {/* Special Role Card Modal */}
      <Modal
        visible={showSpecialRoleCard}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.specialRoleModalOverlay}>
          <View style={styles.specialRoleModalContent}>
            <Text style={styles.specialRoleModalTitle}>
              {GameService.getSpecialRoleEmoji(currentSpecialRolePlayer?.specialRole!)} Special Role
            </Text>
            <Text style={styles.specialRoleModalName}>
              {currentSpecialRolePlayer?.specialRole?.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Text>
            <Text style={styles.specialRoleModalDescription}>
              {currentSpecialRolePlayer?.specialRole && 
                GameService.getSpecialRoleDescription(currentSpecialRolePlayer.specialRole)
              }
            </Text>
            <TouchableOpacity
              style={styles.specialRoleModalButton}
              onPress={onCloseSpecialRoleCard}
            >
              <Text style={styles.specialRoleModalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  revengerInstructions: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  revengerTargets: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  revengerTargetButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  revengerTargetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  revengerTargetRole: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  specialRoleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  specialRoleModalContent: {
    backgroundColor: '#374151',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    maxWidth: 320,
  },
  specialRoleModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  specialRoleModalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    textAlign: 'center',
  },
  specialRoleModalDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 20,
  },
  specialRoleModalButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  specialRoleModalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});