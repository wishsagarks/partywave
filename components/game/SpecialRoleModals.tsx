import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, Zap, Target, Heart, Scale, Ghost, Smile, Crown } from 'lucide-react-native';
import { Player } from '@/types/game';

interface SpecialRoleModalsProps {
  showRevengerModal: boolean;
  revengerPlayer: Player | null;
  players: Player[];
  onRevengerChoice: (targetId: string) => void;
  showSpecialRoleCard: boolean;
  currentSpecialRolePlayer: Player | null;
  onCloseSpecialRoleCard: () => void;
}

export const SpecialRoleModals: React.FC<SpecialRoleModalsProps> = ({
  showRevengerModal,
  revengerPlayer,
  players,
  onRevengerChoice,
  showSpecialRoleCard,
  currentSpecialRolePlayer,
  onCloseSpecialRoleCard,
}) => {
  const getSpecialRoleInfo = (role: string) => {
    switch (role) {
      case 'revenger':
        return {
          icon: Target,
          color: '#EF4444',
          title: 'Revenger',
          description: 'When eliminated, you can choose another player to eliminate with you.',
          ability: 'Chain Elimination'
        };
      case 'lovers':
        return {
          icon: Heart,
          color: '#EC4899',
          title: 'Lovers',
          description: 'If one lover is eliminated, the other lover is also eliminated.',
          ability: 'Shared Fate'
        };
      case 'goddess-of-justice':
        return {
          icon: Scale,
          color: '#8B5CF6',
          title: 'Goddess of Justice',
          description: 'When there is a tie in voting, you automatically break the tie.',
          ability: 'Tie Breaker'
        };
      case 'ghost':
        return {
          icon: Ghost,
          color: '#6B7280',
          title: 'Ghost',
          description: 'Even after elimination, you can still participate in voting.',
          ability: 'Posthumous Voting'
        };
      case 'mr-meme':
        return {
          icon: Smile,
          color: '#F59E0B',
          title: 'Mr. Meme',
          description: 'You can only communicate through gestures and miming - no verbal clues allowed!',
          ability: 'Silent Communication'
        };
      case 'joy-fool':
        return {
          icon: Crown,
          color: '#10B981',
          title: 'Joy Fool',
          description: 'If eliminated in the first round, you gain bonus points.',
          ability: 'Early Elimination Bonus'
        };
      default:
        return {
          icon: Zap,
          color: '#8B5CF6',
          title: 'Special Role',
          description: 'You have a special ability in this game.',
          ability: 'Unknown'
        };
    }
  };

  const alivePlayers = players.filter(p => p.isAlive && p.id !== revengerPlayer?.id);

  return (
    <>
      {/* Revenger Modal */}
      <Modal
        visible={showRevengerModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Target size={24} color="#EF4444" />
              <Text style={styles.modalTitle}>Revenger's Choice</Text>
            </View>
            
            <Text style={styles.modalDescription}>
              {revengerPlayer?.name} was eliminated! As the Revenger, choose another player to eliminate with you.
            </Text>
            
            <ScrollView style={styles.playersList}>
              {alivePlayers.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.playerOption}
                  onPress={() => onRevengerChoice(player.id)}
                >
                  <Text style={styles.playerOptionName}>{player.name}</Text>
                  <Text style={styles.playerOptionRole}>
                    {player.role === 'civilian' ? '👥' : player.role === 'undercover' ? '🕵️' : '❓'} 
                    {player.role}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Special Role Card Modal */}
      <Modal
        visible={showSpecialRoleCard}
        transparent
        animationType="slide"
        onRequestClose={onCloseSpecialRoleCard}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.roleCardContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onCloseSpecialRoleCard}
            >
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
            
            {currentSpecialRolePlayer?.specialRole && (() => {
              const roleInfo = getSpecialRoleInfo(currentSpecialRolePlayer.specialRole);
              const IconComponent = roleInfo.icon;
              
              return (
                <>
                  <View style={styles.roleCardHeader}>
                    <IconComponent size={32} color={roleInfo.color} />
                    <Text style={[styles.roleCardTitle, { color: roleInfo.color }]}>
                      {roleInfo.title}
                    </Text>
                  </View>
                  
                  <View style={styles.roleCardContent}>
                    <Text style={styles.roleCardDescription}>
                      {roleInfo.description}
                    </Text>
                    
                    <View style={styles.abilityBadge}>
                      <Zap size={16} color="#F59E0B" />
                      <Text style={styles.abilityText}>{roleInfo.ability}</Text>
                    </View>
                    
                    {currentSpecialRolePlayer.specialRole === 'mr-meme' && (
                      <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                          ⚠️ Remember: You can only use gestures and miming. No verbal clues allowed!
                        </Text>
                      </View>
                    )}
                    
                    {currentSpecialRolePlayer.specialRole === 'ghost' && !currentSpecialRolePlayer.isAlive && (
                      <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                          👻 You're eliminated but can still vote in future rounds!
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  modalDescription: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 22,
    marginBottom: 20,
  },
  playersList: {
    maxHeight: 300,
  },
  playerOption: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  playerOptionRole: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  roleCardContainer: {
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  roleCardHeader: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  roleCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  roleCardContent: {
    gap: 16,
  },
  roleCardDescription: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 22,
    textAlign: 'center',
  },
  abilityBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  abilityText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  warningText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  infoText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});