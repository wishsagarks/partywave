import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Eye, EyeOff, ArrowRight, Users, Trophy, RotateCcw, Timer, MessageCircle, SkipForward, Zap } from 'lucide-react-native';
import { GameService } from '@/services/gameService';
import { Player, WordPair, GamePhase, SpecialRole } from '@/types/game';

export default function GameFlow() {
  const { gameId, playerCount, playerNames, playerIds, customRoles, useSpecialRoles, selectedSpecialRoles } = useLocalSearchParams();
  
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
  const [showRoundLeaderboard, setShowRoundLeaderboard] = useState(false);
  const [roundLeaderboard, setRoundLeaderboard] = useState<Player[]>([]);
  const [descriptionOrder, setDescriptionOrder] = useState<Player[]>([]);
  const [isProcessingVotes, setIsProcessingVotes] = useState(false);
  const [showRevengerModal, setShowRevengerModal] = useState(false);
  const [revengerPlayer, setRevengerPlayer] = useState<Player | null>(null);
  const [showSpecialRoleCard, setShowSpecialRoleCard] = useState(false);
  const [currentSpecialRolePlayer, setCurrentSpecialRolePlayer] = useState<Player | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const initializeGameSafe = async () => {
      try {
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
        
        const names = JSON.parse(playerNames as string);
        const ids = JSON.parse(playerIds as string);
        const roles = customRoles ? JSON.parse(customRoles as string) : undefined;
        const useSpecial = useSpecialRoles === 'true';
        const specialRoles = selectedSpecialRoles ? JSON.parse(selectedSpecialRoles as string) : [];
        
        const assignedPlayers = GameService.assignRoles(names, selectedWordPair, ids, roles, useSpecial, specialRoles);
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

  const generateDescriptionOrder = (alivePlayers: Player[]) => {
    const shuffled = [...alivePlayers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

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

  const resetVotingState = () => {
    setVotingResults({});
    setCurrentVoterIndex(0);
    setIndividualVotes({});
    setIsProcessingVotes(false);
  };

  const handleMrWhiteElimination = async (player: Player) => {
    console.log('Mr. White eliminated:', player.name);
    setEliminatedPlayer(player);
    
    // Save round data first
    await saveGameRound(player.id, votingResults);
    
    // Show Mr. White guess screen
    setShowMrWhiteGuess(true);
    setCurrentPhase('mr-white-guess');
  };

  const submitMrWhiteGuess = async () => {
    if (!eliminatedPlayer || !wordPair) return;
    
    const isCorrect = mrWhiteGuess.toLowerCase().trim() === wordPair.civilian_word.toLowerCase().trim();
    
    // Update round data with guess
    await saveGameRound(eliminatedPlayer.id, votingResults, mrWhiteGuess, isCorrect);
    
    if (isCorrect) {
      // Mr. White wins!
      const finalPlayers = GameService.calculatePoints(players, 'Mr. White');
      setPlayers(finalPlayers);
      setGameWinner('Mr. White');
      await saveGameResult('Mr. White', finalPlayers);
      setCurrentPhase('final-results');
    } else {
      // Mr. White guessed wrong - Civilians win!
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
  };

  const skipMrWhiteGuess = async () => {
    if (!eliminatedPlayer) return;
    
    // Mr. White skipped guess - Civilians win!
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
  };

  const showRoundResults = (updatedPlayers: Player[]) => {
    const leaderboard = [...updatedPlayers].sort((a, b) => b.points - a.points);
    setRoundLeaderboard(leaderboard);
    setShowRoundLeaderboard(true);
  };

  const startDiscussionTimer = () => {
    setDiscussionTimer(120);
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
      const alivePlayers = players.filter(p => p.isAlive);
      const order = generateDescriptionOrder(alivePlayers);
      setDescriptionOrder(order);
      setCurrentDescriptionIndex(0);
    }
  };

  const startDescriptionPhase = () => {
    const alivePlayers = players.filter(p => p.isAlive);
    const order = generateDescriptionOrder(alivePlayers);
    setDescriptionOrder(order);
    setCurrentPhase('discussion');
  };

  const startVoting = () => {
    resetVotingState();
    setCurrentPhase('voting');
  };

  const castVote = (votedForId: string) => {
    if (isProcessingVotes) return;
    
    // Include Ghost players who can still vote
    const votingPlayers = players.filter(p => p.canVote);
    const currentVoter = votingPlayers[currentVoterIndex];
    
    if (!currentVoter || individualVotes[currentVoter.id]) {
      return;
    }
    
    const newIndividualVotes = { ...individualVotes };
    newIndividualVotes[currentVoter.id] = votedForId;
    setIndividualVotes(newIndividualVotes);
    
    const newResults = { ...votingResults };
    newResults[votedForId] = (newResults[votedForId] || 0) + 1;
    setVotingResults(newResults);
    
    const totalVotesCast = Object.keys(newIndividualVotes).length;
    
    if (totalVotesCast >= votingPlayers.length) {
      processVotingResults(newResults);
    } else {
      setCurrentVoterIndex(currentVoterIndex + 1);
    }
  };

  const processVotingResults = async (results: {[key: string]: number}) => {
    if (isProcessingVotes || currentPhase !== 'voting') return;
    
    setIsProcessingVotes(true);
    
    // Check for Goddess of Justice
    const hasGoddessOfJustice = players.some(p => p.specialRole === 'goddess-of-justice' && p.isAlive);
    
    const { eliminatedPlayerId, tieResolved } = GameService.resolveVotingTie(players, results, hasGoddessOfJustice);
    
    if (!eliminatedPlayerId) {
      const alivePlayers = players.filter(p => p.isAlive);
      const randomPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      
      const message = tieResolved ? 
        'There was a tie in voting. Please vote again to eliminate one player.' :
        'No one received any votes. Randomly eliminating a player.';
      
      Alert.alert(tieResolved ? 'Tie Vote!' : 'No Votes', message, [
        { text: 'OK', onPress: async () => {
          if (tieResolved) {
            resetVotingState();
            setCurrentPhase('voting');
          } else if (randomPlayer) {
            if (randomPlayer.role === 'mrwhite') {
              await handleMrWhiteElimination(randomPlayer);
            } else {
              setEliminatedPlayer(randomPlayer);
              await eliminatePlayer(randomPlayer.id);
            }
          }
        }}
      ]);
      return;
    }
    
    const eliminated = players.find(p => p.id === eliminatedPlayerId);
    
    if (eliminated) {
      setEliminatedPlayer(eliminated);
      
      // Check for Joy Fool win condition
      if (GameService.checkJoyFoolWin(players, eliminatedPlayerId, currentRound)) {
        const finalPlayers = GameService.calculatePoints(players, 'Joy Fool');
        setPlayers(finalPlayers);
        setGameWinner('Joy Fool');
        await saveGameResult('Joy Fool', finalPlayers);
        setCurrentPhase('final-results');
        return;
      }
      
      // Check for Revenger role
      if (eliminated.specialRole === 'revenger') {
        setRevengerPlayer(eliminated);
        setShowRevengerModal(true);
        return;
      }
      
      if (eliminated.role === 'mrwhite') {
        console.log('Processing Mr. White elimination');
        await handleMrWhiteElimination(eliminated);
      } else {
        setCurrentPhase('elimination-result');
        await eliminatePlayer(eliminatedPlayerId);
      }
    }
  };

  const handleRevengerChoice = async (targetId: string) => {
    if (!revengerPlayer) return;
    
    // First eliminate the revenger
    await eliminatePlayer(revengerPlayer.id);
    
    // Then eliminate their target
    const updatedPlayers = GameService.handleRevengerElimination(players, revengerPlayer.id, targetId);
    setPlayers(updatedPlayers);
    
    setShowRevengerModal(false);
    setRevengerPlayer(null);
    
    // Check win condition after chain eliminations
    const { winner, isGameOver } = GameService.checkWinCondition(updatedPlayers);
    if (isGameOver && winner) {
      const finalPlayers = GameService.calculatePoints(updatedPlayers, winner);
      setPlayers(finalPlayers);
      setGameWinner(winner);
      await saveGameResult(winner, finalPlayers);
      setCurrentPhase('final-results');
    } else {
      showRoundResults(updatedPlayers);
    }
  };

  const eliminatePlayer = async (playerId: string) => {
    // Handle special role eliminations and chain reactions
    const { updatedPlayers, chainEliminations } = GameService.handleSpecialRoleElimination(players, playerId);
    
    // Mark primary player as eliminated
    const finalPlayers = updatedPlayers.map(p => 
      p.id === playerId ? { ...p, isAlive: false, eliminationRound: currentRound } : p
    );
    
    setPlayers(finalPlayers);
    
    await saveGameRound(playerId, votingResults);
    
    // Show chain elimination message if any
    if (chainEliminations.length > 0) {
      const chainedNames = chainEliminations
        .map(id => finalPlayers.find(p => p.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      Alert.alert('Chain Elimination!', `${chainedNames} was also eliminated due to special role effects.`);
    }
    
    const { winner, isGameOver } = GameService.checkWinCondition(finalPlayers);
    if (isGameOver && winner) {
      const scoredPlayers = GameService.calculatePoints(finalPlayers, winner);
      setPlayers(scoredPlayers);
      setGameWinner(winner);
      await saveGameResult(winner, scoredPlayers);
      setCurrentPhase('final-results');
    } else {
      showRoundResults(finalPlayers);
    }
  };

  const handleShowSpecialRoleCard = (player: Player) => {
    if (player.specialRole) {
      setCurrentSpecialRolePlayer(player);
      setShowSpecialRoleCard(true);
    }
  };

  const nextRound = () => {
    setCurrentRound(currentRound + 1);
    setCurrentPhase('description');
    const alivePlayers = players.filter(p => p.isAlive);
    const order = generateDescriptionOrder(alivePlayers);
    setDescriptionOrder(order);
    setCurrentDescriptionIndex(0);
    setEliminatedPlayer(null);
    resetVotingState();
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
                  onPress={() => handleShowSpecialRoleCard(currentPlayer)}
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
      </LinearGradient>
    );
  }

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
              <View 
                key={player.id} 
                style={styles.descriptionOrderItem}
              >
                <Text style={styles.descriptionOrderText}>
                  {index + 1}. {player.name}
                </Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.descriptionHint}>
            Each player describes their word in one sentence following this order
          </Text>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={startDescriptionPhase}
          >
            <Text style={styles.nextButtonText}>Start Discussion</Text>
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
    const votingPlayers = players.filter(p => p.canVote);
    const alivePlayers = players.filter(p => p.isAlive);
    const currentVoter = alivePlayers[currentVoterIndex];
    const hasVoted = currentVoter ? individualVotes[currentVoter.id] : false;
    
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Voting Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound} • Voter {currentVoterIndex + 1}/{votingPlayers.length}</Text>
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
              disabled={hasVoted || isProcessingVotes}
            >
              <Text style={styles.votePlayerName}>{player.name}</Text>
              <Text style={styles.voteCount}>
                Current Votes: {votingResults[player.id] || 0}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {hasVoted && currentVoter && (
          <View style={styles.votedConfirmation}>
            <Text style={styles.votedText}>
              ✓ Vote cast for {players.find(p => p.id === individualVotes[currentVoter.id])?.name}
            </Text>
            <Text style={styles.waitingText}>
              Waiting for {votingPlayers.length - Object.keys(individualVotes).length} more players to vote...
            </Text>
          </View>
        )}
      </LinearGradient>
    );
  }

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
              
              <TouchableOpacity
                style={styles.skipGuessButton}
                onPress={skipMrWhiteGuess}
              >
                <SkipForward size={16} color="#9CA3AF" />
                <Text style={styles.skipGuessText}>Skip Guess</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

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

  return (
    <>
      <View />
      
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
                  onPress={() => handleRevengerChoice(player.id)}
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
              onPress={() => setShowSpecialRoleCard(false)}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 16,
  },
});