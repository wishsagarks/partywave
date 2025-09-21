// src/hooks/useGameFlowManager.tsx
import { useCallback, useRef, useState } from 'react';
import { GameService } from '@/services/gameService';
import { Player, GamePhase } from '@/types/game';

interface EliminationHistoryEntry {
  round: number;
  player: Player;
  votesReceived: number;
  eliminationMethod: 'voting' | 'chain' | 'revenger' | 'mr-white-guess';
}

interface GameFlowState {
  gameId: string;
  players: Player[];
  currentPhase: GamePhase;
  currentRound: number;
  wordPair: any | null;
  gameWinner: string | null;
  eliminatedPlayer: Player | null;
  eliminationHistory: EliminationHistoryEntry[];
  votingResults: Record<string, number>;
  individualVotes: Record<string, string>;
  currentVoterIndex: number;
  isProcessingVotes: boolean;
  mrWhiteGuess: string;
  showMrWhiteGuess: boolean;
  showEliminationResult: boolean;
  descriptionOrder: string[]; // order of player ids for description phase
}

interface GameFlowActions {
  initializeGame: (params: any) => Promise<void>;
  advancePhase: (nextPhase: GamePhase) => void;
  processVote: (voterId: string, targetId: string) => Promise<void>;
  processElimination: (playerId?: string) => Promise<void>;
  processMrWhiteGuess: (guess: string) => Promise<void>;
  skipMrWhiteGuess: () => Promise<void>;
  endGame: (winner: string) => Promise<void>;
  updateState: (updates: Partial<GameFlowState>) => void;
  resetGame: () => void;
}

