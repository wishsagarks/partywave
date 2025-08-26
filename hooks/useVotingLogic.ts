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
   * Validates if a vote can be cast by the current voter
   */
  const validateVote = useCallback((voterId: string, targetId: string): boolean => {
    // Check if voter exists and is eligible to vote
    const voter = players.find(p => p.id === voterId);
    if (!voter || (!voter.isAlive && !voter.canVote)) {
      console.warn(`Invalid voter: ${voterId}`);
      return false;
    }

    // Check if target exists and is alive (can be voted for)
    const target = players.find(p => p.id === targetId);
    if (!target || !target.isAlive) {
      console.warn(`Invalid target: ${targetId}`);
      return false;
    }

    // Prevent self-voting
    if (voterId === targetId) {
      console.warn(`Self-voting not allowed: ${voterId}`);
      return false;
    }

    // Check if voter has already voted
    if (individualVotes[voterId]) {
      console.warn(`Voter ${voterId} has already voted`);
      return false;
    }

    return true;
  }, [players, individualVotes]);

  /**
   * Casts a vote from the current voter to the target player
   */
  const castVote = useCallback(async (targetId: string) => {
    try {
      const currentVoter = getCurrentVoter();
      if (!currentVoter || isProcessingVotes) {
        console.warn('No current voter or votes are being processed');
        return;
      }

      // Validate the vote
      if (!validateVote(currentVoter.id, targetId)) {
        return;
      }

      console.log(`${currentVoter.name} votes for ${players.find(p => p.id === targetId)?.name}`);

      // Record individual vote
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

      console.log(`Votes cast: ${totalVotesCast}/${totalVotesNeeded}`);

      if (totalVotesCast >= totalVotesNeeded) {
        // All players have voted, process results
        console.log('All votes collected, processing results...');
        setIsProcessingVotes(true);
        await processVotingResults(updatedVotingResults, updatedIndividualVotes);
      } else {
        // Move to next voter
        const nextVoterIndex = currentVoterIndex + 1;
        setCurrentVoterIndex(nextVoterIndex);
        console.log(`Moving to next voter (index: ${nextVoterIndex})`);
      }
    } catch (error) {
      console.error('Error casting vote:', error);
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
   * Determines which player(s) received the most votes
   */
  const getMostVotedPlayers = useCallback((results: Record<string, number>): string[] => {
    if (Object.keys(results).length === 0) {
      return [];
    }

    const maxVotes = Math.max(...Object.values(results));
    return Object.keys(results).filter(playerId => results[playerId] === maxVotes);
  }, []);

  /**
   * Handles tie-breaking logic using Goddess of Justice special role
   */
  const resolveTie = useCallback((tiedPlayerIds: string[]): string | null => {
    if (tiedPlayerIds.length <= 1) {
      return tiedPlayerIds[0] || null;
    }

    // Check for Goddess of Justice special role
    const goddessPlayer = players.find(p => 
      p.specialRole === 'goddess-of-justice' && 
      (p.isAlive || p.canVote)
    );

    if (goddessPlayer) {
      // Goddess of Justice breaks the tie randomly
      const randomIndex = Math.floor(Math.random() * tiedPlayerIds.length);
      const selectedPlayerId = tiedPlayerIds[randomIndex];
      const selectedPlayer = players.find(p => p.id === selectedPlayerId);
      
      console.log(`Goddess of Justice (${goddessPlayer.name}) breaks tie, eliminating ${selectedPlayer?.name}`);
      return selectedPlayerId;
    }

    // No tie-breaker available
    console.log('Voting tie with no Goddess of Justice - no elimination this round');
    return null;
  }, [players]);

  /**
   * Determines if Mr. White should get a guess opportunity
   * Mr. White only gets to guess if they are the last remaining impostor
   */
  const shouldMrWhiteGuess = useCallback((eliminatedPlayer: Player): boolean => {
    if (eliminatedPlayer.role !== 'mrwhite') {
      return false;
    }

    // Count remaining impostors after this elimination (excluding the eliminated Mr. White)
    const remainingImpostors = players.filter(p => 
      p.isAlive && 
      p.id !== eliminatedPlayer.id && 
      (p.role === 'undercover' || p.role === 'mrwhite')
    );

    const shouldGuess = remainingImpostors.length === 0;
    console.log(`Mr. White elimination check: ${remainingImpostors.length} impostors remaining, should guess: ${shouldGuess}`);
    
    return shouldGuess;
  }, [players]);

  /**
   * Processes the voting results and determines elimination
   */
  const processVotingResults = useCallback(async (
    results: Record<string, number>, 
    votes: Record<string, string>
  ) => {
    try {
      console.log('Processing voting results:', results);
      console.log('Individual votes:', votes);

      // Find player(s) with most votes
      const mostVotedPlayerIds = getMostVotedPlayers(results);
      
      if (mostVotedPlayerIds.length === 0) {
        console.log('No votes cast - continuing game without elimination');
        setIsProcessingVotes(false);
        resetVotingState();
        return;
      }

      // Resolve ties if necessary
      const eliminatedPlayerId = resolveTie(mostVotedPlayerIds);
      
      if (!eliminatedPlayerId) {
        // Tie could not be resolved - no elimination this round
        console.log('Unresolved tie - no elimination this round');
        setIsProcessingVotes(false);
        resetVotingState();
        return;
      }

      // Find the eliminated player
      const eliminatedPlayer = players.find(p => p.id === eliminatedPlayerId);
      if (!eliminatedPlayer) {
        console.error('Eliminated player not found:', eliminatedPlayerId);
        setIsProcessingVotes(false);
        resetVotingState();
        return;
      }

      console.log(`Player eliminated: ${eliminatedPlayer.name} (${eliminatedPlayer.role})`);
      setEliminatedPlayer(eliminatedPlayer);

      // Handle different elimination scenarios based on player role and special abilities
      if (eliminatedPlayer.role === 'mrwhite' && shouldMrWhiteGuess(eliminatedPlayer)) {
        // Mr. White is the last impostor - gets to guess
        console.log('Mr. White gets final guess opportunity');
        await onMrWhiteEliminated(eliminatedPlayer);
      } else if (eliminatedPlayer.specialRole === 'revenger') {
        // Revenger gets to eliminate another player
        console.log('Revenger eliminated - triggering revenge mechanism');
        onRevengerEliminated(eliminatedPlayer);
      } else {
        // Standard elimination
        console.log('Standard player elimination');
        await onPlayerEliminated(eliminatedPlayer);
      }

    } catch (error) {
      console.error('Error processing voting results:', error);
      setIsProcessingVotes(false);
      resetVotingState();
    }
  }, [
    getMostVotedPlayers,
    resolveTie,
    shouldMrWhiteGuess,
    players,
    setEliminatedPlayer,
    onMrWhiteEliminated,
    onRevengerEliminated,
    onPlayerEliminated,
    setIsProcessingVotes,
    resetVotingState,
  ]);

  /**
   * Gets current voting statistics for UI display
   */
  const getVotingStats = useCallback(() => {
    const votingPlayers = getVotingPlayers();
    const totalVoters = votingPlayers.length;
    const votesCast = Object.keys(individualVotes).length;
    const votesRemaining = totalVoters - votesCast;

    return {
      totalVoters,
      votesCast,
      votesRemaining,
      isComplete: votesCast >= totalVoters,
      currentVoter: getCurrentVoter(),
    };
  }, [getVotingPlayers, individualVotes, getCurrentVoter]);

  /**
   * Gets the current vote distribution for UI display
   */
  const getVoteDistribution = useCallback(() => {
    return Object.entries(votingResults)
      .map(([playerId, votes]) => {
        const player = players.find(p => p.id === playerId);
        return {
          playerId,
          playerName: player?.name || 'Unknown',
          votes,
          isLeading: votes === Math.max(...Object.values(votingResults)),
        };
      })
      .sort((a, b) => b.votes - a.votes);
  }, [votingResults, players]);

  return {
    // Core voting functions
    castVote,
    processVotingResults,
    
    // Utility functions
    validateVote,
    getMostVotedPlayers,
    resolveTie,
    shouldMrWhiteGuess,
    
    // Statistics and display helpers
    getVotingStats,
    getVoteDistribution,
  };
};