import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Eye, EyeOff, ArrowRight, Users, Trophy, RotateCcw, Timer, MessageCircle, SkipForward, Zap } from 'lucide-react-native';
import { GameService } from '@/services/gameService';
import { useGameState } from '@/hooks/useGameState';
import { useVotingLogic } from '@/hooks/useVotingLogic';
import { useSpecialRoles } from '@/hooks/useSpecialRoles';
import { VotingPhase } from '@/components/game/VotingPhase';
import { SpecialRoleModals } from '@/components/game/SpecialRoleModals';

export default function GameFlow() {
  const params = useLocalSearchParams();
  const {
    gameId,
    playerCount,
    playerNames,
    playerIds,
    customRoles,
    useSpecialRoles: useSpecialRolesParam,
    selectedSpecialRoles
  } = params;

  // Initialize game state
  const gameState = useGameState({
    gameId: gameId as string,
    playerCount: Number(playerCount),
    playerNames: playerNames as string,
    playerIds: playerIds as string,
    customRoles: customRoles as string,
    useSpecialRoles: useSpecialRolesParam === 'true',
    selectedSpecialRoles: selectedSpecialRoles as string,
  });

  const {
    players,
    currentPhase,
    currentPlayerIndex,
    currentRound,
    wordPair,
    gameWinner,
    wordRevealed,
    descriptionOrder,
    discussionTimer,
    isTimerRunning,
    votingResults,
    individualVotes,
    isProcessingVotes,
    eliminatedPlayer,
    showRoundLeaderboard,
    roundLeaderboard,
    mrWhiteGuess,
    showMrWhiteGuess,
    showRevengerModal,
    revengerPlayer,
    showSpecialRoleCard,
    currentSpecialRolePlayer,
    setCurrentPhase,
    setCurrentPlayerIndex,
    setCurrentRound,
    setWordRevealed,
    setDescriptionOrder,
    setDiscussionTimer,
    setIsTimerRunning,
    setEliminatedPlayer,
    setShowRoundLeaderboard,
    setMrWhiteGuess,
    setShowMrWhiteGuess,
    setGameWinner,
    setPlayers,
    getVotingPlayers,
    getAlivePlayers,
    getCurrentVoter,
    resetVotingState,
    generateDescriptionOrder,
    saveGameRound,
    saveGameResult,
    showRoundResults,
  } = gameState;

  // Handle game end
  const handleGameEnd = async (winner: string, finalPlayers: any[]) => {
    try {
      setGameWinner(winner);
      await saveGameResult(winner, finalPlayers);
      setCurrentPhase('final-results');
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  // Handle Mr. White elimination
  const handleMrWhiteElimination = async (player: any) => {
    try {
      console.log('Mr. White eliminated:', player.name);
      setEliminatedPlayer(player);
      await GameService.saveGameRound(gameId as string, currentRound, player.id, votingResults);
      setShowMrWhiteGuess(true);
      setCurrentPhase('mr-white-guess');
    } catch (error) {
      console.error('Error handling Mr. White elimination:', error);
    }
  };

  // Handle regular player elimination
  const handlePlayerElimination = async (player: any) => {
    try {
      // Mark player as eliminated
      const updatedPlayers = players.map(p => 
        p.id === player.id ? { ...p, isAlive: false, eliminationRound: currentRound } : p
      );
      
      const { finalPlayers, chainEliminations } = specialRoles.handleSpecialRoleElimination(player.id, currentRound);
      
      await GameService.saveGameRound(gameId as string, currentRound, player.id, votingResults);
      
      if (chainEliminations.length > 0) {
        const chainedNames = chainEliminations
          .map(id => finalPlayers.find(p => p.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        
        Alert.alert('Chain Elimination!', `${chainedNames} was also eliminated due to special role effects.`);
      }
      
      // Use updated players for win condition check
      const playersToCheck = chainEliminations.length > 0 ? finalPlayers : updatedPlayers;
      const { winner, isGameOver } = GameService.checkWinCondition(playersToCheck);
      
      if (isGameOver && winner) {
        const scoredPlayers = GameService.calculatePoints(playersToCheck, winner);
        setPlayers(scoredPlayers);
        setGameWinner(winner);
        await saveGameResult(winner, scoredPlayers);
        setCurrentPhase('final-results');
      } else {
        setPlayers(playersToCheck);
        showRoundResults(playersToCheck);
      }
    } catch (error) {
      console.error('Error handling player elimination:', error);
    }
  };

  // Initialize special roles hook
  const specialRoles = useSpecialRoles({
    players,
    setPlayers,
    setShowRevengerModal: gameState.setShowRevengerModal,
    setRevengerPlayer: gameState.setRevengerPlayer,
    setShowSpecialRoleCard: gameState.setShowSpecialRoleCard,
    setCurrentSpecialRolePlayer: gameState.setCurrentSpecialRolePlayer,
    onGameEnd: handleGameEnd,
    showRoundResults,
  });

  // Initialize voting logic
  const votingLogic = useVotingLogic({
    players,
    votingResults,
    individualVotes,
    currentVoterIndex: gameState.currentVoterIndex,
    isProcessingVotes,
    currentRound,
    setVotingResults: gameState.setVotingResults,
    setIndividualVotes: gameState.setIndividualVotes,
    setCurrentVoterIndex: gameState.setCurrentVoterIndex,
    setIsProcessingVotes: gameState.setIsProcessingVotes,
    setEliminatedPlayer,
    resetVotingState,
    getVotingPlayers,
    getCurrentVoter,
    onPlayerEliminated: handlePlayerElimination,
    onMrWhiteEliminated: handleMrWhiteElimination,
    onRevengerEliminated: (player) => specialRoles.showRevengerModal(player),
  });

  // Helper functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Phase handlers
  const nextWordDistribution = () => {
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setWordRevealed(false);
    } else {
      setCurrentPhase('description');
      setCurrentPlayerIndex(0);
      const alivePlayers = getAlivePlayers();
      const order = generateDescriptionOrder(alivePlayers);
      setDescriptionOrder(order);
    }
  };

  const startDescriptionPhase = () => {
    const alivePlayers = getAlivePlayers();
    const order = generateDescriptionOrder(alivePlayers);
    setDescriptionOrder(order);
    setCurrentPhase('discussion');
  };

  const startVoting = () => {
    resetVotingState();
    setCurrentPhase('voting');
  };

  const startDiscussionTimer = () => {
    setDiscussionTimer(120);
    setIsTimerRunning(true);
  };

  const stopDiscussionTimer = () => {
    setIsTimerRunning(false);
    setDiscussionTimer(0);
  };

  const submitMrWhiteGuess = async () => {
    if (!eliminatedPlayer || !wordPair) return;
    
    try {
      const isCorrect = mrWhiteGuess.toLowerCase().trim() === wordPair.civilian_word.toLowerCase().trim();
      
      await GameService.saveGameRound(gameId as string, currentRound, eliminatedPlayer.id, votingResults, mrWhiteGuess, isCorrect);
      
      if (isCorrect) {
        const finalPlayers = GameService.calculatePoints(players, 'Mr. White');
        setPlayers(finalPlayers);
        setGameWinner('Mr. White');
        await saveGameResult('Mr. White', finalPlayers);
        setCurrentPhase('final-results');
      } else {
        const newPlayers = players.map(p => 
          p.id === eliminatedPlayer.id ? { ...p, isAlive: false, eliminationRound: currentRound } : p
        );
        const finalPlayers = GameService.calculatePoints(newPlayers, 'Civilians');
        setPlayers(finalPlayers);
        setGameWinner('Civilians');
        await saveGameResult('Civilians', finalPlayers);
        setCurrentPhase('final-results');
      }
      
      setShowMrWhiteGuess(false);
      setMrWhiteGuess('');
    } catch (error) {
      console.error('Error submitting Mr. White guess:', error);
    }
  };

  const skipMrWhiteGuess = async () => {
    if (!eliminatedPlayer) return;
    
    try {
      const newPlayers = players.map(p => 
        p.id === eliminatedPlayer.id ? { ...p, isAlive: false, eliminationRound: currentRound } : p
      );
      const finalPlayers = GameService.calculatePoints(newPlayers, 'Civilians');
      setPlayers(finalPlayers);
      setGameWinner('Civilians');
      await saveGameResult('Civilians', finalPlayers);
      
      setShowMrWhiteGuess(false);
      setMrWhiteGuess('');
      setCurrentPhase('final-results');
    } catch (error) {
      console.error('Error skipping Mr. White guess:', error);
    }
  };

  const nextRound = () => {
    setCurrentRound(currentRound + 1);
    setCurrentPhase('description');
    const alivePlayers = getAlivePlayers();
    const order = generateDescriptionOrder(alivePlayers);
    setDescriptionOrder(order);
    setEliminatedPlayer(null);
    resetVotingState();
    stopDiscussionTimer();
  };

  const restartGame = () => {
    router.back();
  };

  // Render voting phase
  if (currentPhase === 'voting') {
    return (
      <>
        <VotingPhase
          players={players}
          currentRound={currentRound}
          currentVoter={getCurrentVoter()}
          votingResults={votingResults}
          individualVotes={individualVotes}
          isProcessingVotes={isProcessingVotes}
          onCastVote={votingLogic.castVote}
          getVotingPlayers={getVotingPlayers}
          getAlivePlayers={getAlivePlayers}
        />
        
        <SpecialRoleModals
          showRevengerModal={showRevengerModal}
          revengerPlayer={revengerPlayer}
          players={players}
          onRevengerChoice={specialRoles.handleRevengerChoice}
          showSpecialRoleCard={showSpecialRoleCard}
          currentSpecialRolePlayer={currentSpecialRolePlayer}
          onCloseSpecialRoleCard={() => gameState.setShowSpecialRoleCard(false)}
        />
      </>
    );
  }

  // Word distribution phase
  if (currentPhase === 'word-distribution') {
    const currentPlayer = players[currentPlayerIndex];
    
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Word Distribution</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.passPhoneText}>Pass the phone to:</Text>
          <Text style={styles.currentPlayerName}>{currentPlayer?.name}</Text>
          
          {!wordRevealed ? (
            <TouchableOpacity
              style={styles.revealButton}
              onPress={() => setWordRevealed(true)}
            >
              <Eye size={24} color="white" />
              <Text style={styles.revealButtonText}>Tap to See Your Word</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.wordCard}>
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
                <TouchableOpacity
                  style={styles.specialRoleButton}
                  onPress={() => specialRoles.handleShowSpecialRoleCard(currentPlayer)}
                >
                  <Zap size={16} color="#F59E0B" />
                  <Text style={styles.specialRoleButtonText}>Special Role Info</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.nextButton}
                onPress={nextWordDistribution}
              >
                <Text style={styles.nextButtonText}>
                  {currentPlayerIndex < players.length - 1 ? 'Next Player' : 'Start Game'}
                </Text>
                <ArrowRight size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <SpecialRoleModals
          showRevengerModal={showRevengerModal}
          revengerPlayer={revengerPlayer}
          players={players}
          onRevengerChoice={specialRoles.handleRevengerChoice}
          showSpecialRoleCard={showSpecialRoleCard}
          currentSpecialRolePlayer={currentSpecialRolePlayer}
          onCloseSpecialRoleCard={() => gameState.setShowSpecialRoleCard(false)}
        />
      </LinearGradient>
    );
  }

  // Description phase
  if (currentPhase === 'description') {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Description Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.sectionTitle}>Description Order:</Text>
          <View style={styles.descriptionOrderList}>
            {descriptionOrder.map((player, index) => (
              <View key={player.id} style={styles.descriptionOrderItem}>
                <Text style={styles.descriptionOrderText}>
                  {index + 1}. {player.name}
                </Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.descriptionHint}>
            Each player describes their word in one sentence following this order
          </Text>

          <TouchableOpacity style={styles.nextButton} onPress={startDescriptionPhase}>
            <Text style={styles.nextButtonText}>Start Discussion</Text>
            <ArrowRight size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Discussion phase
  if (currentPhase === 'discussion') {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Discussion Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.phaseInstructions}>
            Analyze the descriptions and identify suspicious players
          </Text>
          
          <View style={styles.discussionCard}>
            <View style={styles.discussionHeader}>
              <MessageCircle size={20} color="#8B5CF6" />
              <Text style={styles.discussionTitle}>Discussion Time</Text>
              {discussionTimer > 0 && (
                <View style={styles.timerContainer}>
                  <Timer size={16} color="#F59E0B" />
                  <Text style={styles.timerText}>{formatTime(discussionTimer)}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.discussionPoints}>
              <Text style={styles.discussionText}>💭 Analyze each player's description</Text>
              <Text style={styles.discussionText}>🔍 Look for inconsistencies or vague answers</Text>
              <Text style={styles.discussionText}>🤔 Decide who seems most suspicious</Text>
            </View>
            
            {!isTimerRunning && discussionTimer === 0 && (
              <TouchableOpacity style={styles.timerButton} onPress={startDiscussionTimer}>
                <Timer size={16} color="white" />
                <Text style={styles.timerButtonText}>Start 2min Timer</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={startVoting}>
            <Text style={styles.nextButtonText}>Start Voting</Text>
            <ArrowRight size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Elimination result phase
  if (currentPhase === 'elimination-result') {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Round Results</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.eliminatedText}>Player Eliminated:</Text>
          <View style={styles.eliminatedCard}>
            <Text style={styles.eliminatedPlayerName}>{eliminatedPlayer?.name}</Text>
            <Text style={[styles.eliminatedRole, { color: getRoleColor(eliminatedPlayer?.role || '') }]}>
              {getRoleEmoji(eliminatedPlayer?.role || '')} {getRoleName(eliminatedPlayer?.role || '')}
            </Text>
            {eliminatedPlayer?.word && (
              <Text style={styles.eliminatedPlayerWord}>
                Their word was: "{eliminatedPlayer.word}"
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={nextRound}>
            <Text style={styles.nextButtonText}>Continue Game</Text>
            <ArrowRight size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Mr. White guess phase
  if (currentPhase === 'mr-white-guess' || showMrWhiteGuess) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mr. White's Last Chance</Text>
          <Text style={styles.subtitle}>{eliminatedPlayer?.name} was eliminated</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.mrWhiteGuessInstructions}>
            As Mr. White, you can win by correctly guessing the Civilian word!
          </Text>
          
          <View style={styles.guessCard}>
            <Text style={styles.guessLabel}>What is the Civilian word?</Text>
            <TextInput
              style={styles.guessInput}
              value={mrWhiteGuess}
              onChangeText={setMrWhiteGuess}
              placeholder="Enter your guess..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <View style={styles.guessButtonsContainer}>
              <TouchableOpacity
                style={styles.submitGuessButton}
                onPress={submitMrWhiteGuess}
                disabled={!mrWhiteGuess.trim()}
              >
                <Text style={styles.submitGuessText}>Submit Guess</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.skipGuessButton} onPress={skipMrWhiteGuess}>
                <SkipForward size={16} color="#9CA3AF" />
                <Text style={styles.skipGuessText}>Skip Guess</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Round leaderboard
  if (showRoundLeaderboard) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Round {currentRound} Results</Text>
          <Text style={styles.subtitle}>Current Standings</Text>
        </View>

        <ScrollView style={styles.leaderboardContainer}>
          {roundLeaderboard.map((player, index) => (
            <View key={player.id} style={styles.leaderboardItem}>
              <Text style={styles.leaderboardRank}>#{index + 1}</Text>
              <View style={styles.leaderboardPlayerInfo}>
                <Text style={styles.leaderboardPlayerName}>{player.name}</Text>
                <Text style={[styles.leaderboardPlayerRole, { color: getRoleColor(player.role) }]}>
                  {getRoleEmoji(player.role)} {getRoleName(player.role)}
                </Text>
                <Text style={styles.leaderboardPlayerStatus}>
                  {player.isAlive ? '✅ Alive' : '❌ Eliminated'}
                </Text>
              </View>
              <Text style={styles.leaderboardPoints}>{player.points}pts</Text>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            setShowRoundLeaderboard(false);
            const { winner, isGameOver } = GameService.checkWinCondition(players);
            if (isGameOver && winner) {
              const finalPlayers = GameService.calculatePoints(players, winner);
              setPlayers(finalPlayers);
              setGameWinner(winner);
              saveGameResult(winner, finalPlayers);
              setCurrentPhase('final-results');
            } else {
              nextRound();
            }
          }}
        >
          <Text style={styles.continueButtonText}>Continue Game</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // Final results
  if (currentPhase === 'final-results') {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Trophy size={32} color="#F59E0B" />
          <Text style={styles.title}>Game Over</Text>
        </View>

        <ScrollView style={styles.finalResultsContainer}>
          <Text style={styles.winnerText}>{gameWinner} Win!</Text>
          
          {wordPair && (
            <View style={styles.wordRevealCard}>
              <Text style={styles.wordRevealTitle}>The Words Were:</Text>
              <Text style={styles.wordRevealText}>👥 Civilians: "{wordPair.civilian_word}"</Text>
              <Text style={styles.wordRevealText}>🕵️ Undercover: "{wordPair.undercover_word}"</Text>
              <Text style={styles.wordRevealCategory}>Category: {wordPair.category}</Text>
            </View>
          )}
          
          <View style={styles.playersResultsList}>
            {players.map((player) => (
              <View key={player.id} style={styles.playerResultCard}>
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
                    <Text style={styles.eliminationInfo}>Eliminated Round {player.eliminationRound}</Text>
                  )}
                </View>
                <Text style={styles.playerResultPoints}>+{player.points}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.finalButtonsContainer}>
          <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
            <RotateCcw size={16} color="white" />
            <Text style={styles.restartButtonText}>New Game</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.homeButton} onPress={() => router.back()}>
            <Text style={styles.homeButtonText}>Back to Menu</Text>
          </TouchableOpacity>
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
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  passPhoneText: {
    fontSize: 18,
    color: '#D1D5DB',
    marginBottom: 12,
  },
  currentPlayerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 32,
  },
  revealButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  revealButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  wordCard: {
    backgroundColor: '#374151',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    minWidth: 280,
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F3F4F6',
    textAlign: 'center',
  },
  wordHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noWordText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    textAlign: 'center',
  },
  mrWhiteHint: {
    fontSize: 14,
    color: '#F59E0B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  nextButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  phaseInstructions: {
    fontSize: 18,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  descriptionHint: {
    fontSize: 14,
    color: '#8B5CF6',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },
  discussionCard: {
    backgroundColor: '#374151',
    padding: 24,
    borderRadius: 12,
    marginBottom: 32,
    gap: 16,
  },
  discussionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  discussionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  discussionPoints: {
    gap: 12,
  },
  timerButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  timerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  discussionText: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  eliminatedText: {
    fontSize: 18,
    color: '#D1D5DB',
    marginBottom: 16,
  },
  eliminatedCard: {
    backgroundColor: '#374151',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  eliminatedPlayerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  eliminatedRole: {
    fontSize: 16,
    fontWeight: '600',
  },
  eliminatedPlayerWord: {
    fontSize: 14,
    color: '#8B5CF6',
    fontStyle: 'italic',
    marginTop: 8,
  },
  mrWhiteGuessInstructions: {
    fontSize: 18,
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  guessCard: {
    backgroundColor: '#374151',
    padding: 24,
    borderRadius: 12,
    gap: 16,
    minWidth: 280,
  },
  guessLabel: {
    fontSize: 16,
    color: '#F3F4F6',
    fontWeight: '600',
    textAlign: 'center',
  },
  guessInput: {
    backgroundColor: '#1F2937',
    color: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    fontSize: 18,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  guessButtonsContainer: {
    gap: 12,
  },
  submitGuessButton: {
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitGuessText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipGuessButton: {
    backgroundColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  skipGuessText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  finalResultsContainer: {
    flex: 1,
    padding: 20,
  },
  winnerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 32,
  },
  wordRevealCard: {
    backgroundColor: '#374151',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    gap: 8,
  },
  wordRevealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  wordRevealText: {
    fontSize: 16,
    color: '#F3F4F6',
    fontWeight: '600',
  },
  wordRevealCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  playersResultsList: {
    gap: 12,
  },
  playerResultCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerResultInfo: {
    flex: 1,
    gap: 4,
  },
  playerResultName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  playerResultRole: {
    fontSize: 14,
    fontWeight: '600',
  },
  playerResultWord: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  eliminationInfo: {
    fontSize: 10,
    color: '#6B7280',
  },
  playerResultPoints: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  finalButtonsContainer: {
    padding: 20,
    gap: 12,
  },
  restartButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  restartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: '#374151',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  homeButtonText: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionOrderList: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 8,
    minWidth: 280,
  },
  descriptionOrderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1F2937',
  },
  descriptionOrderText: {
    fontSize: 16,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  leaderboardContainer: {
    flex: 1,
    padding: 20,
  },
  leaderboardItem: {
    backgroundColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  leaderboardRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
    width: 40,
  },
  leaderboardPlayerInfo: {
    flex: 1,
    gap: 4,
  },
  leaderboardPlayerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  leaderboardPlayerRole: {
    fontSize: 12,
    fontWeight: '600',
  },
  leaderboardPlayerStatus: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  leaderboardPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  continueButton: {
    backgroundColor: '#8B5CF6',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  specialRoleButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginTop: 8,
  },
  specialRoleButtonText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 16,
  },
});