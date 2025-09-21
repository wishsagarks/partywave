// hooks/useGameFlowManager.tsx
import { useState, useCallback, useRef } from 'react';
import { GameService } from '@/services/gameService';
import { Player, GamePhase } from '@/types/game';

interface GameFlowState {
  gameId: string;
  players: Player[];
  currentPhase: GamePhase;
  currentRound: number;
  wordPair: any;
  gameWinner: string | null;
  eliminatedPlayer: Player | null;
  eliminationHistory: Array<{
    round: number;
    player: Player;
    votesReceived: number;
    eliminationMethod: 'voting' | 'chain' | 'revenger' | 'mr-white-guess';
  }>;
  votingResults: Record<string, number>;
  individualVotes: Record<string, string>;
  currentVoterIndex: number;
  isProcessingVotes: boolean;
  mrWhiteGuess: string;
  showMrWhiteGuess: boolean;
  showEliminationResult: boolean;
}

interface GameFlowActions {
  initializeGame: (params: any) => Promise<void>;
  advancePhase: (nextPhase: GamePhase) => void;
  processVote: (voterId: string, targetId: string) => Promise<void>;
  processElimination: (playerId?: string) => Promise<void>;
  processMrWhiteGuess: (guess: string) => Promise<void>;
  skipMrWhiteGuess: () => Promise<void>;
  endGame: (winner: string) => Promise<void>;
  resetGame: () => void;
  updateState: (updates: Partial<GameFlowState>) => void;
  setCurrentRound: (round: number) => void;
}

