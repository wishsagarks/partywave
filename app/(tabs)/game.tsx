import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { Plus, Minus, Play, ArrowLeft, Users, X, Settings, ToggleLeft, ToggleRight, Crown, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { GameService } from '@/services/gameService';
import { useLeaderboard } from '@/hooks/useGameData';
import { SpecialRole } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
    const newNames = Array(playerCount).fill('');
    setPlayerNames(newNames);
  }, [playerCount]);

  const toggleSpecialRole = (role: SpecialRole) => {
    setSelectedSpecialRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
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
    setCustomRoles(null);
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
    
    newRoles.civilians = playerCount - newRoles.undercover - newRoles.mrWhite;
    
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
    const hasEmptyNames = playerNames.some(name => name.trim() === '');
    if (hasEmptyNames) {
      Alert.alert('Missing Names', 'Please enter names for all players before starting the game.');
      return;
    }

    const uniqueNames = new Set(playerNames.map(name => name.trim().toLowerCase()));
    if (uniqueNames.size !== playerNames.length) {
      Alert.alert('Duplicate Names', 'Please ensure all player names are unique.');
      return;
    }

    try {
      setIsCreatingGame(true);
      
      const playerIds = await Promise.all(
        playerNames.map(name => GameService.createOrUpdatePlayer(name.trim()))
      );
      
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0C29', '#24243e', '#302B63', '#8B5CF6']}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Game Setup</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Leaderboard Preview */}
        <Card variant="glass" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Crown size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Top Players</Text>
          </View>
          {leaderboardLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            <View style={styles.leaderboardPreview}>
              {topPlayers.slice(0, 3).map((player, index) => (
                <View key={player.id} style={styles.leaderboardItem}>
                  <Badge variant={index === 0 ? 'warning' : index === 1 ? 'secondary' : 'default'}>
                    #{index + 1}
                  </Badge>
                  <Text style={styles.leaderboardName}>{player.name}</Text>
                  <Text style={styles.leaderboardPoints}>{player.total_points}pts</Text>
                </View>
              ))}
              {topPlayers.length === 0 && (
                <Text style={styles.noPlayersText}>No games played yet</Text>
              )}
            </View>
          )}
        </Card>

        {/* Game Name */}
        <Card variant="glass" style={styles.section}>
          <Text style={styles.sectionTitle}>Game Session Name</Text>
          <Input
            value={gameName}
            onChangeText={setGameName}
            placeholder="Enter game session name (e.g., 'Friday Night Game')"
            style={styles.gameNameInput}
          />
        </Card>

        {/* Player Count */}
        <Card variant="glass" style={styles.section}>
          <Text style={styles.sectionTitle}>Players</Text>
          <View style={styles.playerCountContainer}>
            <TouchableOpacity 
              style={styles.countButton}
              onPress={() => updatePlayerCount(playerCount - 1)}
            >
              <Minus size={20} color="white" />
            </TouchableOpacity>
            
            <View style={styles.playerCountDisplay}>
              <Text style={styles.playerCountText}>{playerCount}</Text>
              <Text style={styles.playerCountLabel}>Players</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.countButton}
              onPress={() => updatePlayerCount(playerCount + 1)}
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Game Info */}
          <View style={styles.gameInfoRow}>
            <View style={styles.gameInfoItem}>
              <Text style={styles.gameInfoLabel}>Duration</Text>
              <Text style={styles.gameInfoValue}>{Math.ceil(playerCount * 2)}-{Math.ceil(playerCount * 3)}min</Text>
            </View>
            <View style={styles.gameInfoItem}>
              <Text style={styles.gameInfoLabel}>Rounds</Text>
              <Text style={styles.gameInfoValue}>{Math.ceil(playerCount * 0.6)}-{playerCount - 1}</Text>
            </View>
          </View>
        </Card>

        {/* Role Distribution */}
        <Card variant="glass" style={styles.section}>
          <Text style={styles.sectionTitle}>Role Distribution</Text>
          <View style={styles.roleDistribution}>
            <View style={styles.roleCard}>
              <Text style={styles.roleEmoji}>👥</Text>
              <Text style={styles.roleName}>Civilians</Text>
              <Badge variant="success">{roles.civilians}</Badge>
            </View>
            
            <View style={styles.roleCard}>
              <Text style={styles.roleEmoji}>🕵️</Text>
              <Text style={styles.roleName}>Undercover</Text>
              <View style={styles.roleAdjuster}>
                <TouchableOpacity 
                  style={styles.roleButton}
                  onPress={() => updateRoleCount('undercover', -1)}
                >
                  <Minus size={12} color="white" />
                </TouchableOpacity>
                <Badge variant="destructive">{roles.undercover}</Badge>
                <TouchableOpacity 
                  style={styles.roleButton}
                  onPress={() => updateRoleCount('undercover', 1)}
                >
                  <Plus size={12} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.roleCard}>
              <Text style={styles.roleEmoji}>❓</Text>
              <Text style={styles.roleName}>Mr. White</Text>
              <View style={styles.roleAdjuster}>
                <TouchableOpacity 
                  style={styles.roleButton}
                  onPress={() => updateRoleCount('mrWhite', -1)}
                >
                  <Minus size={12} color="white" />
                </TouchableOpacity>
                <Badge variant="warning">{roles.mrWhite}</Badge>
                <TouchableOpacity 
                  style={styles.roleButton}
                  onPress={() => updateRoleCount('mrWhite', 1)}
                >
                  <Plus size={12} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Card>

        {/* Special Roles */}
        <Card variant="glass" style={styles.section}>
          <View style={styles.specialRolesHeader}>
            <View style={styles.sectionHeader}>
              <Zap size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Special Roles</Text>
            </View>
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setUseSpecialRoles(!useSpecialRoles)}
            >
              {useSpecialRoles ? (
                <ToggleRight size={28} color="#8B5CF6" />
              ) : (
                <ToggleLeft size={28} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
          
          {useSpecialRoles && (
            <>
              <Text style={styles.sectionDescription}>
                Add chaos and strategy with special roles! {selectedSpecialRoles.length} selected.
              </Text>
              <Button
                variant="secondary"
                size="md"
                onPress={() => setShowSpecialRolesModal(true)}
                icon={<Settings size={16} color="#8B5CF6" />}
              >
                Configure Special Roles
              </Button>
            </>
          )}
        </Card>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.startButtonContainer}>
        <Button
          variant="primary"
          size="lg"
          onPress={startGameSetup}
          disabled={isCreatingGame}
          icon={<Play size={20} color="white" />}
          style={styles.startButton}
        >
          {isCreatingGame ? 'Creating Game...' : 'Setup Players'}
        </Button>
      </View>

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
              <Input
                key={index}
                label={`Player ${index + 1}`}
                value={name}
                onChangeText={(text) => updatePlayerName(index, text)}
                placeholder={`Enter player ${index + 1} name`}
                containerStyle={styles.playerInputContainer}
              />
            ))}
          </ScrollView>

          <View style={styles.modalButtonContainer}>
            <Button
              variant="primary"
              size="lg"
              onPress={startGame}
              disabled={isCreatingGame}
              icon={<Users size={20} color="white" />}
            >
              {isCreatingGame ? 'Creating Game...' : 'Start Game'}
            </Button>
          </View>
        </LinearGradient>
      </Modal>

      {/* Special Roles Modal */}
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
              Select special roles to add chaos and strategy!
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 16,
    lineHeight: 20,
  },
  gameNameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playerCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 24,
  },
  countButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCountDisplay: {
    alignItems: 'center',
    gap: 4,
  },
  playerCountText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerCountLabel: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  gameInfoRow: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
  },
  gameInfoItem: {
    alignItems: 'center',
    gap: 4,
  },
  gameInfoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  gameInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  roleDistribution: {
    gap: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  roleEmoji: {
    fontSize: 24,
  },
  roleName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  roleAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialRolesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleContainer: {
    padding: 4,
  },
  startButtonContainer: {
    padding: 20,
  },
  startButton: {
    width: '100%',
  },
  leaderboardPreview: {
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
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
  modalWarning: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  playerInputContainer: {
    marginBottom: 12,
  },
  modalButtonContainer: {
    padding: 20,
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
});