import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Plus, Minus, Play, ArrowLeft, Users, X, Settings, ToggleLeft, ToggleRight, Crown, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { GameService } from '@/services/gameService';
import { useLeaderboard } from '@/hooks/useGameData';
import { SpecialRole } from '@/types/game';
import { AceternityCard } from '@/components/ui/aceternity-card';
import { AceternityButton } from '@/components/ui/aceternity-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/hooks/useTheme';

export default function GameSetupScreen() {
  const { theme, colors } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Game Setup</Text>
        <ThemeToggle />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Leaderboard Preview */}
        <AceternityCard variant="glass" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Crown size={20} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Players</Text>
          </View>
          {leaderboardLoading ? (
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
          ) : (
            <View style={styles.leaderboardPreview}>
              {topPlayers.slice(0, 3).map((player, index) => (
                <View key={player.id} style={styles.leaderboardItem}>
                  <View style={[
                    styles.rankBadge,
                    { backgroundColor: index === 0 ? colors.warning : index === 1 ? colors.info : colors.textSecondary }
                  ]}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <Text style={[styles.leaderboardName, { color: colors.text }]}>{player.name}</Text>
                  <Text style={[styles.leaderboardPoints, { color: colors.primary }]}>{player.total_points}pts</Text>
                </View>
              ))}
              {topPlayers.length === 0 && (
                <Text style={[styles.noPlayersText, { color: colors.textSecondary }]}>No games played yet</Text>
              )}
            </View>
          )}
        </AceternityCard>

        {/* Game Name */}
        <AceternityCard variant="spotlight" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Game Session Name</Text>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Session Name</Text>
            <View style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text
                style={[styles.textInputText, { color: colors.text }]}
                onPress={() => {
                  // Handle text input - you might want to use a proper TextInput here
                }}
              >
                {gameName || 'Enter game session name'}
              </Text>
            </View>
          </View>
        </AceternityCard>

        {/* Player Count */}
        <AceternityCard variant="border" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Players</Text>
          <View style={styles.playerCountContainer}>
            <TouchableOpacity 
              style={[styles.countButton, { backgroundColor: colors.primary }]}
              onPress={() => updatePlayerCount(playerCount - 1)}
            >
              <Minus size={20} color="white" />
            </TouchableOpacity>
            
            <View style={styles.playerCountDisplay}>
              <Text style={[styles.playerCountText, { color: colors.text }]}>{playerCount}</Text>
              <Text style={[styles.playerCountLabel, { color: colors.textSecondary }]}>Players</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.countButton, { backgroundColor: colors.primary }]}
              onPress={() => updatePlayerCount(playerCount + 1)}
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Game Info */}
          <View style={styles.gameInfoRow}>
            <View style={styles.gameInfoItem}>
              <Text style={[styles.gameInfoLabel, { color: colors.textSecondary }]}>Duration</Text>
              <Text style={[styles.gameInfoValue, { color: colors.accent }]}>{Math.ceil(playerCount * 2)}-{Math.ceil(playerCount * 3)}min</Text>
            </View>
            <View style={styles.gameInfoItem}>
              <Text style={[styles.gameInfoLabel, { color: colors.textSecondary }]}>Rounds</Text>
              <Text style={[styles.gameInfoValue, { color: colors.accent }]}>{Math.ceil(playerCount * 0.6)}-{playerCount - 1}</Text>
            </View>
          </View>
        </AceternityCard>

        {/* Role Distribution */}
        <AceternityCard variant="glass" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Role Distribution</Text>
          <View style={styles.roleDistribution}>
            <View style={styles.roleCard}>
              <Text style={styles.roleEmoji}>👥</Text>
              <Text style={[styles.roleName, { color: colors.text }]}>Civilians</Text>
              <View style={[styles.badge, { backgroundColor: colors.success }]}>
                <Text style={styles.badgeText}>{roles.civilians}</Text>
              </View>
            </View>
            
            <View style={styles.roleCard}>
              <Text style={styles.roleEmoji}>🕵️</Text>
              <Text style={[styles.roleName, { color: colors.text }]}>Undercover</Text>
              <View style={styles.roleAdjuster}>
                <TouchableOpacity 
                  style={[styles.roleButton, { backgroundColor: colors.primary }]}
                  onPress={() => updateRoleCount('undercover', -1)}
                >
                  <Minus size={12} color="white" />
                </TouchableOpacity>
                <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.badgeText}>{roles.undercover}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.roleButton, { backgroundColor: colors.primary }]}
                  onPress={() => updateRoleCount('undercover', 1)}
                >
                  <Plus size={12} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.roleCard}>
              <Text style={styles.roleEmoji}>❓</Text>
              <Text style={[styles.roleName, { color: colors.text }]}>Mr. White</Text>
              <View style={styles.roleAdjuster}>
                <TouchableOpacity 
                  style={[styles.roleButton, { backgroundColor: colors.primary }]}
                  onPress={() => updateRoleCount('mrWhite', -1)}
                >
                  <Minus size={12} color="white" />
                </TouchableOpacity>
                <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                  <Text style={styles.badgeText}>{roles.mrWhite}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.roleButton, { backgroundColor: colors.primary }]}
                  onPress={() => updateRoleCount('mrWhite', 1)}
                >
                  <Plus size={12} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </AceternityCard>

        {/* Special Roles */}
        <AceternityCard variant="glass" style={styles.section}>
          <View style={styles.specialRolesHeader}>
            <View style={styles.sectionHeader}>
              <Zap size={20} color="#f093fb" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Special Roles</Text>
            </View>
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setUseSpecialRoles(!useSpecialRoles)}
            >
              {useSpecialRoles ? (
                <ToggleRight size={28} color="#f093fb" />
              ) : (
                <ToggleLeft size={28} color="#11998e" />
              )}
            </TouchableOpacity>
          </View>
          
          {useSpecialRoles && (
            <>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Add chaos and strategy with special roles! {selectedSpecialRoles.length} selected.
              </Text>
              <AceternityButton
                variant="secondary"
                size="md"
                onPress={() => setShowSpecialRolesModal(true)}
                icon={<Settings size={16} color="#8B5CF6" />}
              >
                Configure Special Roles
              </AceternityButton>
            </>
          )}
        </AceternityCard>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.startButtonContainer}>
        <AceternityButton
          variant="shimmer"
          size="lg"
          onPress={startGameSetup}
          disabled={isCreatingGame}
          loading={isCreatingGame}
          icon={<Play size={20} color="white" />}
          style={styles.startButton}
        >
          {isCreatingGame ? 'Creating Game...' : 'Setup Players'}
        </AceternityButton>
      </View>

      {/* Player Names Modal */}
      <Modal
        visible={showPlayerNamesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Enter Player Names</Text>
            <TouchableOpacity onPress={() => setShowPlayerNamesModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalSubtitle, { color: colors.primary }]}>
              Game: {gameName} • {playerCount} Players
            </Text>
            
            {playerNames.map((name, index) => (
              <View key={index} style={styles.playerInputContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Player {index + 1}</Text>
                <View style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text
                    style={[styles.textInputText, { color: colors.text }]}
                    onPress={() => {
                      // Handle text input - you might want to use a proper TextInput here
                    }}
                  >
                    {name || `Enter player ${index + 1} name`}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalButtonContainer}>
            <AceternityButton
              variant="primary"
              size="lg"
              onPress={startGame}
              disabled={isCreatingGame}
              icon={<Users size={20} color="white" />}
            >
              {isCreatingGame ? 'Creating Game...' : 'Start Game'}
            </AceternityButton>
          </View>
        </View>
      </Modal>

      {/* Special Roles Modal */}
      <Modal
        visible={showSpecialRolesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Special Roles</Text>
            <TouchableOpacity onPress={() => setShowSpecialRolesModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalSubtitle, { color: colors.primary }]}>
              Select special roles to add chaos and strategy!
            </Text>
            <Text style={[styles.modalWarning, { color: colors.warning }]}>
              Limit: {Math.floor(playerCount / 2)} special roles for {playerCount} players
            </Text>
            
            {availableSpecialRoles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.specialRoleCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedSpecialRoles.includes(role) && { borderColor: colors.primary }
                ]}
                onPress={() => toggleSpecialRole(role)}
              >
                <View style={styles.specialRoleHeader}>
                  <Text style={styles.specialRoleEmoji}>
                    {GameService.getSpecialRoleEmoji(role)}
                  </Text>
                  <Text style={[styles.specialRoleName, { color: colors.text }]}>
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
                <Text style={[styles.specialRoleDescription, { color: colors.textSecondary }]}>
                  {GameService.getSpecialRoleDescription(role)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  textInputText: {
    fontSize: 16,
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
  },
  playerCountLabel: {
    fontSize: 14,
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
  },
  gameInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  leaderboardPoints: {
    fontSize: 12,
    fontWeight: '600',
  },
  noPlayersText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 14,
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
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  modalWarning: {
    fontSize: 12,
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  specialRoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  specialRoleEmoji: {
    fontSize: 20,
  },
  specialRoleName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  specialRoleToggle: {
    padding: 4,
  },
  specialRoleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});