export const useGameFlowManager = (): [GameFlowState, GameFlowActions] => {
  const logRef = useRef<string[]>([]);
  const log = useCallback((msg: string, data?: any) => {
    const ts = new Date().toISOString();
    const text = `[${ts}] ${msg}`;
    // eslint-disable-next-line no-console
    console.log(text, data ?? '');
    logRef.current.push(text);
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
    descriptionOrder: [],
  });

  const updateState = useCallback((updates: Partial<GameFlowState>) => {
    setState(prev => {
      const next = { ...prev, ...updates };
      log('State update', { updates, next });
      return next;
    });
  }, [log]);

  // Helper selectors
  const getVotingPlayers = useCallback(() => state.players.filter(p => p.isAlive), [state.players]);
  const getAlivePlayers = useCallback(() => state.players.filter(p => p.isAlive), [state.players]);

  /* ------------------------------
     Define endGame BEFORE other callbacks that call it
     ------------------------------ */
  const endGame = useCallback(async (winner: string) => {
    try {
      log('endGame called', { winner });
      const duration = 0; // you may compute real duration if you track timestamps
      const result = {
        winner,
        totalRounds: state.currentRound,
        duration,
        players: state.players.map(p => ({
          id: p.id,
          name: p.name,
          role: p.role,
          word: p.word,
          points: p.points || 0,
        })),
      };

      await GameService.saveGameResult(state.gameId, result, state.wordPair, state.players.map(p => p.id));
      updateState({ gameWinner: winner, currentPhase: 'final-results' });
      log('endGame saved');
    } catch (err) {
      log('endGame failed', err);
      throw err;
    }
  }, [state, updateState, log]);

  /* ------------------------------
     Define processElimination BEFORE processVote (because processVote calls it)
     ------------------------------ */
  const processElimination = useCallback(async (playerId?: string) => {
    try {
      log('processElimination start', { playerId, votingResults: state.votingResults });

      let eliminatedPlayerId = playerId;

      // Decide eliminated player from votingResults if playerId not provided
      if (!eliminatedPlayerId) {
        const votes = state.votingResults || {};
        const voteValues = Object.values(votes);
        if (voteValues.length === 0) {
          // No votes => reset and go back to discussion
          updateState({
            isProcessingVotes: false,
            votingResults: {},
            individualVotes: {},
            currentVoterIndex: 0,
            currentPhase: 'discussion',
          });
          log('No votes - returning to discussion');
          return;
        }

        const maxVotes = Math.max(...voteValues);
        const tiedIds = Object.keys(votes).filter(id => votes[id] === maxVotes);

        if (tiedIds.length > 1) {
          // tie-breaker: check for goddess-of-justice if available
          const goddess = state.players.find(p => p.specialRole === 'goddess-of-justice' && p.isAlive);
          if (goddess) {
            eliminatedPlayerId = tiedIds[Math.floor(Math.random() * tiedIds.length)];
            log('Goddess broke tie', { eliminatedPlayerId });
          } else {
            // unresolved tie -> reset votes and return to discussion for re-vote
            updateState({
              isProcessingVotes: false,
              votingResults: {},
              individualVotes: {},
              currentVoterIndex: 0,
              currentPhase: 'discussion',
            });
            log('Tie unresolved -> back to discussion', { tiedIds });
            return;
          }
        } else {
          eliminatedPlayerId = tiedIds[0];
        }
      }

      const eliminated = state.players.find(p => p.id === eliminatedPlayerId);
      if (!eliminated) {
        throw new Error('Eliminated player not found');
      }

      // Persist round data (best-effort)
      try {
        await GameService.saveGameRound(state.gameId, state.currentRound, eliminatedPlayerId, state.votingResults);
      } catch (err) {
        log('saveGameRound failed (continuing)', err);
      }

      // If Mr. White -> special flow (do not mark dead yet; allow guess)
      if (eliminated.role === 'mrwhite') {
        updateState({
          eliminatedPlayer: eliminated,
          showEliminationResult: true,
          showMrWhiteGuess: true,
          isProcessingVotes: false,
          currentPhase: 'elimination-result',
        });
        log('Mr White eliminated -> show guess');
        return;
      }

      // Normal elimination: mark player dead
      const updatedPlayers = state.players.map(p =>
        p.id === eliminated.id ? { ...p, isAlive: false, eliminationRound: state.currentRound } : p
      );

      const historyEntry: EliminationHistoryEntry = {
        round: state.currentRound,
        player: eliminated,
        votesReceived: state.votingResults[eliminated.id] || 0,
        eliminationMethod: 'voting',
      };

      // Check win condition after elimination
      const { winner, isGameOver } = GameService.checkWinCondition(updatedPlayers);

      if (isGameOver && winner) {
        const scored = GameService.calculatePoints(updatedPlayers, winner);
        updateState({
          players: scored,
          eliminationHistory: [...state.eliminationHistory, historyEntry],
          eliminatedPlayer: eliminated,
          showEliminationResult: true,
          currentPhase: 'final-results',
          isProcessingVotes: false,
          gameWinner: winner,
        });
        await endGame(winner);
        log('Game ended after elimination', { winner });
        return;
      }

      // Continue to next round
      updateState({
        players: updatedPlayers,
        eliminationHistory: [...state.eliminationHistory, historyEntry],
        eliminatedPlayer: eliminated,
        showEliminationResult: true,
        isProcessingVotes: false,
        votingResults: {},
        individualVotes: {},
        currentVoterIndex: 0,
        currentRound: state.currentRound + 1,
        currentPhase: 'description',
      });

      log('Elimination applied, continue to next round', { nextRound: state.currentRound + 1 });
    } catch (err) {
      log('processElimination error', err);
      updateState({ isProcessingVotes: false });
      throw err;
    }
  }, [state, updateState, log, endGame]);

  /* ------------------------------
     Now we can safely declare processVote (it calls processElimination)
     ------------------------------ */
  const processVote = useCallback(async (voterId: string, targetId: string) => {
    try {
      log('processVote', { voterId, targetId, currentVoterIndex: state.currentVoterIndex });

      const voter = state.players.find(p => p.id === voterId);
      const target = state.players.find(p => p.id === targetId);

      if (!voter || !target) throw new Error('Invalid voter or target');
      if (!voter.isAlive) throw new Error('Eliminated player cannot vote');
      if (!target.isAlive) throw new Error('Cannot vote for eliminated player');
      if (state.individualVotes[voterId]) throw new Error('Player already voted');

      const newIndividualVotes = { ...state.individualVotes, [voterId]: targetId };
      const newVotingResults = { ...state.votingResults };
      newVotingResults[targetId] = (newVotingResults[targetId] || 0) + 1;

      const votingPlayers = getVotingPlayers();
      const totalVotesNeeded = votingPlayers.length;
      const totalVotesCast = Object.keys(newIndividualVotes).length;

      updateState({
        individualVotes: newIndividualVotes,
        votingResults: newVotingResults,
        currentVoterIndex: Math.min(state.currentVoterIndex + 1, Math.max(0, votingPlayers.length - 1)),
      });

      log('Vote recorded', { totalVotesCast, totalVotesNeeded, newVotingResults });

      if (totalVotesCast >= totalVotesNeeded) {
        updateState({ isProcessingVotes: true });
        // Let processElimination decide who is eliminated (based on votingResults)
        await processElimination();
      }
    } catch (err) {
      log('processVote failed', err);
      throw err;
    }
  }, [state, updateState, log, getVotingPlayers, processElimination]);

  /* ------------------------------
     Mr. White guess handlers (can call endGame)
     ------------------------------ */
  const processMrWhiteGuess = useCallback(async (guess: string) => {
    try {
      log('processMrWhiteGuess', { guess });
      if (!state.eliminatedPlayer || !state.wordPair) throw new Error('Invalid Mr. White guess state');

      const normalized = (guess || '').toString().trim().toLowerCase();
      const correct = (state.wordPair.civilian_word || '').toString().trim().toLowerCase();
      const isCorrect = normalized === correct;

      try {
        await GameService.saveGameRound(state.gameId, state.currentRound, state.eliminatedPlayer.id, state.votingResults, guess, isCorrect);
      } catch (saveErr) {
        log('saveGameRound failed for mrwhite (continuing)', saveErr);
      }

      // Reset UI flags
      updateState({
        showMrWhiteGuess: false,
        mrWhiteGuess: '',
        showEliminationResult: false,
      });

      if (isCorrect) {
        // Mr White wins immediately
        const scored = GameService.calculatePoints(state.players, 'Mr. White');
        const updatedHistory = state.eliminationHistory.map(e =>
          e.player.id === state.eliminatedPlayer!.id ? { ...e, eliminationMethod: 'mr-white-guess' } : e
        );

        updateState({
          players: scored,
          gameWinner: 'Mr. White',
          eliminationHistory: updatedHistory,
          currentPhase: 'final-results',
        });

        await endGame('Mr. White');
        log('Mr White guessed correctly and won');
        return;
      }

      // Incorrect -> mark mrwhite dead and continue
      const updatedPlayers = state.players.map(p =>
        p.id === state.eliminatedPlayer!.id ? { ...p, isAlive: false, eliminationRound: state.currentRound } : p
      );

      const { winner, isGameOver } = GameService.checkWinCondition(updatedPlayers);

      if (isGameOver && winner) {
        const scored = GameService.calculatePoints(updatedPlayers, winner);
        updateState({
          players: scored,
          gameWinner: winner,
          currentPhase: 'final-results',
          showEliminationResult: false,
        });
        await endGame(winner);
        log('Game ended after mrwhite incorrect guess', { winner });
        return;
      }

      updateState({
        players: updatedPlayers,
        currentRound: state.currentRound + 1,
        votingResults: {},
        individualVotes: {},
        currentVoterIndex: 0,
        showEliminationResult: false,
        currentPhase: 'description',
      });

      log('Mr White guessed incorrectly -> continue');
    } catch (err) {
      log('processMrWhiteGuess failed', err);
      updateState({ showMrWhiteGuess: false, mrWhiteGuess: '', showEliminationResult: false });
      throw err;
    }
  }, [state, updateState, log, endGame]);

  const skipMrWhiteGuess = useCallback(async () => {
    try {
      log('skipMrWhiteGuess');
      if (!state.eliminatedPlayer) throw new Error('No eliminated player to skip');

      try {
        await GameService.saveGameRound(state.gameId, state.currentRound, state.eliminatedPlayer.id, state.votingResults);
      } catch (saveErr) {
        log('saveGameRound failed on skip (continuing)', saveErr);
      }

      const updatedPlayers = state.players.map(p =>
        p.id === state.eliminatedPlayer!.id ? { ...p, isAlive: false, eliminationRound: state.currentRound } : p
      );

      const { winner, isGameOver } = GameService.checkWinCondition(updatedPlayers);

      if (isGameOver && winner) {
        const scored = GameService.calculatePoints(updatedPlayers, winner);
        updateState({
          players: scored,
          gameWinner: winner,
          currentPhase: 'final-results',
          showEliminationResult: false,
        });
        await endGame(winner);
        log('Game ended after skipping mrwhite guess', { winner });
        return;
      }

      updateState({
        players: updatedPlayers,
        currentRound: state.currentRound + 1,
        votingResults: {},
        individualVotes: {},
        currentVoterIndex: 0,
        showEliminationResult: false,
        showMrWhiteGuess: false,
        currentPhase: 'description',
      });

      log('Skipped mrwhite guess -> continue');
    } catch (err) {
      log('skipMrWhiteGuess failed', err);
      updateState({ showMrWhiteGuess: false, showEliminationResult: false });
      throw err;
    }
  }, [state, updateState, log, endGame]);

  /* ------------------------------
     Initialization & other helpers
     ------------------------------ */
  const initializeGame = useCallback(async (params: any) => {
    try {
      log('initializeGame', params);
      const gameData = await GameService.initializeGame({
        gameId: params.gameId,
        playerCount: params.playerCount,
        playerNames: JSON.parse(params.playerNames || '[]'),
        playerIds: JSON.parse(params.playerIds || '[]'),
        customRoles: params.customRoles ? JSON.parse(params.customRoles) : undefined,
        useSpecialRoles: params.useSpecialRoles === 'true',
        selectedSpecialRoles: params.selectedSpecialRoles ? JSON.parse(params.selectedSpecialRoles) : [],
      });

      if (!gameData) throw new Error('Failed to init game');

      const playersList: Player[] = gameData.players || [];

      // Build descriptionOrder to avoid clustering undercovers:
      const shuffled = [...playersList].sort(() => Math.random() - 0.5);
      const undercovers = shuffled.filter(p => p.role === 'undercover');
      const civilians = shuffled.filter(p => p.role !== 'undercover');
      const order: string[] = [];
      const maxLen = Math.max(undercovers.length, civilians.length);
      for (let i = 0; i < maxLen; i++) {
        if (civilians[i]) order.push(civilians[i].id);
        if (undercovers[i]) order.push(undercovers[i].id);
      }
      shuffled.forEach(p => { if (!order.includes(p.id)) order.push(p.id); });

      updateState({
        gameId: params.gameId,
        players: playersList,
        wordPair: gameData.wordPair,
        currentPhase: 'word-distribution',
        currentRound: 1,
        eliminationHistory: [],
        votingResults: {},
        individualVotes: {},
        currentVoterIndex: 0,
        descriptionOrder: order,
      });

      log('Game initialized', { playersCount: playersList.length, descriptionOrder: order });
    } catch (err) {
      log('initializeGame failed', err);
      throw err;
    }
  }, [updateState, log]);

  const advancePhase = useCallback((nextPhase: GamePhase) => {
    log(`advancePhase ${state.currentPhase} -> ${nextPhase}`);
    updateState({ currentPhase: nextPhase });
  }, [state.currentPhase, updateState, log]);

  const resetGame = useCallback(() => {
    log('resetGame');
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
      descriptionOrder: [],
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
    updateState,
    resetGame,
  };

  return [state, actions];
};
