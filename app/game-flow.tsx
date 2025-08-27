import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Eye, EyeOff, ArrowRight, Users, Trophy, RotateCcw, Timer, MessageCircle, SkipForward, Zap, Vote, Clock } from 'lucide-react-native';
import { useGameFlowManager } from '@/hooks/useGameFlowManager';
import { ModernCard } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernInput } from '@/components/ui/modern-input';
import { ModernBadge } from '@/components/ui/modern-badge';

export default function GameFlow() {
  const params = useLocalSearchParams();
  const [gameState, gameActions] = useGameFlowManager();

  const {
    players,
    currentPhase,
    currentRound,
    wordPair,
    gameWinner,
    eliminatedPlayer,
    votingResults,
    individualVotes,
    currentVoterIndex,
    isProcessingVotes,
    mrWhiteGuess,
    showMrWhiteGuess,
  } = gameState;

  // Initialize game on mount
  useEffect(() => {
    gameActions.initializeGame(params);
  }, []);

  // Helper functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'civilian': return '#38a169';
      case 'undercover': return '#e53e3e';
      case 'mrwhite': return '#d69e2e';
      default: return '#4a5568';
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

  const getVotingPlayers = () => players.filter(p => p.isAlive || p.canVote);
  const getAlivePlayers = () => players.filter(p => p.isAlive);
  const getCurrentVoter = () => {
    const votingPlayers = getVotingPlayers();
    return votingPlayers[currentVoterIndex] || null;
  };

  // Phase handlers
  const [currentPlayerIndex, setCurrentPlayerIndex] = React.useState(0);
  const [wordRevealed, setWordRevealed] = React.useState(false);

  const nextWordDistribution = () => {
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setWordRevealed(false);
    } else {
      gameActions.advancePhase('description');
    }
  };

  const handleVote = async (targetId: string) => {
    try {
      const currentVoter = getCurrentVoter();
      if (!currentVoter) return;
      
      await gameActions.processVote(currentVoter.id, targetId);
    } catch (error) {
      Alert.alert('Error', 'Failed to process vote. Please try again.');
      console.error('Vote error:', error);
    }
  };

  const handleMrWhiteGuess = async () => {
    if (!mrWhiteGuess.trim()) {
      Alert.alert('Error', 'Please enter a guess');
      return;
    }

    try {
      await gameActions.processMrWhiteGuess(mrWhiteGuess);
    } catch (error) {
      Alert.alert('Error', 'Failed to process guess. Please try again.');
      console.error('Mr White guess error:', error);
    }
  };

  const handleSkipGuess = async () => {
    try {
      await gameActions.skipMrWhiteGuess();
    } catch (error) {
      Alert.alert('Error', 'Failed to skip guess. Please try again.');
      console.error('Skip guess error:', error);
    }
  };

  // Render voting phase
  if (currentPhase === 'voting') {
    const votingPlayers = getVotingPlayers();
    const alivePlayers = getAlivePlayers();
    const currentVoter = getCurrentVoter();
    const votedCount = Object.keys(individualVotes).length;
    const totalVoters = votingPlayers.length;

    if (isProcessingVotes) {
      return (
        <LinearGradient colors={['#0f0f23', '#1a1a2e']} style={styles.container}>
          <View style={styles.header}>
            <Vote size={24} color="#667eea" />
            <Text style={styles.title}>Processing Votes...</Text>
            <Text style={styles.subtitle}>Round {currentRound}</Text>
          </View>

          <View style={styles.centerContent}>
            <ModernCard variant="glass" style={styles.processingCard}>
              <Clock size={32} color="#667eea" />
              <Text style={styles.processingText}>Counting votes and determining elimination...</Text>
            </ModernCard>
          </View>
        </LinearGradient>
      );
    }

    if (!currentVoter) {
      return (
        <LinearGradient colors={['#0f0f23', '#1a1a2e']} style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Voting Complete</Text>
            <Text style={styles.subtitle}>Round {currentRound}</Text>
          </View>
        </LinearGradient>
      );
    }

    return (
      <LinearGradient colors={['#0f0f23', '#1a1a2e']} style={styles.container}>
        <View style={styles.header}>
          <Vote size={24} color="#667eea" />
          <Text style={styles.title}>Voting Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.votingProgress}>
          <Text style={styles.progressText}>
            {votedCount} / {totalVoters} players have voted
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(votedCount / totalVoters) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <ModernCard variant="glass" style={styles.currentVoterCard}>
          <Text style={styles.currentVoterLabel}>Current Voter:</Text>
          <Text style={styles.currentVoterName}>{currentVoter.name}</Text>
          {currentVoter.specialRole && (
            <ModernBadge variant="warning" gradient>
              ⚡ {currentVoter.specialRole.replace('-', ' ').toUpperCase()}
            </ModernBadge>
          )}
          <Text style={styles.votingInstructions}>
            Choose who you think should be eliminated
          </Text>
        </ModernCard>

        <ScrollView style={styles.playersContainer}>
          <Text style={styles.sectionTitle}>Vote to Eliminate:</Text>
          {alivePlayers.filter(player => player.id !== currentVoter.id).map((player) => {
            const voteCount = votingResults[player.id] || 0;
            const maxVotes = Math.max(...Object.values(votingResults));
            const hasMostVotes = voteCount > 0 && voteCount === maxVotes;
            
            return (
              <TouchableOpacity
                key={player.id}
                style={[
                  styles.playerCard,
                  hasMostVotes && styles.mostVotedPlayerCard
                ]}
                onPress={() => handleVote(player.id)}
              >
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                </View>
                
                <View style={styles.voteInfo}>
                  {voteCount > 0 && (
                    <ModernBadge variant="destructive" size="sm">
                      {voteCount}
                    </ModernBadge>
                  )}
                  <Text style={styles.tapToVoteText}>Tap to vote</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {votedCount > 0 && (
          <ModernCard variant="elevated" style={styles.votingSummary}>
            <Text style={styles.summaryTitle}>Current Votes:</Text>
            <View style={styles.summaryList}>
              {Object.entries(votingResults)
                .sort(([,a], [,b]) => b - a)
                .map(([playerId, count]) => {
                  const player = players.find(p => p.id === playerId);
                  return player ? (
                    <View key={playerId} style={styles.summaryItem}>
                      <Text style={styles.summaryPlayerName}>{player.name}</Text>
                      <ModernBadge variant="info" size="sm">
                        {count} vote{count !== 1 ? 's' : ''}
                      </ModernBadge>
                    </View>
                  ) : null;
                })}
            </View>
          </ModernCard>
        )}
      </LinearGradient>
    );
  }

  // Word distribution phase
  if (currentPhase === 'word-distribution') {
    const currentPlayer = players[currentPlayerIndex];
    
    return (
      <LinearGradient colors={['#0f0f23', '#1a1a2e']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Word Distribution</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <ModernCard variant="glass" style={styles.wordDistributionCard}>
            <Text style={styles.passPhoneText}>Pass the phone to:</Text>
            <Text style={styles.currentPlayerName}>{currentPlayer?.name}</Text>
            
            {!wordRevealed ? (
              <ModernButton
                variant="primary"
                size="lg"
                onPress={() => setWordRevealed(true)}
                icon={<Eye size={24} color="white" />}
              >
                Tap to See Your Word
              </ModernButton>
            ) : (
              <View style={styles.wordRevealContainer}>
                {currentPlayer?.word ? (
                  <>
                    <Text style={styles.wordText}>{currentPlayer.word}</Text>
                    <Text style={styles.wordHint}>
                      {currentPlayer.specialRole === 'mr-meme' 
                        ? '🤡 You are Mr. Meme! You can only mime and gesture - no verbal clues!'
                        : 'Describe this word without saying it directly'
                      }
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.noWordText}>You are Mr. White</Text>
                    <Text style={styles.mrWhiteHint}>
                      Listen carefully and try to deduce the word!
                    </Text>
                  </>
                )}
                
                {currentPlayer?.specialRole && (
                  <ModernBadge variant="warning" gradient>
                    <Zap size={16} color="#FFFFFF" />
                    Special Role: {currentPlayer.specialRole.replace('-', ' ')}
                  </ModernBadge>
                )}
                
                <ModernButton
                  variant="success"
                  size="lg"
                  onPress={nextWordDistribution}
                  icon={<ArrowRight size={16} color="white" />}
                >
                  {currentPlayerIndex < players.length - 1 ? 'Next Player' : 'Start Game'}
                </ModernButton>
              </View>
            )}
          </ModernCard>
        </View>
      </LinearGradient>
    );
  }

  // Description phase
  if (currentPhase === 'description') {
    const alivePlayers = getAlivePlayers();
    
    return (
      <LinearGradient colors={['#0f0f23', '#1a1a2e']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Description Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <ModernCard variant="glass" style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Description Order:</Text>
            <View style={styles.descriptionOrderList}>
              {alivePlayers.map((player, index) => (
                <View key={player.id} style={styles.descriptionOrderItem}>
                  <ModernBadge variant="primary" size="sm">
                    {index + 1}
                  </ModernBadge>
                  <Text style={styles.descriptionOrderText}>
                    {player.name}
                  </Text>
                </View>
              ))}
            </View>
            
            <Text style={styles.descriptionHint}>
              Each player describes their word in one sentence following this order
            </Text>

            <ModernButton 
              variant="primary" 
              size="lg" 
              onPress={() => gameActions.advancePhase('discussion')}
              icon={<ArrowRight size={16} color="white" />}
            >
              Start Discussion
            </ModernButton>
          </ModernCard>
        </View>
      </LinearGradient>
    );
  }

  // Discussion phase
  if (currentPhase === 'discussion') {
    return (
      <LinearGradient colors={['#0f0f23', '#1a1a2e']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Discussion Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <ModernCard variant="glass" style={styles.discussionCard}>
            <View style={styles.discussionHeader}>
              <MessageCircle size={20} color="#667eea" />
              <Text style={styles.discussionTitle}>Discussion Time</Text>
            </View>
            
            <View style={styles.discussionPoints}>
              <Text style={styles.discussionText}>💭 Analyze each player's description</Text>
              <Text style={styles.discussionText}>🔍 Look for inconsistencies or vague answers</Text>
              <Text style={styles.discussionText}>🤔 Decide who seems most suspicious</Text>
            </View>
          </ModernCard>

          <ModernButton 
            variant="destructive" 
            size="xl" 
            onPress={() => gameActions.advancePhase('voting')}
            icon={<Vote size={20} color="white" />}
          >
            Start Voting
          </ModernButton>
        </View>
      </LinearGradient>
    );
  }

  // Mr. White guess phase
  if (currentPhase === 'mr-white-guess' || showMrWhiteGuess) {
    return (
      <LinearGradient colors={['#0f0f23', '#1a1a2e']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mr. White's Last Chance</Text>
          <Text style={styles.subtitle}>{eliminatedPlayer?.name} was eliminated</Text>
        </View>

        <View style={styles.centerContent}>
          <ModernCard variant="glass" style={styles.guessCard}>
            <Text style={styles.mrWhiteGuessInstructions}>
              As Mr. White, you can win by correctly guessing the Civilian word!
            </Text>
            
            <ModernInput
              label="What is the Civilian word?"
              value={mrWhiteGuess}
              onChangeText={(text) => gameState.mrWhiteGuess = text}
              placeholder="Enter your guess..."
              variant="glass"
            />
            
            <View style={styles.guessButtonsContainer}>
              <ModernButton
                variant="success"
                size="lg"
                onPress={handleMrWhiteGuess}
                disabled={!mrWhiteGuess.trim()}
              >
                Submit Guess
              </ModernButton>
              
              <ModernButton 
                variant="ghost" 
                size="lg" 
                onPress={handleSkipGuess}
                icon={<SkipForward size={16} color="#667eea" />}
              >
                Skip Guess
              </ModernButton>
            </View>
          </ModernCard>
        </View>
      </LinearGradient>
    );
  }

  // Final results
  if (currentPhase === 'final-results') {
    return (
      <LinearGradient colors={['#0f0f23', '#1a1a2e']} style={styles.container}>
        <View style={styles.header}>
          <Trophy size={32} color="#d69e2e" />
          <Text style={styles.title}>Game Over</Text>
        </View>

        <ScrollView style={styles.finalResultsContainer}>
          <ModernCard variant="gradient" style={styles.winnerCard}>
            <Text style={styles.winnerText}>{gameWinner} Win!</Text>
          </ModernCard>
          
          {wordPair && (
            <ModernCard variant="glass" style={styles.wordRevealCard}>
              <Text style={styles.wordRevealTitle}>The Words Were:</Text>
              <Text style={styles.wordRevealText}>👥 Civilians: "{wordPair.civilian_word}"</Text>
              <Text style={styles.wordRevealText}>🕵️ Undercover: "{wordPair.undercover_word}"</Text>
              <ModernBadge variant="info" gradient>
                Category: {wordPair.category}
              </ModernBadge>
            </ModernCard>
          )}
          
          <View style={styles.playersResultsList}>
            {players.map((player) => (
              <ModernCard key={player.id} variant="elevated" style={styles.playerResultCard}>
                <View style={styles.playerResultInfo}>
                  <Text style={styles.playerResultName}>{player.name}</Text>
                  <Text style={[styles.playerResultRole, { color: getRoleColor(player.role) }]}>
                    {getRoleEmoji(player.role)} {getRoleName(player.role)}
                  </Text>
                  {player.word ? (
                    <Text style={styles.playerResultWord}>"{player.word}"</Text>
                  ) : (
                    <Text style={styles.playerResultWord}>No word assigned</Text>
                  )}
                  {player.eliminationRound && (
                    <ModernBadge variant="secondary" size="sm">
                      Eliminated Round {player.eliminationRound}
                    </ModernBadge>
                  )}
                </View>
                <ModernBadge variant="warning" gradient size="lg">
                  +{player.points}
                </ModernBadge>
              </ModernCard>
            ))}
          </View>
        </ScrollView>

        <View style={styles.finalButtonsContainer}>
          <ModernButton 
            variant="primary" 
            size="lg" 
            onPress={() => router.back()}
            icon={<RotateCcw size={16} color="white" />}
          >
            New Game
          </ModernButton>
          
          <ModernButton 
            variant="secondary" 
            size="lg" 
            onPress={() => router.back()}
          >
            Back to Menu
          </ModernButton>
        </View>
      </LinearGradient>
    );
  }

  return <View />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0AEC0',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  wordDistributionCard: {
    alignItems: 'center',
    gap: 24,
    minWidth: 320,
  },
  passPhoneText: {
    fontSize: 18,
    color: '#CBD5E0',
    marginBottom: 8,
  },
  currentPlayerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 16,
  },
  wordRevealContainer: {
    alignItems: 'center',
    gap: 20,
  },
  wordText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  wordHint: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  noWordText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d69e2e',
    textAlign: 'center',
  },
  mrWhiteHint: {
    fontSize: 14,
    color: '#d69e2e',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  descriptionCard: {
    alignItems: 'center',
    gap: 24,
    minWidth: 320,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  descriptionOrderList: {
    gap: 12,
    width: '100%',
  },
  descriptionOrderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  descriptionOrderText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  descriptionHint: {
    fontSize: 14,
    color: '#667eea',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  discussionCard: {
    gap: 24,
    marginBottom: 32,
  },
  discussionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  discussionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  discussionPoints: {
    gap: 16,
  },
  discussionText: {
    fontSize: 16,
    color: '#CBD5E0',
    lineHeight: 24,
  },
  votingProgress: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    color: '#CBD5E0',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2d3748',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  currentVoterCard: {
    alignItems: 'center',
    gap: 12,
    margin: 24,
  },
  currentVoterLabel: {
    fontSize: 14,
    color: '#A0AEC0',
  },
  currentVoterName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  votingInstructions: {
    fontSize: 14,
    color: '#CBD5E0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  playersContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mostVotedPlayerCard: {
    borderColor: '#e53e3e',
    backgroundColor: 'rgba(229, 62, 62, 0.1)',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  voteInfo: {
    alignItems: 'center',
    gap: 8,
  },
  tapToVoteText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  votingSummary: {
    margin: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryList: {
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryPlayerName: {
    fontSize: 14,
    color: '#CBD5E0',
  },
  processingCard: {
    alignItems: 'center',
    gap: 20,
  },
  processingText: {
    fontSize: 16,
    color: '#CBD5E0',
    textAlign: 'center',
  },
  guessCard: {
    gap: 24,
    minWidth: 320,
  },
  mrWhiteGuessInstructions: {
    fontSize: 18,
    color: '#d69e2e',
    textAlign: 'center',
    lineHeight: 24,
  },
  guessButtonsContainer: {
    gap: 16,
  },
  finalResultsContainer: {
    flex: 1,
    padding: 24,
  },
  winnerCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  winnerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  wordRevealCard: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  wordRevealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 8,
  },
  wordRevealText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  playersResultsList: {
    gap: 16,
  },
  playerResultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerResultInfo: {
    flex: 1,
    gap: 8,
  },
  playerResultName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerResultRole: {
    fontSize: 14,
    fontWeight: '600',
  },
  playerResultWord: {
    fontSize: 12,
    color: '#A0AEC0',
    fontStyle: 'italic',
  },
  finalButtonsContainer: {
    padding: 24,
    gap: 16,
  },
});