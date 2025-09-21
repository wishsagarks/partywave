// app/game-flow.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Eye, ArrowRight, Trophy, RotateCcw, MessageCircle, SkipForward, Vote, Clock } from 'lucide-react-native';
import { useGameFlowManager } from '@/hooks/useGameFlowManager';
import ModernCard from '@/components/ui/modern-card';
import ModernButton from '@/components/ui/modern-button';
import ModernInput from '@/components/ui/modern-input';
import ModernBadge from '@/components/ui/modern-badge';

export default function GameFlow() {
  const params = useLocalSearchParams();
  const [gameState, gameActions] = useGameFlowManager();

  const {
    players = [],
    currentPhase,
    currentRound = 1,
    wordPair,
    gameWinner,
    eliminatedPlayer,
    eliminationHistory = [],
    votingResults = {},
    individualVotes = {},
    currentVoterIndex = 0,
    isProcessingVotes,
    mrWhiteGuess,
    descriptionOrder = [],
  } = gameState || {};

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [wordRevealed, setWordRevealed] = useState(false);

  useEffect(() => {
    if (gameActions && typeof gameActions.initializeGame === 'function') {
      gameActions.initializeGame(params).catch(e => console.warn('init failed', e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAlivePlayers = () => players.filter(p => p.isAlive);
  const getVotingPlayers = () => players.filter(p => p.isAlive);
  const getCurrentVoter = () => {
    const votingPlayers = getVotingPlayers();
    return votingPlayers[currentVoterIndex] || null;
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

  // description order derived from gameState.descriptionOrder (fallback to alive players)
  const orderedPlayers = useMemo(() => {
    if (Array.isArray(descriptionOrder) && descriptionOrder.length > 0) {
      return descriptionOrder.map((id: string) => players.find(p => p.id === id)).filter(Boolean) as any[];
    }
    return getAlivePlayers();
  }, [descriptionOrder, players]);

  // helpers
  const handleVote = async (targetId: string) => {
    try {
      const currentVoter = getCurrentVoter();
      if (!currentVoter) {
        Alert.alert('No current voter', 'Voting has been paused — start voting again.');
        return;
      }
      await gameActions.processVote(currentVoter.id, targetId);
    } catch (err) {
      Alert.alert('Vote failed', String(err));
      console.error(err);
    }
  };

  const handleMrWhiteGuess = async () => {
    const guess = (mrWhiteGuess ?? '').toString().trim();
    if (!guess) {
      Alert.alert('Please enter a guess');
      return;
    }
    try {
      await gameActions.processMrWhiteGuess(guess);
    } catch (err) {
      Alert.alert('Guess failed', 'Try again');
      console.error(err);
    }
  };

  const handleSkipGuess = async () => {
    try {
      await gameActions.skipMrWhiteGuess();
    } catch (err) {
      Alert.alert('Skip failed', 'Try again');
      console.error(err);
    }
  };

  // Render Voting Phase
  if (currentPhase === 'voting') {
    const votingPlayers = getVotingPlayers();
    const alivePlayers = getAlivePlayers();
    const currentVoter = getCurrentVoter();
    const votedCount = Object.keys(individualVotes || {}).length;
    const totalVoters = Math.max(1, votingPlayers.length);

    if (isProcessingVotes) {
      return (
        <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.container}>
          <View style={styles.header}>
            <Vote size={24} color="#FFFFFF" />
            <Text style={styles.title}>Processing Votes...</Text>
            <Text style={styles.subtitle}>Round {currentRound}</Text>
          </View>

          <View style={styles.centerContent}>
            <ModernCard variant="glass" style={styles.processingCard}>
              <Clock size={32} color="#f093fb" />
              <Text style={styles.processingText}>Counting votes and determining elimination...</Text>
            </ModernCard>
          </View>
        </LinearGradient>
      );
    }

    // If there's no currentVoter (e.g. tie reset), show Re-vote / Start Voting controls
    if (!currentVoter) {
      return (
        <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Voting Paused</Text>
            <Text style={styles.subtitle}>Round {currentRound}</Text>
          </View>

          <View style={styles.centerContent}>
            <ModernCard variant="glass" style={styles.processingCard}>
              <Text style={styles.processingText}>Voting has been paused due to a tie or reset.</Text>
              <View style={{ marginTop: 12 }}>
                <ModernButton variant="primary" size="lg" onPress={() => gameActions.advancePhase('voting')}>
                  Start Voting
                </ModernButton>
              </View>
              <View style={{ marginTop: 8 }}>
                <ModernButton variant="ghost" size="lg" onPress={() => gameActions.advancePhase('discussion')}>
                  Back to Discussion
                </ModernButton>
              </View>
            </ModernCard>
          </View>
        </LinearGradient>
      );
    }

    return (
      <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.container}>
        <View style={styles.header}>
          <Vote size={24} color="#FFFFFF" />
          <Text style={styles.title}>Voting Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.votingProgress}>
          <Text style={styles.progressText}>
            {votedCount} / {totalVoters} players have voted
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(votedCount / totalVoters) * 100}%` }]} />
          </View>
        </View>

        <ModernCard variant="glass" style={styles.currentVoterCard}>
          <Text style={styles.currentVoterLabel}>Current Voter:</Text>
          <Text style={styles.currentVoterName}>{currentVoter.name}</Text>
          {currentVoter.specialRole && (
            <ModernBadge variant="warning">
              {`⚡ ${String(currentVoter.specialRole).replace('-', ' ').toUpperCase()}`}
            </ModernBadge>
          )}
          <Text style={styles.votingInstructions}>
            Choose who you think should be eliminated
          </Text>
        </ModernCard>

        <ScrollView style={styles.playersContainer}>
          <Text style={styles.sectionTitle}>Vote to Eliminate:</Text>
          {alivePlayers.filter(p => p.id !== currentVoter.id).map(player => {
            const voteCount = votingResults[player.id] || 0;
            const maxVotes = Math.max(0, ...Object.values(votingResults || {}));
            const hasMostVotes = voteCount > 0 && voteCount === maxVotes;
            return (
              <TouchableOpacity
                key={player.id}
                style={[styles.playerCard, hasMostVotes && styles.mostVotedPlayerCard]}
                onPress={() => handleVote(player.id)}
              >
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                </View>

                <View style={styles.voteInfo}>
                  {voteCount > 0 && <ModernBadge variant="destructive">{String(voteCount)}</ModernBadge>}
                  <Text style={styles.tapToVoteText}>Tap to vote</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>
    );
  }

  // Word distribution
  if (currentPhase === 'word-distribution') {
    const currentPlayer = players[currentPlayerIndex];
    return (
      <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Word Distribution</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <ModernCard variant="glass" style={styles.wordDistributionCard}>
            <Text style={styles.passPhoneText}>Pass the phone to:</Text>
            <Text style={styles.currentPlayerName}>{currentPlayer?.name}</Text>

            {!wordRevealed ? (
              <ModernButton variant="primary" size="lg" onPress={() => setWordRevealed(true)} icon={<Eye size={24} color="white" />}>
                Tap to See Your Word
              </ModernButton>
            ) : (
              <View style={styles.wordRevealContainer}>
                {currentPlayer?.word ? (
                  <>
                    <Text style={styles.wordText}>{currentPlayer.word}</Text>
                    <Text style={styles.wordHint}>
                      {currentPlayer.specialRole === 'mr-meme' ? '🤡 You are Mr. Meme! Mime only' : 'Describe this word without saying it directly'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.noWordText}>You are Mr. White</Text>
                    <Text style={styles.mrWhiteHint}>Try to deduce the word</Text>
                  </>
                )}

                {currentPlayer?.specialRole && <ModernBadge variant="warning">{`Special: ${currentPlayer.specialRole}`}</ModernBadge>}

                <ModernButton
                  variant="success"
                  size="lg"
                  onPress={() => {
                    if (currentPlayerIndex < players.length - 1) {
                      setCurrentPlayerIndex(currentPlayerIndex + 1);
                      setWordRevealed(false);
                    } else {
                      setCurrentPlayerIndex(0);
                      setWordRevealed(false);
                      gameActions.advancePhase('description');
                    }
                  }}
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

  // Description
  if (currentPhase === 'description') {
    return (
      <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Description Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <ModernCard variant="glass" style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Description Order:</Text>
            <View style={styles.descriptionOrderList}>
              {orderedPlayers.map((player, idx) => (
                <View key={player.id} style={styles.descriptionOrderItem}>
                  <ModernBadge variant="primary">{String(idx + 1)}</ModernBadge>
                  <Text style={styles.descriptionOrderText}>{player.name}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.descriptionHint}>Each player describes their word in one sentence following this order</Text>

            <ModernButton variant="primary" size="lg" onPress={() => gameActions.advancePhase('discussion')}>
              Start Discussion
            </ModernButton>
          </ModernCard>
        </View>
      </LinearGradient>
    );
  }

  // Discussion
  if (currentPhase === 'discussion') {
    return (
      <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Discussion Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <ModernCard variant="glass" style={styles.discussionCard}>
            <View style={styles.discussionHeader}>
              <MessageCircle size={20} color="#f093fb" />
              <Text style={styles.discussionTitle}>Discussion Time</Text>
            </View>

            <View style={styles.discussionPoints}>
              <Text style={styles.discussionText}>💭 Analyze each player's description</Text>
              <Text style={styles.discussionText}>🔍 Look for inconsistencies or vague answers</Text>
            </View>
          </ModernCard>

          <ModernButton variant="destructive" size="xl" onPress={() => gameActions.advancePhase('voting')}>
            Start Voting
          </ModernButton>
        </View>
      </LinearGradient>
    );
  }

  // Elimination result
  if (currentPhase === 'elimination-result') {
    if (!eliminatedPlayer) {
      return (
        <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Processing...</Text>
          </View>
        </LinearGradient>
      );
    }

    const alivePlayers = getAlivePlayers();
    const votesReceived = votingResults[eliminatedPlayer.id] || 0;

    return (
      <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Player Eliminated</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <ModernCard variant="glass" style={styles.eliminationResultCard}>
            <Text style={styles.eliminatedPlayerEmoji}>{getRoleEmoji(eliminatedPlayer.role)}</Text>
            <Text style={styles.eliminatedPlayerName}>{eliminatedPlayer.name}</Text>
            <ModernBadge variant={eliminatedPlayer.role === 'civilian' ? 'success' : 'destructive'}>{getRoleName(eliminatedPlayer.role)}</ModernBadge>

            {eliminatedPlayer.word && (
              <View style={styles.eliminatedPlayerWord}>
                <Text style={styles.eliminatedWordLabel}>Their word was:</Text>
                <Text style={styles.eliminatedWordText}>"{eliminatedPlayer.word}"</Text>
              </View>
            )}

            <View style={styles.eliminationStats}>
              <Text style={styles.eliminationStatsText}>Received {votesReceived} vote{votesReceived !== 1 ? 's' : ''}</Text>
              <Text style={styles.eliminationStatsText}>{alivePlayers.length} players remaining</Text>
            </View>

            {eliminatedPlayer.role === 'mrwhite' ? (
              <>
                <View style={styles.mrWhiteEliminationInfo}>
                  <Text style={styles.mrWhiteEliminationText}>🎯 Mr. White's Final Chance!</Text>
                  <Text style={styles.mrWhiteEliminationSubtext}>They get one guess to win the game</Text>
                </View>
                <ModernButton variant="primary" size="lg" onPress={() => gameActions.advancePhase('mr-white-guess')}>Mr. White's Guess</ModernButton>
              </>
            ) : (
              <ModernButton variant="primary" size="lg" onPress={() => gameActions.processElimination && gameActions.processElimination(eliminatedPlayer.id)}>
                Continue to Next Round
              </ModernButton>
            )}
          </ModernCard>
        </View>
      </LinearGradient>
    );
  }

  // Mr. White guess
  if (currentPhase === 'mr-white-guess') {
    return (
      <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mr. White's Last Chance</Text>
          <Text style={styles.subtitle}>{eliminatedPlayer?.name} was eliminated</Text>
        </View>

        <View style={styles.centerContent}>
          <ModernCard variant="glass" style={styles.guessCard}>
            <Text style={styles.mrWhiteGuessInstructions}>As Mr. White, you can win by correctly guessing the Civilian word!</Text>

            <ModernInput
              label="What is the Civilian word?"
              value={mrWhiteGuess ?? ''}
              onChangeText={(text: string) => gameActions.updateState && gameActions.updateState({ mrWhiteGuess: text })}
              placeholder="Enter your guess..."
            />

            <View style={styles.guessButtonsContainer}>
              <ModernButton variant="success" size="lg" onPress={handleMrWhiteGuess} disabled={!((mrWhiteGuess ?? '').toString().trim())}>
                Submit Guess
              </ModernButton>

              <ModernButton variant="ghost" size="lg" onPress={handleSkipGuess} icon={<SkipForward size={16} color="#667eea" />}>
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
      <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.container}>
        <View style={styles.header}>
          <Trophy size={32} color="#feca57" />
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
              <ModernBadge variant="info">{`Category: ${wordPair.category}`}</ModernBadge>
            </ModernCard>
          )}

          <View style={styles.playersResultsList}>
            {players.map(player => (
              <ModernCard key={player.id} variant="elevated" style={styles.playerResultCard}>
                <View style={styles.playerResultInfo}>
                  <Text style={styles.playerResultName}>{player.name}</Text>
                  <Text style={[styles.playerResultRole, { color: getRoleColor(player.role) }]}>{`${getRoleEmoji(player.role)} ${getRoleName(player.role)}`}</Text>
                  {player.word ? <Text style={styles.playerResultWord}>"{player.word}"</Text> : <Text style={styles.playerResultWord}>No word</Text>}
                  {player.eliminationRound && <ModernBadge variant="secondary">{`Eliminated Round ${player.eliminationRound}`}</ModernBadge>}
                </View>
                <ModernBadge variant="warning">{`+${player.points ?? 0}`}</ModernBadge>
              </ModernCard>
            ))}
          </View>

          {eliminationHistory.length > 0 && (
            <ModernCard variant="glass" style={styles.eliminationHistoryCard}>
              <Text style={styles.eliminationHistoryTitle}>Elimination History</Text>
              <View style={styles.eliminationHistoryList}>
                {eliminationHistory.map((el, idx) => (
                  <View key={idx} style={styles.eliminationHistoryItem}>
                    <View style={styles.eliminationRound}><Text style={styles.eliminationRoundText}>R{el.round}</Text></View>
                    <View style={styles.eliminationDetails}>
                      <Text style={styles.eliminationPlayerName}>{el.player.name}</Text>
                      <Text style={[styles.eliminationPlayerRole, { color: getRoleColor(el.player.role) }]}>{`${getRoleEmoji(el.player.role)} ${getRoleName(el.player.role)}`}</Text>
                      <Text style={styles.eliminationMethod}>
                        {el.eliminationMethod === 'voting' && `${el.votesReceived} votes`}
                        {el.eliminationMethod === 'chain' && 'Chain elimination'}
                        {el.eliminationMethod === 'revenger' && 'Revenger target'}
                        {el.eliminationMethod === 'mr-white-guess' && 'Mr. White won'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ModernCard>
          )}
        </ScrollView>

        <View style={styles.finalButtonsContainer}>
          <ModernButton variant="primary" size="lg" onPress={() => router.back()} icon={<RotateCcw size={16} color="white" />}>
            New Game
          </ModernButton>

          <ModernButton variant="secondary" size="lg" onPress={() => router.back()}>
            Back to Menu
          </ModernButton>
        </View>
      </LinearGradient>
    );
  }

  return <View />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20, gap: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { fontSize: 16, color: '#A0AEC0' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  wordDistributionCard: { alignItems: 'center', gap: 24, minWidth: 320 },
  passPhoneText: { fontSize: 18, color: '#CBD5E0', marginBottom: 8 },
  currentPlayerName: { fontSize: 32, fontWeight: 'bold', color: '#f093fb', marginBottom: 16 },
  wordRevealContainer: { alignItems: 'center', gap: 20 },
  wordText: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  wordHint: { fontSize: 14, color: '#A0AEC0', textAlign: 'center', fontStyle: 'italic' },
  noWordText: { fontSize: 28, fontWeight: 'bold', color: '#d69e2e', textAlign: 'center' },
  mrWhiteHint: { fontSize: 14, color: '#d69e2e', textAlign: 'center', fontStyle: 'italic' },

  descriptionCard: { alignItems: 'center', gap: 24, minWidth: 320 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  descriptionOrderList: { gap: 12, width: '100%' },
  descriptionOrderItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)' },
  descriptionOrderText: { fontSize: 16, color: '#E2E8F0' },
  descriptionHint: { fontSize: 14, color: '#667eea', textAlign: 'center', fontStyle: 'italic' },

  discussionCard: { gap: 24, marginBottom: 32 },
  discussionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  discussionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  discussionPoints: { gap: 8 },
  discussionText: { fontSize: 16, color: '#CBD5E0' },

  votingProgress: { paddingHorizontal: 24, marginBottom: 16 },
  progressText: { fontSize: 14, color: '#CBD5E0', textAlign: 'center' },
  progressBar: { height: 6, backgroundColor: '#2d3748', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#667eea' },

  currentVoterCard: { alignItems: 'center', gap: 8, margin: 12 },
  currentVoterLabel: { fontSize: 14, color: '#A0AEC0' },
  currentVoterName: { fontSize: 22, fontWeight: 'bold', color: '#f093fb' },
  votingInstructions: { fontSize: 14, color: '#CBD5E0', textAlign: 'center' },

  playersContainer: { flex: 1, paddingHorizontal: 16 },
  playerCard: { backgroundColor: 'rgba(255,255,255,0.03)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 12 },
  mostVotedPlayerCard: { borderColor: '#e53e3e', backgroundColor: 'rgba(229,62,62,0.08)' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 18, fontWeight: '600', color: '#fff' },
  voteInfo: { alignItems: 'center' },
  tapToVoteText: { fontSize: 12, color: '#667eea' },

  processingCard: { alignItems: 'center', gap: 12 },
  processingText: { fontSize: 16, color: '#CBD5E0' },

  eliminationResultCard: { alignItems: 'center', gap: 12, minWidth: 320 },
  eliminatedPlayerEmoji: { fontSize: 48 },
  eliminatedPlayerName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  eliminatedPlayerWord: { padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)', marginVertical: 8 },
  eliminatedWordLabel: { fontSize: 12, color: '#A0AEC0' },
  eliminatedWordText: { fontSize: 18, color: '#f093fb' },

  eliminationStats: { alignItems: 'center', gap: 6 },
  eliminationStatsText: { fontSize: 14, color: '#CBD5E0' },

  mrWhiteEliminationInfo: { padding: 12, borderRadius: 8, backgroundColor: 'rgba(214,158,46,0.08)' },
  mrWhiteEliminationText: { color: '#d69e2e', fontWeight: '700' },
  mrWhiteEliminationSubtext: { color: '#d69e2e' },

  guessCard: { gap: 12, minWidth: 320 },
  mrWhiteGuessInstructions: { fontSize: 16, color: '#d69e2e', textAlign: 'center' },
  guessButtonsContainer: { gap: 8, marginTop: 12 },

  finalResultsContainer: { flex: 1, padding: 16 },
  winnerCard: { alignItems: 'center', marginBottom: 12 },
  winnerText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },

  wordRevealCard: { alignItems: 'center', gap: 8, marginBottom: 12 },
  wordRevealTitle: { fontSize: 16, fontWeight: '700', color: '#667eea' },
  wordRevealText: { fontSize: 14, color: '#fff' },

  playersResultsList: { gap: 8 },
  playerResultCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerResultInfo: { flex: 1 },
  playerResultName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  playerResultRole: { fontSize: 12 },
  playerResultWord: { fontSize: 12, color: '#A0AEC0' },

  finalButtonsContainer: { padding: 12, gap: 8 },

  eliminationHistoryCard: { marginTop: 12 },
  eliminationHistoryTitle: { fontSize: 18, color: '#fff' },
  eliminationHistoryList: { gap: 8 },
  eliminationHistoryItem: { flexDirection: 'row', gap: 12, padding: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 },
  eliminationRound: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center' },
  eliminationRoundText: { color: '#fff' },
  eliminationDetails: { flex: 1 },
  eliminationPlayerName: { color: '#fff' },
  eliminationPlayerRole: { color: '#fff' },
  eliminationMethod: { color: '#A0AEC0' },
});
