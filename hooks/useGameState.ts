import { useState, useCallback, useEffect, useRef } from 'react';
import { GameService } from '@/services/gameService';
import { Player } from '@/types/game';

interface GameStateParams {
  gameId: string;
  playerCount: number;
  playerNames: string;
  playerIds: string;
  customRoles: string;
  useSpecialRoles: boolean;
  selectedSpecialRoles: string;
}

export const useGameState = (params: GameStateParams) => {
  // Parse parameters
  const parsedPlayerNames = JSON.parse(params.playerNames || '[]');
  const parsedPlayerIds = JSON.parse(params.playerIds || '[]');
  const parsedCustomRoles = params.customRoles ? JSON.parse(params.customRoles) : {};
  const parsedSelectedSpecialRoles = params.selectedSpecialRoles ? JSON.parse(params.selectedSpecialRoles) : [];

  // Core game state
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('word-distribution');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [wordPair, setWordPair] = useState<any>(null);
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  const [wordRevealed, setWordRevealed] = useState(false);
  const [descriptionOrder, setDescriptionOrder] = useState<Player[]>([]);
  
  // Timer state
  const [discussionTimer, setDiscussionTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Voting state
  const [votingResults, setVotingResults] = useState<Record<string, number>>({});
  const [individualVotes, setIndividualVotes] = useState<Record<string, string>>({});
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [isProcessingVotes, setIsProcessingVotes] = useState(false);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);

  // Round results state
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
    const initializeGame = async () => {
      try {
        const gameData = await GameService.initializeGame({
          gameId: params.gameId,
          playerCount: params.playerCount,
          playerNames: parsedPlayerNames,
          playerIds: parsedPlayerIds,
          customRoles: parsedCustomRoles,
          useSpecialRoles: params.useSpecialRoles,
          selectedSpecialRoles: parsedSelectedSpecialRoles,
        });

        setPlayers(gameData.players);
        setWordPair(gameData.wordPair);
      } catch (error) {
        console.error('Failed to initialize game:', error);
      }
    };

    initializeGame();
  }, [params.gameId]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && discussionTimer > 0) {
      timerRef.current = setTimeout(() => {
        setDiscussionTimer(prev => prev - 1);
      }, 1000);
    } else if (discussionTimer === 0) {
      setIsTimerRunning(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [discussionTimer, isTimerRunning]);

  // Helper functions
  const getAlivePlayers = useCallback(() => {
    return players.filter(player => player.isAlive);
  }, [players]);

  const getVotingPlayers = useCallback(() => {
    return players.filter(player => player.isAlive || player.canVote);
  }, [players]);

  const getCurrentVoter = useCallback(() => {
    const votingPlayers = getVotingPlayers();
    return votingPlayers[currentVoterIndex] || null;
  }, [getVotingPlayers, currentVoterIndex]);

  const resetVotingState = useCallback(() => {
    setVotingResults({});
    setIndividualVotes({});
    setCurrentVoterIndex(0);
    setIsProcessingVotes(false);
  }, []);

  const generateDescriptionOrder = useCallback((alivePlayers: Player[]) => {
    const shuffled = [...alivePlayers].sort(() => Math.random() - 0.5);
    return shuffled;
  }, []);

  const saveGameRound = useCallback(async (eliminatedPlayerId: string, votes: Record<string, number>, mrWhiteGuess?: string, isCorrect?: boolean) => {
    try {
      await GameService.saveGameRound({
        gameId: params.gameId,
        roundNumber: currentRound,
        eliminatedPlayerId,
        voteResults: votes,
        mrWhiteGuess,
        mrWhiteGuessCorrect: isCorrect,
      });
    } catch (error) {
      console.error('Failed to save game round:', error);
    }
  }, [params.gameId, currentRound]);

  const saveGameResult = useCallback(async (winner: string, finalPlayers: Player[]) => {
    try {
      await GameService.saveGameResult({
        gameId: params.gameId,
        winner,
        players: finalPlayers,
        totalRounds: currentRound,
        wordPair,
      });
    } catch (error) {
      console.error('Failed to save game result:', error);
    }
  }, [params.gameId, currentRound, wordPair]);

  const showRoundResults = useCallback((updatedPlayers: Player[]) => {
    const leaderboard = [...updatedPlayers].sort((a, b) => (b.points || 0) - (a.points || 0));
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
    discussionTimer,
    isTimerRunning,
    votingResults,
    individualVotes,
    currentVoterIndex,
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
    setDiscussionTimer,
    setIsTimerRunning,
    setVotingResults,
    setIndividualVotes,
    setCurrentVoterIndex,
    setIsProcessingVotes,
    setEliminatedPlayer,
    setShowRoundLeaderboard,
    setMrWhiteGuess,
    setShowMrWhiteGuess,
    setGameWinner,
    setShowRevengerModal,
    setRevengerPlayer,
    setShowSpecialRoleCard,
    setCurrentSpecialRolePlayer,

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
};