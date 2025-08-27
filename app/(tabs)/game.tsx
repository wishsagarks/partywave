import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { Plus, Minus, Play, ArrowLeft, Users, X, Settings, ToggleLeft, ToggleRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { GameService } from '@/services/gameService';
import { useLeaderboard } from '@/hooks/useGameData';
import { SpecialRole } from '@/types/game';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

export default function GameSetupScreen() {
  const { topPlayers, loading: leaderboardLoading } = useLeaderboard();
  const [playerCount, setPlayerCount] = useState(6);
  const [gameName, setGameName] = useState('');
  const [showPlayerNamesModal, setShowPlayerNamesModal] = useState(false);
  const [showSpecialRolesModal, setShowSpecialRolesModal] = useState(false);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [useSpecialRoles, setUseSpecialRoles] = useState(false);
  const [selectedSpecialRoles, setSelectedSpecialRoles] = useState<SpecialRole[]>([]);
  const [customRoles, setCustomRoles] = useState<{
    civilians: number;
    undercover: number;
    mrWhite: number;
  } | null>(null);

  const availableSpecialRoles: SpecialRole[] = [
    'goddess-of-justice',
    'lovers', 
    'mr-meme',
    'revenger',
    'ghost',
    'joy-fool'
  ];

  useEffect(() => {
    // Initialize player names array when player count changes
    const newNames = Array(playerCount).fill('');
    setPlayerNames(newNames);
  }, [playerCount]);

  const toggleSpecialRole = (role: SpecialRole) => {
    setSelectedSpecialRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        // Limit special roles to reasonable number
        if (prev.length >= Math.floor(playerCount / 2)) {
          Alert.alert('Too Many Special Roles', 'You can only have up to half the players with special roles.');
          return prev;
        }
        return [...prev, role];
      }
    });
  };

  const updatePlayerCount = (count: number) => {
    const newCount = Math.max(3, Math.min(20, count));
    setPlayerCount(newCount);
    setCustomRoles(null); // Reset custom roles when player count changes
    // Reset special roles if too many selected
    if (selectedSpecialRoles.length > Math.floor(newCount / 2)) {
      setSelectedSpecialRoles([]);
    }
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const updateRoleCount = (role: 'undercover' | 'mrWhite', delta: number) => {
    const currentRoles = customRoles || GameService.getRoleDistribution(playerCount);
    const newRoles = { ...currentRoles };
    
    if (role === 'undercover') {
      newRoles.undercover = Math.max(0, Math.min(playerCount - 1, newRoles.undercover + delta));
    } else {
      newRoles.mrWhite = Math.max(0, Math.min(1, newRoles.mrWhite + delta));
    }
    
    // Adjust civilians accordingly
    newRoles.civilians = playerCount - newRoles.undercover - newRoles.mrWhite;
    
    // Ensure at least 1 civilian
    if (newRoles.civilians < 1) {
      if (role === 'undercover') {
        newRoles.undercover = Math.max(0, newRoles.undercover - 1);
      } else {
        newRoles.mrWhite = 0;
      }
      newRoles.civilians = playerCount - newRoles.undercover - newRoles.mrWhite;
    }
    
    setCustomRoles(newRoles);
  };

  const startGameSetup = () => {
    if (!gameName.trim()) {
      Alert.alert('Missing Game Name', 'Please enter a name for this game session.');
      return;
    }
    setShowPlayerNamesModal(true);
  };

  const startGame = async () => {
    // Check if all players have names
    const hasEmptyNames = playerNames.some(name => name.trim() === '');
    if (hasEmptyNames) {
      Alert.alert('Missing Names', 'Please enter names for all players before starting the game.');
      return;
    }

    // Check for duplicate names
    const uniqueNames = new Set(playerNames.map(name => name.trim().toLowerCase()));
    if (uniqueNames.size !== playerNames.length) {
      Alert.alert('Duplicate Names', 'Please ensure all player names are unique.');
      return;
    }

    try {
      setIsCreatingGame(true);
      
      // Create player records in database
      const playerIds = await Promise.all(
        playerNames.map(name => GameService.createOrUpdatePlayer(name.trim()))
      );
      
      // Create game record
      const gameId = await GameService.createGame(playerCount, gameName.trim());
      
      setShowPlayerNamesModal(false);
      router.push({
        pathname: '/game-flow',
        params: {
          gameId,
          playerCount: playerCount.toString(),
          playerNames: JSON.stringify(playerNames),
          playerIds: JSON.stringify(playerIds),
          customRoles: customRoles ? JSON.stringify(customRoles) : '',
          useSpecialRoles: useSpecialRoles.toString(),
          selectedSpecialRoles: JSON.stringify(selectedSpecialRoles),
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to start game. Please try again.');
      console.error('Game creation error:', error);
    } finally {
      setIsCreatingGame(false);
    }
  };

  const roles = customRoles || GameService.getRoleDistribution(playerCount);

  return (
    <LinearGradient
      colors={['#1F2937', '#111827']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#F3F4F6" />
        </TouchableOpacity>
        <Text style={styles.title}>Game Setup</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Leaderboard Preview */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top Players</Text>
          {leaderboardLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            <View style={styles.leaderboardPreview}>
              {topPlayers.slice(0, 3).map((player, index) => (
                <View key={player.id} style={styles.leaderboardItem}>
                  <Text style={styles.leaderboardRank}>#{index + 1}</Text>
                  <Text style={styles.leaderboardName}>{player.name}</Text>
                  <Text style={styles.leaderboardPoints}>{player.total_points}pts</Text>
                </View>
              ))}
              {topPlayers.length === 0 && (
                <Text style={styles.noPlayersText}>No games played yet</Text>
              )}
            </View>
          )}
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Game Name</Text>
          <TextInput
            style={styles.gameNameInput}
            value={gameName}
            onChangeText={setGameName}
            placeholder="Enter game session name (e.g., 'Friday Night Game')"
            placeholderTextColor="#9CA3AF"
          />
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Player Count</Text>
          <View style={styles.playerCountContainer}>
            <TouchableOpacity 
              style={styles.countButton}
              onPress={() => updatePlayerCount(playerCount - 1)}
            >
              <Minus size={20} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.playerCountText}>{playerCount}</Text>
            
            <TouchableOpacity 
              style={styles.countButton}
              onPress={() => updatePlayerCount(playerCount + 1)}
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.gameInfoRow}>
            <View style={styles.gameInfoItem}>
              <Text style={styles.gameInfoLabel}>Expected Rounds</Text>
              <Text style={styles.gameInfoValue}>{Math.ceil(playerCount * 0.6)}-{playerCount - 1}</Text>
            </View>
            <View style={styles.gameInfoItem}>
              <Text style={styles.gameInfoLabel}>Game Duration</Text>
              <Text style={styles.gameInfoValue}>{Math.ceil(playerCount * 2)}-{Math.ceil(playerCount * 3)}min</Text>
            </View>
          </View>
          
          <View style={styles.roleDistribution}>
            <View style={styles.roleCard}>
              <Text style={styles.roleEmoji}>👥</Text>
              <Text style={styles.roleName}>Civilians</Text>
              <Text style={styles.roleCount}>{roles.civilians}</Text>
            </View>
            <View style={[styles.roleCard, styles.adjustableRole]}>
              <Text style={styles.roleEmoji}>🕵️</Text>
              <Text style={styles.roleName}>Undercover</Text>
              <View style={styles.roleAdjuster}>
                <TouchableOpacity 
                  style={styles.roleButton}
                  onPress={() => updateRoleCount('undercover', -1)}
                >
                  <Minus size={12} color="white" />
                </TouchableOpacity>
                <Text style={styles.roleCount}>{roles.undercover}</Text>
                <TouchableOpacity 
                  style={styles.roleButton}
                  onPress={() => updateRoleCount('undercover', 1)}
                >
                  <Plus size={12} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.roleCard, styles.adjustableRole]}>
              <Text style={styles.roleEmoji}>❓</Text>
              <Text style={styles.roleName}>Mr. White</Text>
              <View style={styles.roleAdjuster}>
                <TouchableOpacity 
                  style={styles.roleButton}
                  onPress={() => updateRoleCount('mrWhite', -1)}
                >
                  <Minus size={12} color="white" />
                </TouchableOpacity>
                <Text style={styles.roleCount}>{roles.mrWhite}</Text>
                <TouchableOpacity 
                  style={styles.roleButton}
                  onPress={() => updateRoleCount('mrWhite', 1)}
                >
                  <Plus size={12} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
        {/* Special Roles Section */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Roles</Text>
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setUseSpecialRoles(!useSpecialRoles)}
            >
              {useSpecialRoles ? (
                <ToggleRight size={24} color="#8B5CF6" />
              ) : (
                <ToggleLeft size={24} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
          
          {useSpecialRoles && (
            <>
              <Text style={styles.sectionDescription}>
                Add chaos and strategy with special roles! {selectedSpecialRoles.length} selected.
              </Text>
              <TouchableOpacity
                style={styles.configureButton}
                onPress={() => setShowSpecialRolesModal(true)}
              >
                <Settings size={16} color="#8B5CF6" />
                <Text style={styles.configureButtonText}>Configure Special Roles</Text>
              </TouchableOpacity>
            </>
          )}
        </GlassCard>

      <TouchableOpacity 
        style={styles.startButton}
        onPress={startGameSetup}
        disabled={isCreatingGame}
      >
        <GlassButton
          title={isCreatingGame ? 'Creating Game...' : 'Setup Players'}
          onPress={startGameSetup}
          variant="primary"
          size="large"
          disabled={isCreatingGame}
          icon={<Play size={20} color="white" />}
        />
      </TouchableOpacity>

      {/* Player Names Modal */}
      <Modal
        visible={showPlayerNamesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#1F2937', '#111827']}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enter Player Names</Text>
            <TouchableOpacity onPress={() => setShowPlayerNamesModal(false)}>
              <X size={24} color="#F3F4F6" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Game: {gameName} • {playerCount} Players
            </Text>
            
            {playerNames.map((name, index) => (
              <View key={index} style={styles.playerInputContainer}>
                <Text style={styles.playerNumber}>P{index + 1}</Text>
                <TextInput
                  style={styles.playerInput}
                  value={name}
                  onChangeText={(text) => updatePlayerName(index, text)}
                  placeholder={`Player ${index + 1} name`}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity 
            style={styles.startGameButton}
            onPress={startGame}
            disabled={isCreatingGame}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.startButtonGradient}
            >
              <Users size={20} color="white" />
              <Text style={styles.startButtonText}>
                {isCreatingGame ? 'Creating Game...' : 'Start Game'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Modal>

      {/* Special Roles Configuration Modal */}
      <Modal
        visible={showSpecialRolesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#1F2937', '#111827']}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Special Roles</Text>
            <TouchableOpacity onPress={() => setShowSpecialRolesModal(false)}>
              <X size={24} color="#F3F4F6" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Select special roles to add chaos and strategy to your game!
            </Text>
            <Text style={styles.modalWarning}>
              Limit: {Math.floor(playerCount / 2)} special roles for {playerCount} players
            </Text>
            
            {availableSpecialRoles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.specialRoleCard,
                  selectedSpecialRoles.includes(role) && styles.selectedSpecialRoleCard
                ]}
                onPress={() => toggleSpecialRole(role)}
              >
                <View style={styles.specialRoleHeader}>
                  <Text style={styles.specialRoleEmoji}>
                    {GameService.getSpecialRoleEmoji(role)}
                  </Text>
                  <Text style={styles.specialRoleName}>
                    {role.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Text>
                  <View style={styles.specialRoleToggle}>
                    {selectedSpecialRoles.includes(role) ? (
                      <ToggleRight size={20} color="#8B5CF6" />
                    ) : (
                      <ToggleLeft size={20} color="#6B7280" />
                    )}
                  </View>
                </View>
                <Text style={styles.specialRoleDescription}>
                  {GameService.getSpecialRoleDescription(role)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 16,
  },
  playerCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  countButton: {
    backgroundColor: '#8B5CF6',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F3F4F6',
    minWidth: 60,
    textAlign: 'center',
  },
  roleDistribution: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  roleEmoji: {
    fontSize: 24,
  },
  roleName: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '500',
  },
  roleCount: {
    color: '#8B5CF6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  playerNumber: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: 'bold',
    width: 32,
  },
  playerInput: {
    flex: 1,
    backgroundColor: '#374151',
    color: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  startButton: {
    margin: 20,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  leaderboardPreview: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaderboardRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
    width: 24,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
    color: '#F3F4F6',
    fontWeight: '500',
  },
  leaderboardPoints: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  noPlayersText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  gameInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  gameInfoItem: {
    flex: 1,
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  gameInfoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  gameInfoValue: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: 'bold',
  },
  gameNameInput: {
    backgroundColor: '#374151',
    color: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
    lineHeight: 20,
  },
  toggleContainer: {
    padding: 4,
  },
  configureButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  configureButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  specialRoleCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  selectedSpecialRoleCard: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  specialRoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  specialRoleEmoji: {
    fontSize: 20,
  },
  specialRoleName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  specialRoleToggle: {
    padding: 4,
  },
  specialRoleDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  modalWarning: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  adjustableRole: {
    paddingVertical: 12,
  },
  roleAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleButton: {
    backgroundColor: '#8B5CF6',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalSubtitle: {
    fontSize: 16,
    color: '#8B5CF6',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  startGameButton: {
    margin: 20,
  },
});