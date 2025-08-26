import { useCallback } from 'react';
import { Alert } from 'react-native';
import { GameService } from '@/services/gameService';
import { Player } from '@/types/game';

interface UseVotingLogicProps {
  players: Player[];
  votingResults: {[key: string]: number};
  individualVotes: {[voterId: string]: string};
  currentVoterIndex: number;
  isProcessingVotes: boolean;
  currentRound: number;
  setVotingResults: (results: {[key: string]: number}) => void;
  setIndividualVotes: (votes: {[voterId: string]: string}) => void;
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

export function useVotingLogic({
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
}: UseVotingLogicProps) {

  const castVote = useCallback((votedForId: string) => {
    if (isProcessingVotes) return;
    
    const votingPlayers = getVotingPlayers();
    const currentVoter = getCurrentVoter();
    
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
  }, [
    isProcessingVotes,
    getVotingPlayers,
    getCurrentVoter,
    individualVotes,
    votingResults,
    currentVoterIndex,
    setIndividualVotes,
    setVotingResults,
    setCurrentVoterIndex,
  ]);

  const processVotingResults = useCallback(async (results: {[key: string]: number}) => {
    if (isProcessingVotes) return;
    
    setIsProcessingVotes(true);
    
    try {
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
            } else if (randomPlayer) {
              await handlePlayerElimination(randomPlayer);
            }
          }}
        ]);
        return;
      }
      
      const eliminated = players.find(p => p.id === eliminatedPlayerId);
      if (eliminated) {
        await handlePlayerElimination(eliminated);
      }
    } catch (error) {
      console.error('Error processing voting results:', error);
      Alert.alert('Error', 'Failed to process voting results');
    } finally {
      setIsProcessingVotes(false);
    }
  }, [isProcessingVotes, players, currentRound, setIsProcessingVotes, resetVotingState]);

  const handlePlayerElimination = useCallback(async (eliminated: Player) => {
    setEliminatedPlayer(eliminated);
    
    // Check for Joy Fool win condition
    if (GameService.checkJoyFoolWin(players, eliminated.id, currentRound)) {
      const finalPlayers = GameService.calculatePoints(players, 'Joy Fool');
      await onPlayerEliminated(eliminated);
      return;
    }
    
    // Check for Revenger role
    if (eliminated.specialRole === 'revenger') {
      onRevengerEliminated(eliminated);
      return;
    }
    
    if (eliminated.role === 'mrwhite') {
      await onMrWhiteEliminated(eliminated);
    } else {
      await onPlayerEliminated(eliminated);
    }
  }, [players, currentRound, setEliminatedPlayer, onPlayerEliminated, onMrWhiteEliminated, onRevengerEliminated]);

  return {
    castVote,
    processVotingResults,
    handlePlayerElimination,
  };
}