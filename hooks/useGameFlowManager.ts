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
  wordPair: any;
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
  descriptionOrder: string[]; // list of player ids in description order
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

  // Helper: only alive players can vote (fix for issue #1)
  const getVotingPlayers = useCallback(() => {
    return state.players.filter(p => p.isAlive);
  }, [state.players]);

  const getAlivePlayers = useCallback(() => state.players.filter(p => p.isAlive), [state.players]);

  // Initialization
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

      if (!gameData) throw new Error('No game data from service');

      // Build descriptionOrder logic: choose a balanced order so undercovers are spread.
      // Strategy: start with a random alive player, then alternate picks to maximize distance between undercovers.
      const playersList: Player[] = gameData.players || [];
      const shuffled = [...playersList].sort(() => Math.random() - 0.5);

      // Simple ordering: ensure undercovers not clustered — interleave civs and undercovers when possible.
      const undercovers = shuffled.filter(p => p.role === 'undercover');
      const civilians = shuffled.filter(p => p.role === 'civilian' || p.role === 'mrwhite'); // mrwhite treated with civ for ordering
      const order: string[] = [];
      const maxLen = Math.max(undercovers.length, civilians.length);
      for (let i = 0; i < maxLen; i++) {
        if (civilians[i]) order.push(civilians[i].id);
        if (undercovers[i]) order.push(undercovers[i].id);
      }
      // Append any remaining (rare)
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

  // End game: declared before other callbacks that may call it
  const endGame = useCallback(async (winner: string) => {
    try {
      log('endGame', { winner });
      const duration = 0; // calculate if you track timestamps
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

  // PROCESS VOTE
  const processVote = useCallback(async (voterId: string, targetId: string) => {
    try {
      log('processVote', { voterId, targetId });
      const voter = state.players.find(p => p.id === voterId);
      const target = state.players.find(p => p.id === targetId);

      if (!voter || !target) throw new Error('Invalid voter or target');
      if (!voter.isAlive) throw new Error('Eliminated player cannot vote'); // enforce
      if (!target.isAlive) throw new Error('Cannot vote for eliminated player');
      if (state.individualVotes[voterId]) throw new Error('Player already voted');

      const newIndividualVotes = { ...state.individualVotes, [voterId]: targetId };
      const newVotingResults = { ...state.votingResults };
      newVotingResults[targetId] = (newVotingResults[targetId] || 0) + 1;

      const votingPlayers = getVotingPlayers();
      const totalVotesNeeded = votingPlayers.length;
      const totalVotesCast = Object.keys(newIndividualVotes).length;

      // update vote state and advance voter index
      updateState({
        individualVotes: newIndividualVotes,
        votingResults: newVotingResults,
        currentVoterIndex: Math.min(state.currentVoterIndex + 1, Math.max(0, votingPlayers.length - 1)),
      });

      log('vote recorded', { totalVotesCast, totalVotesNeeded, newVotingResults });

      if (totalVotesCast >= totalVotesNeeded) {
        // All votes collected -> process elimination
        updateState({ isProcessingVotes: true });
        await processElimination(); // let processElimination determine who to eliminate (based on votes)
      }
    } catch (err) {
      log('processVote failed', err);
      throw err;
    }
  }, [state, updateState, log, getVotingPlayers, processElimination]);

  // PROCESS ELIMINATION
  const processElimination = useCallback(async (playerId?: string) => {
    try {
      log('processElimination', { playerId, votingResults: state.votingResults });

      let eliminatedPlayerId = playerId;

      // If no explicit playerId, determine from votes
      if (!eliminatedPlayerId) {
        const votes = state.votingResults || {};
        const values = Object.values(votes);
        if (values.length === 0) {
          // nothing to eliminate -> reset votes and go back to discussion
          updateState({
            isProcessingVotes: false,
            votingResults: {},
            individualVotes: {},
            currentVoterIndex: 0,
            currentPhase: 'discussion',
          });
          log('no votes, returning to discussion');
          return;
        }
        const maxVotes = Math.max(...values);
        const tied = Object.keys(votes).filter(id => votes[id] === maxVotes);

        if (tied.length > 1) {
          // tie-break: goddess-of-justice or random
          const goddess = state.players.find(p => p.specialRole === 'goddess-of-justice' && p.isAlive);
          if (goddess) {
            // goddess breaks tie — pick one of tied at random (you can implement goddess logic later)
            eliminatedPlayerId = tied[Math.floor(Math.random() * tied.length)];
            log('goddess broke tie', { eliminatedPlayerId });
          } else {
            // unresolved tie -> reset votes and go to discussion to re-vote
            updateState({
              isProcessingVotes: false,
              votingResults: {},
              individualVotes: {},
              currentVoterIndex: 0,
              currentPhase: 'discussion',
            });
            log('tie unresolved, back to discussion', { tied });
            return;
          }
        } else {
          eliminatedPlayerId = tied[0];
        }
      }

      const eliminated = state.players.find(p => p.id === eliminatedPlayerId);
      if (!eliminated) throw new Error('Eliminated player not found');

      log('eliminating player', { id: eliminatedPlayerId, role: eliminated.role });

      // Save round data (non-blocking but await to ensure persistence if needed)
      try {
        await GameService.saveGameRound(state.gameId, state.currentRound, eliminatedPlayerId, state.votingResults);
      } catch (saveErr) {
        log('saveGameRound failed (continuing)', saveErr);
      }

      // Mark player as eliminated (unless mrwhite special flow)
      if (eliminated.role === 'mrwhite') {
        // Mr. White elimination triggers guess phase (do not mark dead yet until guess resolved)
        updateState({
          eliminatedPlayer: eliminated,
          showEliminationResult: true,
          showMrWhiteGuess: true,
          isProcessingVotes: false,
          currentPhase: 'elimination-result',
        });
        log('mrwhite eliminated -> show guess');
        return;
      }

      // Regular elimination (non-mrwhite)
      const updatedPlayers = state.players.map(p =>
        p.id === eliminated.id ? { ...p, isAlive: false, eliminationRound: state.currentRound } : p
      );

      // Update elimination history
      const entry: EliminationHistoryEntry = {
        round: state.currentRound,
        player: eliminated,
        votesReceived: state.votingResults[eliminated.id] || 0,
        eliminationMethod: 'voting',
      };

      // Check win condition after removing eliminated player
      const { winner, isGameOver } = GameService.checkWinCondition(updatedPlayers);

      if (isGameOver && winner) {
        // Game over: compute points and finish
        const scored = GameService.calculatePoints(updatedPlayers, winner);
        updateState({
          players: scored,
          eliminationHistory: [...state.eliminationHistory, entry],
          eliminatedPlayer: eliminated,
          showEliminationResult: true,
          currentPhase: 'final-results',
          isProcessingVotes: false,
          gameWinner: winner,
        });
        await endGame(winner);
        log('game ended after elimination', { winner });
        return;
      }

      // Not over: update state and continue to next round
      updateState({
        players: updatedPlayers,
        eliminationHistory: [...state.eliminationHistory, entry],
        eliminatedPlayer: eliminated,
        showEliminationResult: true,
        isProcessingVotes: false,
        votingResults: {},
        individualVotes: {},
        currentVoterIndex: 0,
        currentRound: state.currentRound + 1,
        currentPhase: 'description', // move to description for next round
      });

      log('round continues', { nextRound: state.currentRound + 1 });
    } catch (err) {
      log('processElimination failed', err);
      updateState({ isProcessingVotes: false });
      throw err;
    }
  }, [state, updateState, log, endGame]);

  const processMrWhiteGuess = useCallback(async (guess: string) => {
    try {
      log('processMrWhiteGuess', { guess });
      if (!state.eliminatedPlayer || !state.wordPair) throw new Error('Invalid state for Mr. White guess');

      const normalizedGuess = (guess || '').toString().trim().toLowerCase();
      const correctWord = (state.wordPair.civilian_word || '').toString().trim().toLowerCase();
      const isCorrect = normalizedGuess === correctWord;

      // Save result of guess
      try {
        await GameService.saveGameRound(state.gameId, state.currentRound, state.eliminatedPlayer.id, state.votingResults, guess, isCorrect);
      } catch (saveErr) {
        log('saveGameRound failed for mrwhite guess (continuing)', saveErr);
      }

      // Reset guess UI flags
      updateState({
        showMrWhiteGuess: false,
        mrWhiteGuess: '',
        showEliminationResult: false,
      });

      if (isCorrect) {
        // Mr. White wins immediately
        const scored = GameService.calculatePoints(state.players, 'Mr. White');
        // update elimination history marking this method
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
        log('Mr. White guessed correctly -> Mr. White wins');
        return;
      }

      // Incorrect guess -> the eliminated player is permanently eliminated now
      const updatedPlayers = state.players.map(p =>
        p.id === state.eliminatedPlayer!.id ? { ...p, isAlive: false, eliminationRound: state.currentRound } : p
      );

      // Check win condition after removing Mr White
      const { winner, isGameOver } = GameService.checkWinCondition(updatedPlayers);

      if (isGameOver && winner) {
        const scored = GameService.calculatePoints(updatedPlayers, winner);
        updateState({
          players: scored,
          gameWinner: winner,
          currentPhase: 'final-results',
        });
        await endGame(winner);
        log('Game ended after Mr White incorrect guess', { winner });
        return;
      }

      // Continue to next round
      updateState({
        players: updatedPlayers,
        currentRound: state.currentRound + 1,
        votingResults: {},
        individualVotes: {},
        currentVoterIndex: 0,
        showEliminationResult: false,
        currentPhase: 'description',
      });

      log('Mr White guessed incorrectly -> continue to next round');
    } catch (err) {
      log('processMrWhiteGuess failed', err);
      updateState({ showMrWhiteGuess: false, mrWhiteGuess: '', showEliminationResult: false });
      throw err;
    }
  }, [state, updateState, log, endGame]);

  const skipMrWhiteGuess = useCallback(async () => {
    try {
      log('skipMrWhiteGuess');
      if (!state.eliminatedPlayer) throw new Error('No eliminated player');

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
        log('Game ended after skipping Mr White guess', { winner });
        return;
      }

      // continue next round
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

      log('Skipped Mr White guess -> continue');
    } catch (err) {
      log('skipMrWhiteGuess failed', err);
      updateState({ showMrWhiteGuess: false, showEliminationResult: false });
      throw err;
    }
  }, [state, updateState, log, endGame]);

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
