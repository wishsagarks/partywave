import { useCallback } from 'react';
import { GameService } from '@/services/gameService';
import { Player } from '@/types/game';

interface VotingLogicProps {
  players: Player[];
  votingResults: Record<string, number>;
  individualVotes: Record<string, string>;
  currentVoterIndex: number;
  isProcessingVotes: boolean;
  currentRound: number;
  setVotingResults: (results: Record<string, number>) => void;
  setIndividualVotes: (votes: Record<string, string>) => void;
  setCurrentVoterIndex: (index: number) => void;
  setIsProcessingVotes: (processing: boolean) => void;
  setEliminatedPlayer: (player: Player | null) => void;
  resetVotingState: () => void;
  getVotingPlayers: () => Player[];
  getCurrentVoter: () => Player | null;
  onPlayerEliminated: (player: Player) => Promise<void>;
  onMrWhiteEliminated: (player: Player) => Promise<void>;
  onRevengerEliminated: (player: Player) => void;
}

export const useVotingLogic = (props: VotingLogicProps) => {
  const {
    players,
    votingResults,
    individualVotes,
    currentVoterIndex,
    isProcessingVotes,
    currentRound,
    setVotingResults,
    setIndividualVotes,
    setCurrentVoterIndex,
    setIsProcessingVotes,
    setEliminatedPlayer,
    resetVotingState,
    getVotingPlayers,
    getCurrentVoter,
    onPlayerEliminated,
    onMrWhiteEliminated,
    onRevengerEliminated,
  } = props;

  /**
   * PHASE 1: VOTE VALIDATION
   * Ensures only eligible players can vote for valid targets
   */
  const validateVote = useCallback((voterId: string, targetId: string): boolean => {
    const voter = players.find(p => p.id === voterId);
    const target = players.find(p => p.id === targetId);

    // Voter must exist and be eligible (alive OR ghost with canVote)
    if (!voter || (!voter.isAlive && !voter.canVote)) {
      console.warn(`❌ Invalid voter: ${voter?.name || voterId} (alive: ${voter?.isAlive}, canVote: ${voter?.canVote})`);
      return false;
    }

    // Target must exist and be alive (can be voted for)
    if (!target || !target.isAlive) {
      console.warn(`❌ Invalid target: ${target?.name || targetId} (alive: ${target?.isAlive})`);
      return false;
    }

    // Prevent self-voting
    if (voterId === targetId) {
      console.warn(`❌ Self-voting not allowed: ${voter.name}`);
      return false;
    }

    // Check if voter has already voted
    if (individualVotes[voterId]) {
      console.warn(`❌ ${voter.name} has already voted for ${players.find(p => p.id === individualVotes[voterId])?.name}`);
      return false;
    }

    return true;
  }, [players, individualVotes]);

  /**
   * PHASE 2: VOTE CASTING (Pass-and-Play Mode)
   * Each player secretly casts their vote
   */
  const castVote = useCallback(async (targetId: string) => {
    try {
      const currentVoter = getCurrentVoter();
      if (!currentVoter || isProcessingVotes) {
        console.warn('⚠️ No current voter or votes being processed');
        return;
      }

      // Validate the vote
      if (!validateVote(currentVoter.id, targetId)) {
        return;
      }

      const targetPlayer = players.find(p => p.id === targetId);
      console.log(`🗳️ ${currentVoter.name} votes to eliminate ${targetPlayer?.name}`);

      // Record individual vote (hidden until all votes cast)
      const updatedIndividualVotes = {
        ...individualVotes,
        [currentVoter.id]: targetId,
      };
      setIndividualVotes(updatedIndividualVotes);

      // Update vote tallies
      const updatedVotingResults = {
        ...votingResults,
        [targetId]: (votingResults[targetId] || 0) + 1,
      };
      setVotingResults(updatedVotingResults);

      // Check if all eligible voters have voted
      const votingPlayers = getVotingPlayers();
      const totalVotesNeeded = votingPlayers.length;
      const totalVotesCast = Object.keys(updatedIndividualVotes).length;

      console.log(`📊 Votes cast: ${totalVotesCast}/${totalVotesNeeded}`);

      if (totalVotesCast >= totalVotesNeeded) {
        // All players have voted - reveal and process results
        console.log('🎯 All votes collected! Processing elimination...');
        setIsProcessingVotes(true);
        await processVotingResults(updatedVotingResults);
      } else {
        // Move to next voter in pass-and-play sequence
        setCurrentVoterIndex(currentVoterIndex + 1);
      }
    } catch (error) {
      console.error('💥 Error casting vote:', error);
      setIsProcessingVotes(false);
    }
  }, [
    getCurrentVoter,
    isProcessingVotes,
    validateVote,
    players,
    individualVotes,
    votingResults,
    currentVoterIndex,
    setIndividualVotes,
    setVotingResults,
    getVotingPlayers,
    setIsProcessingVotes,
    setCurrentVoterIndex,
  ]);

  /**
   * PHASE 3: VOTE COUNTING & TIE RESOLUTION
   * Applies majority rule with special role tie-breaking
   */
  const determineElimination = useCallback((results: Record<string, number>): string | null => {
    if (Object.keys(results).length === 0) {
      console.log('📭 No votes cast');
      return null;
    }

    const maxVotes = Math.max(...Object.values(results));
    const tiedPlayerIds = Object.keys(results).filter(id => results[id] === maxVotes);

    console.log(`🏆 Most votes: ${maxVotes}`);
    console.log(`🤝 Tied players: ${tiedPlayerIds.map(id => players.find(p => p.id === id)?.name).join(', ')}`);

    // No tie - clear winner
    if (tiedPlayerIds.length === 1) {
      const winner = players.find(p => p.id === tiedPlayerIds[0]);
      console.log(`✅ Clear elimination: ${winner?.name}`);
      return tiedPlayerIds[0];
    }

    // TIE RESOLUTION: Check for Goddess of Justice
    const goddessPlayer = players.find(p => 
      p.specialRole === 'goddess-of-justice' && 
      (p.isAlive || p.canVote)
    );

    if (goddessPlayer) {
      // Goddess of Justice breaks tie automatically
      const randomIndex = Math.floor(Math.random() * tiedPlayerIds.length);
      const selectedId = tiedPlayerIds[randomIndex];
      const selectedPlayer = players.find(p => p.id === selectedId);
      
      console.log(`⚖️ Goddess of Justice (${goddessPlayer.name}) breaks tie!`);
      console.log(`⚖️ Eliminates: ${selectedPlayer?.name}`);
      return selectedId;
    }

    // No tie-breaker available - no elimination this round
    console.log('🤷 Tie with no Goddess of Justice - no elimination');
    return null;
  }, [players]);

  /**
   * PHASE 4: ELIMINATION OUTCOMES
   * Handles different elimination cases and special role triggers
   */
  const processVotingResults = useCallback(async (results: Record<string, number>) => {
    try {
      console.log('🔄 Processing voting results...');
      
      const eliminatedPlayerId = determineElimination(results);
      
      if (!eliminatedPlayerId) {
        // No elimination due to unresolved tie
        console.log('⏭️ No elimination this round - continuing game');
        setIsProcessingVotes(false);
        resetVotingState();
        return;
      }

      const eliminatedPlayer = players.find(p => p.id === eliminatedPlayerId);
      if (!eliminatedPlayer) {
        console.error('💥 Eliminated player not found:', eliminatedPlayerId);
        setIsProcessingVotes(false);
        resetVotingState();
        return;
      }

      console.log(`💀 ELIMINATED: ${eliminatedPlayer.name} (${eliminatedPlayer.role})`);
      setEliminatedPlayer(eliminatedPlayer);

      // CASE A: CIVILIAN ELIMINATED
      if (eliminatedPlayer.role === 'civilian') {
        console.log('👥 Civilian eliminated - game continues');
        await handleCivilianElimination(eliminatedPlayer);
        return;
      }

      // CASE B: UNDERCOVER ELIMINATED  
      if (eliminatedPlayer.role === 'undercover') {
        console.log('🕵️ Undercover eliminated!');
        await handleUndercoverElimination(eliminatedPlayer);
        return;
      }

      // CASE C: MR. WHITE ELIMINATED
      if (eliminatedPlayer.role === 'mrwhite') {
        console.log('❓ Mr. White eliminated!');
        await handleMrWhiteElimination(eliminatedPlayer);
        return;
      }

    } catch (error) {
      console.error('💥 Error processing voting results:', error);
      setIsProcessingVotes(false);
      resetVotingState();
    }
  }, [determineElimination, players, setEliminatedPlayer, setIsProcessingVotes, resetVotingState]);

  /**
   * CASE A: CIVILIAN ELIMINATION
   * Most common case - game continues with fewer players
   */
  const handleCivilianElimination = useCallback(async (eliminatedPlayer: Player) => {
    console.log(`👥 Processing civilian elimination: ${eliminatedPlayer.name}`);
    
    // Check for special roles that trigger on elimination
    if (eliminatedPlayer.specialRole === 'revenger') {
      console.log('⚔️ Revenger eliminated - triggering revenge!');
      setIsProcessingVotes(false);
      onRevengerEliminated(eliminatedPlayer);
      return;
    }

    if (eliminatedPlayer.specialRole === 'joy-fool' && currentRound === 1) {
      console.log('🃏 Joy Fool eliminated in first round - bonus points!');
      // Joy Fool gets bonus points but game continues normally
    }

    // Handle special role chain eliminations (Lovers, etc.)
    setIsProcessingVotes(false);
    await onPlayerEliminated(eliminatedPlayer);
  }, [currentRound, onRevengerEliminated, onPlayerEliminated]);

  /**
   * CASE B: UNDERCOVER ELIMINATION
   * Check if all undercovers eliminated (Civilians win)
   */
  const handleUndercoverElimination = useCallback(async (eliminatedPlayer: Player) => {
    console.log(`🕵️ Processing undercover elimination: ${eliminatedPlayer.name}`);
    
    // Check for special roles first
    if (eliminatedPlayer.specialRole === 'revenger') {
      console.log('⚔️ Undercover Revenger eliminated - triggering revenge!');
      setIsProcessingVotes(false);
      onRevengerEliminated(eliminatedPlayer);
      return;
    }

    // Count remaining undercovers after this elimination
    const remainingUndercovers = players.filter(p => 
      p.isAlive && 
      p.id !== eliminatedPlayer.id && 
      p.role === 'undercover'
    );

    console.log(`🕵️ Remaining undercovers after elimination: ${remainingUndercovers.length}`);

    if (remainingUndercovers.length === 0) {
      // Check if Mr. White is still alive
      const remainingMrWhites = players.filter(p => 
        p.isAlive && 
        p.role === 'mrwhite'
      );

      if (remainingMrWhites.length === 0) {
        console.log('🎉 All impostors eliminated - Civilians win!');
      } else {
        console.log('❓ Mr. White still alive - game continues');
      }
    }

    setIsProcessingVotes(false);
    await onPlayerEliminated(eliminatedPlayer);
  }, [players, onRevengerEliminated, onPlayerEliminated]);

  /**
   * CASE C: MR. WHITE ELIMINATION
   * Final guess opportunity if last impostor
   */
  const handleMrWhiteElimination = useCallback(async (eliminatedPlayer: Player) => {
    console.log(`❓ Processing Mr. White elimination: ${eliminatedPlayer.name}`);
    
    // Always set the eliminated player first
    setEliminatedPlayer(eliminatedPlayer);
    
    // Check for special roles first
    if (eliminatedPlayer.specialRole === 'revenger') {
      console.log('⚔️ Mr. White Revenger eliminated - triggering revenge!');
      onRevengerEliminated(eliminatedPlayer);
      return;
    }

    // Count ALL remaining impostors (undercover + other Mr. Whites)
    const remainingImpostors = players.filter(p => 
      p.isAlive && 
      p.id !== eliminatedPlayer.id && 
      (p.role === 'undercover' || p.role === 'mrwhite')
    );

    console.log(`❓ Remaining impostors after Mr. White elimination: ${remainingImpostors.length}`);

    // Mr. White gets final guess ONLY if they're the last impostor
    if (remainingImpostors.length === 0) {
      console.log('🎯 Mr. White is last impostor - gets final guess!');
      setIsProcessingVotes(false);
      await onMrWhiteEliminated(eliminatedPlayer);
    } else {
      console.log('🕵️ Other impostors remain - treating as regular elimination');
      setIsProcessingVotes(false);
      await onPlayerEliminated(eliminatedPlayer);
    }
  }, [players, onRevengerEliminated, onMrWhiteEliminated, onPlayerEliminated]);

  /**
   * UTILITY FUNCTIONS
   * For UI display and game state management
   */
  const getVotingStats = useCallback(() => {
    const votingPlayers = getVotingPlayers();
    const totalVoters = votingPlayers.length;
    const votesCast = Object.keys(individualVotes).length;

    return {
      totalVoters,
      votesCast,
      votesRemaining: totalVoters - votesCast,
      isComplete: votesCast >= totalVoters,
      currentVoter: getCurrentVoter(),
      progress: totalVoters > 0 ? (votesCast / totalVoters) * 100 : 0,
    };
  }, [getVotingPlayers, individualVotes, getCurrentVoter]);

  const getVoteDistribution = useCallback(() => {
    const maxVotes = Math.max(...Object.values(votingResults), 0);
    
    return Object.entries(votingResults)
      .map(([playerId, votes]) => {
        const player = players.find(p => p.id === playerId);
        return {
          playerId,
          playerName: player?.name || 'Unknown',
          playerRole: player?.role || 'unknown',
          votes,
          isLeading: votes > 0 && votes === maxVotes,
          isTied: votes === maxVotes && Object.values(votingResults).filter(v => v === maxVotes).length > 1,
        };
      })
      .sort((a, b) => b.votes - a.votes);
  }, [votingResults, players]);

  const hasGoddessOfJustice = useCallback(() => {
    return players.some(p => 
      p.specialRole === 'goddess-of-justice' && 
      (p.isAlive || p.canVote)
    );
  }, [players]);

  return {
    // Core voting functions
    castVote,
    
    // Utility functions for UI
    getVotingStats,
    getVoteDistribution,
    hasGoddessOfJustice,
    
    // Internal functions (exposed for testing)
    validateVote,
    determineElimination,
    processVotingResults,
  };
};