import { useCallback } from 'react';
import { GameService } from '@/services/gameService';
import { Player } from '@/types/game';

interface UseSpecialRolesProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  setShowRevengerModal: (show: boolean) => void;
  setRevengerPlayer: (player: Player | null) => void;
  setShowSpecialRoleCard: (show: boolean) => void;
  setCurrentSpecialRolePlayer: (player: Player | null) => void;
  onGameEnd: (winner: string, finalPlayers: Player[]) => Promise<void>;
  showRoundResults: (players: Player[]) => void;
}

export const useSpecialRoles = (props: UseSpecialRolesProps) => {
  const {
    players,
    setPlayers,
    setShowRevengerModal,
    setRevengerPlayer,
    setShowSpecialRoleCard,
    setCurrentSpecialRolePlayer,
    onGameEnd,
    showRoundResults
  } = props;

  const handleShowSpecialRoleCard = useCallback((player: Player) => {
    if (player.specialRole) {
      setCurrentSpecialRolePlayer(player);
      setShowSpecialRoleCard(true);
    }
  }, [setCurrentSpecialRolePlayer, setShowSpecialRoleCard]);

  const handleRevengerChoice = useCallback(async (targetId: string) => {
    try {
      const revengerPlayer = players.find(p => p.specialRole === 'revenger' && !p.isAlive);
      if (!revengerPlayer) return;
      
      // First eliminate the revenger
      const updatedPlayersAfterRevenger = players.map(p => 
        p.id === revengerPlayer.id ? { ...p, isAlive: false, eliminationRound: 1 } : p
      );
      
      // Then eliminate their target
      const finalPlayers = GameService.handleRevengerElimination(updatedPlayersAfterRevenger, revengerPlayer.id, targetId);
      setPlayers(finalPlayers);
      
      setShowRevengerModal(false);
      setRevengerPlayer(null);
      
      // Check win condition after chain eliminations
      const { winner, isGameOver } = GameService.checkWinCondition(finalPlayers);
      if (isGameOver && winner) {
        const scoredPlayers = GameService.calculatePoints(finalPlayers, winner);
        setPlayers(scoredPlayers);
        await onGameEnd(winner, scoredPlayers);
      } else {
        showRoundResults(finalPlayers);
      }
    } catch (error) {
      console.error('Error handling revenger choice:', error);
    }
  }, [players, setPlayers, setShowRevengerModal, setRevengerPlayer, onGameEnd, showRoundResults]);

  const handleSpecialRoleElimination = useCallback((playerId: string, currentRound: number) => {
    try {
      // Handle special role eliminations and chain reactions
      const { updatedPlayers, chainEliminations } = GameService.handleSpecialRoleElimination(players, playerId);
      
      // Mark primary player as eliminated
      const finalPlayers = updatedPlayers.map(p => 
        p.id === playerId ? { ...p, isAlive: false, eliminationRound: currentRound } : p
      );
      
      setPlayers(finalPlayers);
      
      return { finalPlayers, chainEliminations };
    } catch (error) {
      console.error('Error handling special role elimination:', error);
      return { finalPlayers: players, chainEliminations: [] };
    }
  }, [players, setPlayers]);

  const showRevengerModal = useCallback((player: Player) => {
    setRevengerPlayer(player);
    setShowRevengerModal(true);
  }, [setRevengerPlayer, setShowRevengerModal]);

  return {
    handleShowSpecialRoleCard,
    handleRevengerChoice,
    handleSpecialRoleElimination,
    showRevengerModal,
  };
};