export const useGameFlowManager = (): [GameFlowState, GameFlowActions] => {
  const logRef = useRef<string[]>([]);

  const log = useCallback((message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage, data || '');
    logRef.current.push(logMessage);
  }, []);

  const [state, setState] = useState<GameFlowState>({
    gameId: '',
    players: [],
    currentPhase: 'setup',
    currentRound: 1,
    wordPair: null,
    gameWinner: null,
    eliminatedPlayer: null,
    eliminationHistory: [],
    votingResults: {},
    individualVotes: {},
    currentVoterIndex: 0,
    isProcessingVotes: false,
    mrWhiteGuess: '',
    showMrWhiteGuess: false,
    showEliminationResult: false,
  });

  const updateState = useCallback((updates: Partial<GameFlowState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      log('State updated', { updates, newState });
      return newState;
    });
  }, [log]);

  const setCurrentRound = useCallback((round: number) => {
    updateState({ currentRound: round });
  }, [updateState]);

  /**
   * IMPORTANT: endGame must be declared before processElimination / processMrWhiteGuess
   * because they reference it in their implementation and dependency arrays.
   */
  const endGame = useCallback(async (winner: string) => {
    try {
      log('Ending game', { winner });

      const duration = 15; // placeholder, you can compute real duration
      const result = {
        winner,
        totalRounds: state.currentRound,
        duration,
        players: state.players.map(player => ({
          id: player.id,
          name: player.name,
          role: player.role,
          word: player.word,
          points: player.points || 0,
          wasWinner:
            winner.toLowerCase().includes(player.role) ||
            (winner === 'Civilians' && player.role === 'civilian') ||
            (winner === 'Impostors' && (player.role === 'undercover' || player.role === 'mrwhite')),
        })),
      };

      await GameService.saveGameResult(
        state.gameId,
        result,
        state.wordPair,
        state.players.map(p => p.id)
      );

      log('Game ended successfully');
    } catch (error) {
      log('Game end failed', error);
      throw error;
    }
  }, [state, log]);

  /**
   * processElimination: declared after endGame so it can call await endGame(...)
   */
  const processElimination = useCallback(async (playerId?: string) => {
    try {
      log('Processing elimination', { playerId, votingResults: state.votingResults });

      let eliminatedPlayerId = playerId;

      if (!eliminatedPlayerId) {
        const votes = Object.values(state.votingResults);
        const maxVotes = votes.length ? Math.max(...votes) : 0;
        const tiedPlayerIds = Object.keys(state.votingResults).filter(id => state.votingResults[id] === maxVotes);

        if (tiedPlayerIds.length > 1) {
          const goddessPlayer = state.players.find(p =>
            p.specialRole === 'goddess-of-justice' && (p.isAlive || p.canVote)
          );

          if (goddessPlayer) {
            eliminatedPlayerId = tiedPlayerIds[Math.floor(Math.random() * tiedPlayerIds.length)];
            log('Goddess of Justice broke tie', { eliminatedPlayerId });
          } else {
            log('Unresolved tie, no elimination');
            updateState({
              isProcessingVotes: false,
              votingResults: {},
              individualVotes: {},
              currentVoterIndex: 0,
              currentPhase: 'discussion',
            });
            return;
          }
        } else {
          eliminatedPlayerId = tiedPlayerIds[0];
        }
      }

      const eliminatedPlayer = state.players.find(p => p.id === eliminatedPlayerId);
      if (!eliminatedPlayer) {
        throw new Error('Eliminated player not found');
      }

      log('Player eliminated', { player: eliminatedPlayer.name, role: eliminatedPlayer.role });

      const eliminationEntry = {
        round: state.currentRound,
        player: eliminatedPlayer,
        votesReceived: state.votingResults[eliminatedPlayerId] || 0,
        eliminationMethod: 'voting' as const,
      };

      await GameService.saveGameRound(
        state.gameId,
        state.currentRound,
        eliminatedPlayerId,
        state.votingResults
      );

      updateState({
        eliminatedPlayer,
        eliminationHistory: [...state.eliminationHistory, eliminationEntry],
        showEliminationResult: true,
        currentPhase: 'elimination-result',
        isProcessingVotes: false,
      });

      if (eliminatedPlayer.role === 'mrwhite') {
        log('Mr. White eliminated, showing guess screen');
        updateState({
          showMrWhiteGuess: true,
          isProcessingVotes: false,
        });
      } else {
        const updatedPlayers = state.players.map(p =>
          p.id === eliminatedPlayerId ? { ...p, isAlive: false, eliminationRound: state.currentRound } : p
        );

        const { winner, isGameOver } = GameService.checkWinCondition(updatedPlayers);

        if (isGameOver && winner) {
          log('Game over', { winner });
          const scoredPlayers = GameService.calculatePoints(updatedPlayers, winner);
          updateState({
            players: scoredPlayers,
            gameWinner: winner,
            currentPhase: 'final-results',
            isProcessingVotes: false,
            eliminatedPlayer: null,
          });
          await endGame(winner);
        } else {
          log('Game continues to next round');
          updateState({
            players: updatedPlayers,
            currentRound: state.currentRound + 1,
            votingResults: {},
            individualVotes: {},
            currentVoterIndex: 0,
            isProcessingVotes: false,
            showEliminationResult: false,
            eliminatedPlayer: null,
            currentPhase: 'description',
          });
        }
      }
    } catch (error) {
      log('Elimination processing failed', error);
      updateState({ isProcessingVotes: false });
      throw error;
    }
  }, [state, updateState, log, endGame]);

  /**
   * processVote: declared after processElimination because it calls it
   */
  const processVote = useCallback(async (voterId: string, targetId: string) => {
    try {
      log('Processing vote', { voterId, targetId, currentVoterIndex: state.currentVoterIndex });

      const voter = state.players.find(p => p.id === voterId);
      const target = state.players.find(p => p.id === targetId);

      if (!voter || !target) {
        throw new Error('Invalid voter or target');
      }

      if (!voter.isAlive && !voter.canVote) {
        throw new Error('Voter cannot vote');
      }

      if (!target.isAlive) {
        throw new Error('Cannot vote for eliminated player');
      }

      if (state.individualVotes[voterId]) {
        throw new Error('Player has already voted');
      }

      const newIndividualVotes = { ...state.individualVotes, [voterId]: targetId };
      const newVotingResults = { ...state.votingResults };
      newVotingResults[targetId] = (newVotingResults[targetId] || 0) + 1;

      const votingPlayers = state.players.filter(p => p.isAlive || p.canVote);
      const totalVotesNeeded = votingPlayers.length;
      const totalVotesCast = Object.keys(newIndividualVotes).length;

      updateState({
        individualVotes: newIndividualVotes,
        votingResults: newVotingResults,
        currentVoterIndex: state.currentVoterIndex + 1,
      });

      log('Vote processed', { totalVotesCast, totalVotesNeeded, newVotingResults });

      if (totalVotesCast >= totalVotesNeeded) {
        log('All votes collected, processing elimination');
        updateState({ isProcessingVotes: true });
        await processElimination('');
      }
    } catch (error) {
      log('Vote processing failed', error);
      throw error;
    }
  }, [state, updateState, log, processElimination]);

  /**
   * Mr. White guess processing. Declared after endGame/processElimination.
   */
  const processMrWhiteGuess = useCallback(async (guess: string) => {
    try {
      log('Processing Mr. White guess', { guess, correctWord: state.wordPair?.civilian_word });

      if (!state.eliminatedPlayer || !state.wordPair) {
        throw new Error('Invalid Mr. White guess state');
      }

      const isCorrect = guess.toLowerCase().trim() === state.wordPair.civilian_word.toLowerCase().trim();

      await GameService.saveGameRound(
        state.gameId,
        state.currentRound,
        state.eliminatedPlayer.id,
        state.votingResults,
        guess,
        isCorrect
      );

      // Clear guess UI
      updateState({
        showMrWhiteGuess: false,
        mrWhiteGuess: '',
        showEliminationResult: false,
      });

      if (isCorrect) {
        log('Mr. White guessed correctly, wins the game');
        const scoredPlayers = GameService.calculatePoints(state.players, 'Mr. White');

        const updatedHistory = state.eliminationHistory.map(entry =>
          entry.player.id === state.eliminatedPlayer?.id
            ? { ...entry, eliminationMethod: 'mr-white-guess' as const }
            : entry
        );

        updateState({
          players: scoredPlayers,
          gameWinner: 'Mr. White',
          currentPhase: 'final-results',
          eliminationHistory: updatedHistory,
          showEliminationResult: false,
          eliminatedPlayer: null,
          isProcessingVotes: false,
        });
        await endGame('Mr. White');
      } else {
        log('Mr. White guessed incorrectly, eliminating and checking win conditions');

        const updatedPlayers = state.players.map(p =>
          p.id === state.eliminatedPlayer!.id ? { ...p, isAlive: false, eliminationRound: state.currentRound } : p
        );

        const { winner, isGameOver } = GameService.checkWinCondition(updatedPlayers);

        if (isGameOver && winner) {
          log('Game over after Mr. White elimination', { winner });
          const scoredPlayers = GameService.calculatePoints(updatedPlayers, winner);
          updateState({
            players: scoredPlayers,
            gameWinner: winner,
            currentPhase: 'final-results',
            showEliminationResult: false,
            eliminatedPlayer: null,
            isProcessingVotes: false,
          });
          await endGame(winner);
        } else {
          log('Game continues after Mr. White elimination');
          updateState({
            players: updatedPlayers,
            currentRound: state.currentRound + 1,
            votingResults: {},
            individualVotes: {},
            currentVoterIndex: 0,
            showEliminationResult: false,
            eliminatedPlayer: null,
            currentPhase: 'description',
            isProcessingVotes: false,
          });
        }
      }
    } catch (error) {
      log('Mr. White guess processing failed', error);
      updateState({
        showMrWhiteGuess: false,
        mrWhiteGuess: '',
        showEliminationResult: false,
        isProcessingVotes: false,
      });
      throw error;
    }
  }, [state, updateState, log, endGame]);

  /**
   * skipMrWhiteGuess: declared after processMrWhiteGuess because it uses similar flow
   */
  const skipMrWhiteGuess = useCallback(async () => {
    try {
      log('Skipping Mr. White guess');

      if (!state.eliminatedPlayer) {
        throw new Error('No eliminated player to skip guess for');
      }

      await GameService.saveGameRound(
        state.gameId,
        state.currentRound,
        state.eliminatedPlayer.id,
        state.votingResults
      );

      updateState({
        showMrWhiteGuess: false,
        mrWhiteGuess: '',
        showEliminationResult: false,
      });

      const updatedPlayers = state.players.map(p =>
        p.id === state.eliminatedPlayer!.id ? { ...p, isAlive: false, eliminationRound: state.currentRound } : p
      );

      const { winner, isGameOver } = GameService.checkWinCondition(updatedPlayers);

      if (isGameOver && winner) {
        log('Game over after skipping Mr. White guess', { winner });
        const scoredPlayers = GameService.calculatePoints(updatedPlayers, winner);
        updateState({
          players: scoredPlayers,
          gameWinner: winner,
          currentPhase: 'final-results',
          showEliminationResult: false,
          eliminatedPlayer: null,
          isProcessingVotes: false,
        });
        await endGame(winner);
      } else {
        log('Game continues after skipping Mr. White guess');
        updateState({
          players: updatedPlayers,
          currentRound: state.currentRound + 1,
          votingResults: {},
          individualVotes: {},
          currentVoterIndex: 0,
          showEliminationResult: false,
          eliminatedPlayer: null,
          currentPhase: 'description',
          isProcessingVotes: false,
        });
      }
    } catch (error) {
      log('Skip Mr. White guess failed', error);
      updateState({
        showMrWhiteGuess: false,
        mrWhiteGuess: '',
        showEliminationResult: false,
        isProcessingVotes: false,
      });
      throw error;
    }
  }, [state, updateState, log, endGame]);

  /**
   * initializeGame, advancePhase, resetGame etc.
   */
  const initializeGame = useCallback(async (params: any) => {
    try {
      log('Initializing game', params);

      const gameData = await GameService.initializeGame({
        gameId: params.gameId,
        playerCount: params.playerCount,
        playerNames: JSON.parse(params.playerNames || '[]'),
        playerIds: JSON.parse(params.playerIds || '[]'),
        customRoles: params.customRoles ? JSON.parse(params.customRoles) : undefined,
        useSpecialRoles: params.useSpecialRoles === 'true',
        selectedSpecialRoles: params.selectedSpecialRoles ? JSON.parse(params.selectedSpecialRoles) : [],
      });

      if (!gameData) {
        throw new Error('Failed to initialize game data');
      }

      updateState({
        gameId: params.gameId,
        players: gameData.players,
        wordPair: gameData.wordPair,
        currentPhase: 'word-distribution',
        currentRound: 1,
        eliminationHistory: [],
        votingResults: {},
        individualVotes: {},
        currentVoterIndex: 0,
      });

      log('Game initialized successfully', gameData);
    } catch (error) {
      log('Game initialization failed', error);
      throw error;
    }
  }, [updateState, log]);

  const advancePhase = useCallback((nextPhase: GamePhase) => {
    log(`Advancing phase from ${state.currentPhase} to ${nextPhase}`);
    updateState({ currentPhase: nextPhase });
  }, [state.currentPhase, updateState, log]);

  const resetGame = useCallback(() => {
    log('Resetting game');
    setState({
      gameId: '',
      players: [],
      currentPhase: 'setup',
      currentRound: 1,
      wordPair: null,
      gameWinner: null,
      eliminatedPlayer: null,
      eliminationHistory: [],
      votingResults: {},
      individualVotes: {},
      currentVoterIndex: 0,
      isProcessingVotes: false,
      mrWhiteGuess: '',
      showMrWhiteGuess: false,
      showEliminationResult: false,
    });
  }, [log]);

  const actions: GameFlowActions = {
    initializeGame,
    advancePhase,
    processVote,
    processElimination,
    processMrWhiteGuess,
    skipMrWhiteGuess,
    endGame,
    resetGame,
    updateState,
    setCurrentRound,
  };

  return [state, actions];
};
