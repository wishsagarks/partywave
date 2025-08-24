import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Eye, EyeOff, ArrowRight, Users, Trophy, RotateCcw, Timer, MessageCircle } from 'lucide-react-native';
import { GameService } from '@/services/gameService';
import { Player, WordPair, GamePhase } from '@/types/game';

export default function GameFlow() {
  const { gameId, playerCount, playerNames, playerIds } = useLocalSearchParams();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPhase, setCurrentPhase] = useState<GamePhase>('word-distribution');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentDescriptionIndex, setCurrentDescriptionIndex] = useState(0);
  const [wordRevealed, setWordRevealed] = useState(false);
  const [votingResults, setVotingResults] = useState<{[key: string]: number}>({});
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);
  const [gameWinner, setGameWinner] = useState<string>('');
  const [wordPair, setWordPair] = useState<WordPair | null>(null);
  const [startTime] = useState(new Date());
  const [mrWhiteGuess, setMrWhiteGuess] = useState('');
  const [showMrWhiteGuess, setShowMrWhiteGuess] = useState(false);
  const [discussionTimer, setDiscussionTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [individualVotes, setIndividualVotes] = useState<{[voterId: string]: string}>({});
  
  useEffect(() => {
    let isMounted = true;
    
    const initializeGameSafe = async () => {
      try {
        // Get random word pair from active libraries
        const selectedWordPair = await GameService.getRandomWordPair();
        if (!isMounted) return;
        
        if (!selectedWordPair) {
          Alert.alert('Error', 'No active word libraries found. Please enable some word libraries in settings.');
          if (isMounted) {
            router.back();
          }
          return;
        }
        
        if (isMounted) {
          setWordPair(selectedWordPair);
        }
        
        // Parse player data
        const names = JSON.parse(playerNames as string);
        const ids = JSON.parse(playerIds as string);
        
        // Assign roles using the service
        const assignedPlayers = GameService.assignRoles(names, selectedWordPair, ids);
        if (isMounted) {
          setPlayers(assignedPlayers);
        }
        
      } catch (error) {
        if (isMounted) {
          Alert.alert('Error', 'Failed to initialize game. Please try again.');
          console.error('Game initialization error:', error);
          router.back();
        }
      }
    };
    
    initializeGameSafe();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && discussionTimer > 0) {
      interval = setInterval(() => {
        setDiscussionTimer(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, discussionTimer]);

  const saveGameRound = async (eliminatedPlayerId: string, voteResults: {[key: string]: number}, mrWhiteGuess?: string, mrWhiteGuessCorrect?: boolean) => {
    try {
      await GameService.saveGameRound(
        gameId as string,
        currentRound,
        eliminatedPlayerId,
        voteResults,
        mrWhiteGuess,
        mrWhiteGuessCorrect
      );
    } catch (error) {
      console.error('Error saving game round:', error);
    }
  };

  const saveGameResult = async (winner: string, finalPlayers: Player[]) => {
    try {
      const duration = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
      const playerIdsArray = JSON.parse(playerIds as string);
      
      const gameResult = {
        winner,
        players: finalPlayers.map(p => ({
          name: p.name,
          role: p.role,
          word: p.word,
          points: p.points,
          wasWinner: (winner === 'Civilians' && p.role === 'civilian') ||
                    (winner === 'Undercover' && p.role === 'undercover') ||
                    (winner === 'Mr. White' && p.role === 'mrwhite') ||
                    (winner === 'Impostors' && (p.role === 'undercover' || p.role === 'mrwhite')),
        })),
        totalRounds: currentRound,
        duration,
      };
      
      if (wordPair) {
        await GameService.saveGameResult(gameId as string, gameResult, wordPair, playerIdsArray);
      }
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };

  const handleMrWhiteElimination = (player: Player) => {
    setEliminatedPlayer(player);
    setShowMrWhiteGuess(true);
  };

  const submitMrWhiteGuess = async () => {
    if (!eliminatedPlayer || !wordPair) return;
    
    const isCorrect = mrWhiteGuess.toLowerCase().trim() === wordPair.civilian_word.toLowerCase().trim();
    
    // Save round data
    await saveGameRound(eliminatedPlayer.id, votingResults, mrWhiteGuess, isCorrect);
    
    if (isCorrect) {
      // Mr. White wins!
      const finalPlayers = GameService.calculatePoints(players, 'Mr. White');
      setPlayers(finalPlayers);
      setGameWinner('Mr. White');
      await saveGameResult('Mr. White', finalPlayers);
      setCurrentPhase('final-results');
    } else {
      // Mr. White is eliminated, continue game
      const newPlayers = players.map(p => 
        p.id === eliminatedPlayer.id ? { ...p, isAlive: false, eliminationRound: currentRound } : p
      );
      setPlayers(newPlayers);
      
      // Check win conditions
      const { winner, isGameOver } = GameService.checkWinCondition(newPlayers);
      if (isGameOver && winner) {
        const finalPlayers = GameService.calculatePoints(newPlayers, winner);
        setPlayers(finalPlayers);
        setGameWinner(winner);
        await saveGameResult(winner, finalPlayers);
        setCurrentPhase('final-results');
      } else {
        setCurrentPhase('elimination-result');
      }
    }
    
    setShowMrWhiteGuess(false);
    setMrWhiteGuess('');
  };

  const startDiscussionTimer = () => {
    setDiscussionTimer(120); // 2 minutes
    setIsTimerRunning(true);
  };

  const stopDiscussionTimer = () => {
    setIsTimerRunning(false);
    setDiscussionTimer(0);
  };

  const nextWordDistribution = () => {
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setWordRevealed(false);
    } else {
      setCurrentPhase('description');
      setCurrentPlayerIndex(0);
      setCurrentDescriptionIndex(0);
    }
  };

  const nextDescription = () => {
    const alivePlayers = players.filter(p => p.isAlive);
    if (currentDescriptionIndex < alivePlayers.length - 1) {
      setCurrentDescriptionIndex(currentDescriptionIndex + 1);
    } else {
      setCurrentPhase('discussion');
    }
  };

  const startVoting = () => {
    setCurrentPhase('voting');
    setVotingResults({});
    setCurrentVoterIndex(0);
    setIndividualVotes({});
  };

  const castVote = async (votedForId: string) => {
    const alivePlayers = players.filter(p => p.isAlive);
    const currentVoter = alivePlayers[currentVoterIndex];
    
    // Record this player's vote
    const newIndividualVotes = { ...individualVotes };
    newIndividualVotes[currentVoter.id] = votedForId;
    setIndividualVotes(newIndividualVotes);
    
    // Update vote tallies
    const newResults = { ...votingResults };
    newResults[votedForId] = (newResults[votedForId] || 0) + 1;
    setVotingResults(newResults);
    
    // Move to next voter or finish voting
    if (currentVoterIndex < alivePlayers.length - 1) {
      setCurrentVoterIndex(currentVoterIndex + 1);
    } else {
      // All players have voted, process results
      processVotingResults(newResults);
    }
  };

  const processVotingResults = async (results: {[key: string]: number}) => {
    // Determine elimination
    const maxVotes = Math.max(...Object.values(results));
    const mostVotedIds = Object.entries(results)
      .filter(([_, votes]) => votes === maxVotes)
      .map(([id, _]) => id);
    
    if (mostVotedIds.length === 1) {
      const eliminatedId = mostVotedIds[0];
      const eliminated = players.find(p => p.id === eliminatedId);
      if (eliminated) {
        if (eliminated.role === 'mrwhite') {
          handleMrWhiteElimination(eliminated);
        } else {
          setEliminatedPlayer(eliminated);
          await eliminatePlayer(eliminatedId);
        }
      }
    } else {
      // Tie - random elimination
      Alert.alert('Tie Vote', 'There was a tie in voting. Randomly eliminating one of the tied players.', [
        { text: 'OK', onPress: async () => {
          const randomEliminated = mostVotedIds[Math.floor(Math.random() * mostVotedIds.length)];
          const eliminated = players.find(p => p.id === randomEliminated);
          if (eliminated) {
            if (eliminated.role === 'mrwhite') {
              handleMrWhiteElimination(eliminated);
            } else {
              setEliminatedPlayer(eliminated);
              await eliminatePlayer(randomEliminated);
            }
          }
        }}
      ]);
    }
  };

  const eliminatePlayer = async (playerId: string) => {
    const newPlayers = players.map(p => 
      p.id === playerId ? { ...p, isAlive: false, eliminationRound: currentRound } : p
    );
    setPlayers(newPlayers);
    
    // Save round data
    await saveGameRound(playerId, votingResults);
    
    // Check win conditions
    const { winner, isGameOver } = GameService.checkWinCondition(newPlayers);
    if (isGameOver && winner) {
      const finalPlayers = GameService.calculatePoints(newPlayers, winner);
      setPlayers(finalPlayers);
      setGameWinner(winner);
      await saveGameResult(winner, finalPlayers);
      setCurrentPhase('final-results');
    } else {
      // Continue game
      setTimeout(() => {
        setCurrentPhase('elimination-result');
      }, 1000);
    }
  };

  const nextRound = () => {
    setCurrentRound(currentRound + 1);
    setCurrentPhase('description');
    setCurrentDescriptionIndex(0);
    setEliminatedPlayer(null);
    setVotingResults({});
    setCurrentVoterIndex(0);
    setIndividualVotes({});
    stopDiscussionTimer();
  };

  const restartGame = () => {
    router.back();
  };

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

  if (currentPhase === 'word-distribution') {
    const currentPlayer = players[currentPlayerIndex];
    
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Word Distribution</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.passPhoneText}>
            Pass the phone to:
          </Text>
          <Text style={styles.currentPlayerName}>
            {currentPlayer?.name}
          </Text>
          
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
                    Describe this word without saying it directly
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
      </LinearGradient>
    );
  }

  if (currentPhase === 'description') {
    const alivePlayers = players.filter(p => p.isAlive);
    const currentPlayer = alivePlayers[currentDescriptionIndex];
    
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Description Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound} • Turn {currentDescriptionIndex + 1}/{alivePlayers.length}</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.phaseInstructions}>
            Each player describes their word in one sentence
          </Text>
          
          <View style={styles.currentTurnCard}>
            <Text style={styles.currentTurnText}>Current Turn:</Text>
            <Text style={styles.currentPlayerName}>{currentPlayer?.name}</Text>
            <Text style={styles.descriptionHint}>
              Give a short, clever description of your word
            </Text>
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextDescription}
          >
            <Text style={styles.nextButtonText}>
              {currentDescriptionIndex < alivePlayers.length - 1 ? 'Next Player' : 'Start Discussion'}
            </Text>
            <ArrowRight size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

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
              <Text style={styles.discussionText}>
                💭 Analyze each player's description
              </Text>
              <Text style={styles.discussionText}>
                🔍 Look for inconsistencies or vague answers
              </Text>
              <Text style={styles.discussionText}>
                🤔 Decide who seems most suspicious
              </Text>
            </View>
            
            {!isTimerRunning && discussionTimer === 0 && (
              <TouchableOpacity
                style={styles.timerButton}
                onPress={startDiscussionTimer}
              >
                <Timer size={16} color="white" />
                <Text style={styles.timerButtonText}>Start 2min Timer</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={startVoting}
          >
            <Text style={styles.nextButtonText}>Start Voting</Text>
            <ArrowRight size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (currentPhase === 'voting') {
    const alivePlayers = players.filter(p => p.isAlive);
    const currentVoter = alivePlayers[currentVoterIndex];
    const hasVoted = individualVotes[currentVoter?.id];
    
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Voting Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound} • Voter {currentVoterIndex + 1}/{alivePlayers.length}</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.passPhoneText}>
            Pass the phone to:
          </Text>
          <Text style={styles.currentPlayerName}>
            {currentVoter?.name}
          </Text>
          
          <Text style={styles.votingInstructions}>
            Vote to eliminate the most suspicious player:
          </Text>
        </View>

        <ScrollView style={styles.votingContainer}>
          {alivePlayers
            .filter(player => player.id !== currentVoter?.id)
            .map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.voteButton,
                hasVoted && { opacity: 0.5 }
              ]}
              onPress={() => castVote(player.id)}
              disabled={hasVoted}
            >
              <Text style={styles.votePlayerName}>{player.name}</Text>
              <Text style={styles.voteCount}>
                Current Votes: {votingResults[player.id] || 0}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {hasVoted && (
          <View style={styles.votedConfirmation}>
            <Text style={styles.votedText}>
              ✓ Vote cast for {players.find(p => p.id === individualVotes[currentVoter.id])?.name}
            </Text>
            <Text style={styles.waitingText}>
              Waiting for {alivePlayers.length - currentVoterIndex - 1} more players to vote...
            </Text>
          </View>
        )}
      </LinearGradient>
    );
  }

  if (currentPhase === 'elimination-result') {
    const shouldShowRole = eliminatedPlayer?.role === 'undercover' || eliminatedPlayer?.role === 'mrwhite';
    
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
            {shouldShowRole && (
              <Text style={[styles.eliminatedRole, { color: getRoleColor(eliminatedPlayer?.role || '') }]}>
                {getRoleEmoji(eliminatedPlayer?.role || '')} {getRoleName(eliminatedPlayer?.role || '')}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextRound}
          >
            <Text style={styles.nextButtonText}>Continue Game</Text>
            <ArrowRight size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (showMrWhiteGuess) {
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
            
            <TouchableOpacity
              style={styles.submitGuessButton}
              onPress={submitMrWhiteGuess}
              disabled={!mrWhiteGuess.trim()}
            >
              <Text style={styles.submitGuessText}>Submit Guess</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

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
              <Text style={styles.wordRevealText}>
                👥 Civilians: "{wordPair.civilian_word}"
              </Text>
              <Text style={styles.wordRevealText}>
                🕵️ Undercover: "{wordPair.undercover_word}"
              </Text>
              <Text style={styles.wordRevealCategory}>
                Category: {wordPair.category}
              </Text>
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
                    <Text style={styles.eliminationInfo}>
                      Eliminated Round {player.eliminationRound}
                    </Text>
                  )}
                </View>
                <Text style={styles.playerResultPoints}>+{player.points}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.finalButtonsContainer}>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={restartGame}
          >
            <RotateCcw size={16} color="white" />
            <Text style={styles.restartButtonText}>New Game</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.back()}
          >
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
  currentTurnCard: {
    backgroundColor: '#374151',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  currentTurnText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  descriptionHint: {
    fontSize: 14,
    color: '#8B5CF6',
    textAlign: 'center',
    fontStyle: 'italic',
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
  votingContainer: {
    flex: 1,
    padding: 20,
  },
  votingInstructions: {
    fontSize: 18,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 24,
  },
  voteButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  votePlayerName: {
    fontSize: 16,
    color: '#F3F4F6',
    fontWeight: '600',
  },
  voteCount: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  votedConfirmation: {
    backgroundColor: '#374151',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  votedText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  waitingText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
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
});