import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { GameService } from '@/services/gameService';
import { Player, WordPair, GamePhase, SpecialRole, VoteResult } from '@/types/game';

interface UseGameStateProps {
  gameId: string;
  playerCount: number;
  playerNames: string[];
  playerIds: string[];
  customRoles?: string;
  useSpecialRoles?: boolean;
  selectedSpecialRoles?: string[];
}

export function useGameState({
  gameId,
  playerCount,
  playerNames,
  playerIds,
  customRoles,
  useSpecialRoles,
  selectedSpecialRoles,
}: UseGameStateProps) {
  // Core game state
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPhase, setCurrentPhase] = useState<GamePhase>('word-distribution');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [wordPair, setWordPair] = useState<WordPair | null>(null);
  const [startTime] = useState(new Date());
  const [gameWinner, setGameWinner] = useState<string>('');
  
  // Phase-specific state
  const [wordRevealed, setWordRevealed] = useState(false);
  const [descriptionOrder, setDescriptionOrder] = useState<Player[]>([]);
  const [currentDescriptionIndex, setCurrentDescriptionIndex] = useState(0);
  const [discussionTimer, setDiscussionTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Voting state
  const [votingResults, setVotingResults] = useState<{[key: string]: number}>({});
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [individualVotes, setIndividualVotes] = useState<{[voterId: string]: string}>({});
  const [isProcessingVotes, setIsProcessingVotes] = useState(false);
  
  // Elimination state
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);
  const [showRoundLeaderboard, setShowRoundLeaderboard] = useState(false);
  const [roundLeaderboard, setRoundLeaderboard] = useState<Player[]>([]);
  
  // Mr. White guess state
  const [mrWhiteGuess, setMrWhiteGuess] = useState('');
  const [showMrWhiteGuess, setShowMrWhiteGuess] = useState(false);
  
  // Special roles state
  const [showRevengerModal, setShowRevengerModal] = useState(false);
  const [revengerPlayer, setRevengerPlayer] = useState<Player | null>(null);
  const [showSpecialRoleCard, setShowSpecialRoleCard] = useState(false);
  const [currentSpecialRolePlayer, setCurrentSpecialRolePlayer] = useState<Player | null>(null);

  // Initialize game
  useEffect(() => {
    let isMounted = true;
    
    const initializeGame = async () => {
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
        
        const names = JSON.parse(playerNames as any);
        const ids = JSON.parse(playerIds as any);
        const roles = customRoles ? JSON.parse(customRoles as any) : undefined;
        const useSpecial = useSpecialRoles === true || useSpecialRoles === 'true';
        const specialRoles = selectedSpecialRoles ? JSON.parse(selectedSpecialRoles as any) : [];
        
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
    
    initializeGame();
    
    return () => {
      isMounted = false;
    };
  }, [gameId, playerCount, playerNames, playerIds, customRoles, useSpecialRoles, selectedSpecialRoles]);

  // Timer effect
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

  // Helper functions
  const getVotingPlayers = useCallback(() => {
    return players.filter(p => p.canVote);
  }, [players]);

  const getAlivePlayers = useCallback(() => {
    return players.filter(p => p.isAlive);
  }, [players]);

  const getCurrentVoter = useCallback(() => {
    const votingPlayers = getVotingPlayers();
    return votingPlayers[currentVoterIndex] || null;
  }, [getVotingPlayers, currentVoterIndex]);

  const resetVotingState = useCallback(() => {
    setVotingResults({});
    setCurrentVoterIndex(0);
    setIndividualVotes({});
    setIsProcessingVotes(false);
  }, []);

  const generateDescriptionOrder = useCallback((alivePlayers: Player[]) => {
    const shuffled = [...alivePlayers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const saveGameRound = useCallback(async (
    eliminatedPlayerId: string, 
    voteResults: {[key: string]: number}, 
    mrWhiteGuess?: string, 
    mrWhiteGuessCorrect?: boolean
  ) => {
    try {
      await GameService.saveGameRound(
        gameId,
        currentRound,
        eliminatedPlayerId,
        voteResults,
        mrWhiteGuess,
        mrWhiteGuessCorrect
      );
    } catch (error) {
      console.error('Error saving game round:', error);
    }
  }, [gameId, currentRound]);

  const saveGameResult = useCallback(async (winner: string, finalPlayers: Player[]) => {
    try {
      const duration = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
      const playerIdsArray = JSON.parse(playerIds as any);
      
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
        await GameService.saveGameResult(gameId, gameResult, wordPair, playerIdsArray);
      }
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  }, [gameId, currentRound, startTime, playerIds, wordPair]);

  const showRoundResults = useCallback((updatedPlayers: Player[]) => {
    const leaderboard = [...updatedPlayers].sort((a, b) => b.points - a.points);
    setRoundLeaderboard(leaderboard);
    setShowRoundLeaderboard(true);
  }, []);

  return {
    // State
    players,
    currentPhase,
    currentPlayerIndex,
    currentRound,
    wordPair,
    gameWinner,
    wordRevealed,
    descriptionOrder,
    currentDescriptionIndex,
    discussionTimer,
    isTimerRunning,
    votingResults,
    currentVoterIndex,
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
    
    // Setters
    setPlayers,
    setCurrentPhase,
    setCurrentPlayerIndex,
    setCurrentRound,
    setWordRevealed,
    setDescriptionOrder,
    setCurrentDescriptionIndex,
    setDiscussionTimer,
    setIsTimerRunning,
    setVotingResults,
    setCurrentVoterIndex,
    setIndividualVotes,
    setIsProcessingVotes,
    setEliminatedPlayer,
    setShowRoundLeaderboard,
    setRoundLeaderboard,
    setMrWhiteGuess,
    setShowMrWhiteGuess,
    setShowRevengerModal,
    setRevengerPlayer,
    setShowSpecialRoleCard,
    setCurrentSpecialRolePlayer,
    setGameWinner,
    
    // Helper functions
    getVotingPlayers,
    getAlivePlayers,
    getCurrentVoter,
    resetVotingState,
    generateDescriptionOrder,
    saveGameRound,
    saveGameResult,
    showRoundResults,
  };
}