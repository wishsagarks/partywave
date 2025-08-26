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

  const castVote = useCallback(async (targetId: string) => {
    try {
      const currentVoter = getCurrentVoter();
      if (!currentVoter || isProcessingVotes) return;

      // Record the vote
      const newIndividualVotes = {
        ...individualVotes,
        [currentVoter.id]: targetId,
      };
      setIndividualVotes(newIndividualVotes);

      // Update vote counts
      const newVotingResults = { ...votingResults };
      newVotingResults[targetId] = (newVotingResults[targetId] || 0) + 1;
      setVotingResults(newVotingResults);

      const votingPlayers = getVotingPlayers();
      const nextVoterIndex = currentVoterIndex + 1;

      if (nextVoterIndex >= votingPlayers.length) {
        // All players have voted, process results
        setIsProcessingVotes(true);
        await processVotingResults(newVotingResults, newIndividualVotes);
      } else {
        // Move to next voter
        setCurrentVoterIndex(nextVoterIndex);
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      setIsProcessingVotes(false);
    }
  }, [
    getCurrentVoter,
    isProcessingVotes,
    individualVotes,
    votingResults,
    currentVoterIndex,
    getVotingPlayers,
    setIndividualVotes,
    setVotingResults,
    setCurrentVoterIndex,
    setIsProcessingVotes,
  ]);

  const processVotingResults = useCallback(async (results: Record<string, number>, votes: Record<string, string>) => {
    try {
      // Find player(s) with most votes
      const maxVotes = Math.max(...Object.values(results));
      const mostVotedPlayerIds = Object.keys(results).filter(playerId => results[playerId] === maxVotes);

      if (mostVotedPlayerIds.length === 1) {
        // Single player with most votes
        const eliminatedPlayerId = mostVotedPlayerIds[0];
        const eliminatedPlayer = players.find(p => p.id === eliminatedPlayerId);
        
        if (eliminatedPlayer) {
          setEliminatedPlayer(eliminatedPlayer);
          
          // Check if Mr. White should get to guess (only if they're the last impostor)
          if (eliminatedPlayer.role === 'mrwhite') {
            // Count remaining impostors after this elimination (excluding the eliminated Mr. White)
            const remainingImpostors = players.filter(p => 
              p.isAlive && 
              p.id !== eliminatedPlayer.id && 
              (p.role === 'undercover' || p.role === 'mrwhite')
            );
            
            if (remainingImpostors.length === 0) {
              // Mr. White is last impostor, gets to guess
              await onMrWhiteEliminated(eliminatedPlayer);
            } else {
              // Still undercover alive, regular elimination
              await onPlayerEliminated(eliminatedPlayer);
            }
          } else if (eliminatedPlayer.specialRole === 'revenger') {
            onRevengerEliminated(eliminatedPlayer);
          } else {
            await onPlayerEliminated(eliminatedPlayer);
          }
        }
      } else {
        // Handle tie - check for Goddess of Justice
        const goddessPlayer = players.find(p => p.specialRole === 'goddess-of-justice' && p.isAlive);
        
        if (goddessPlayer) {
          // Goddess of Justice breaks the tie
          const randomIndex = Math.floor(Math.random() * mostVotedPlayerIds.length);
          const eliminatedPlayerId = mostVotedPlayerIds[randomIndex];
          const eliminatedPlayer = players.find(p => p.id === eliminatedPlayerId);
          
          if (eliminatedPlayer) {
            setEliminatedPlayer(eliminatedPlayer);
            
            // Check if Mr. White should get to guess (only if they're the last impostor)
            if (eliminatedPlayer.role === 'mrwhite') {
              // Count remaining impostors after this elimination (excluding the eliminated Mr. White)
              const remainingImpostors = players.filter(p => 
                p.isAlive && 
                p.id !== eliminatedPlayer.id && 
                (p.role === 'undercover' || p.role === 'mrwhite')
              );
              
              if (remainingImpostors.length === 0) {
                await onMrWhiteEliminated(eliminatedPlayer);
              } else {
                await onPlayerEliminated(eliminatedPlayer);
              }
            } else if (eliminatedPlayer.specialRole === 'revenger') {
              onRevengerEliminated(eliminatedPlayer);
            } else {
              await onPlayerEliminated(eliminatedPlayer);
            }
          }
        } else {
          // No elimination due to tie
          setIsProcessingVotes(false);
          resetVotingState();
          // Show tie message and continue game
          console.log('Voting tie - no elimination this round');
        }
      }
    } catch (error) {
      console.error('Error processing voting results:', error);
      setIsProcessingVotes(false);
    }
  }, [
    players,
    setEliminatedPlayer,
    onMrWhiteEliminated,
    onRevengerEliminated,
    onPlayerEliminated,
    resetVotingState,
    setIsProcessingVotes,
  ]);

  return {
    castVote,
    processVotingResults,
  };
};