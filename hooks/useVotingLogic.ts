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

/**
 * COMPREHENSIVE VOTING SYSTEM FOR UNDERCOVER GAME
 * 
 * This system implements a complete voting phase with:
 * - Pass-and-play secret voting
 * - Majority rule with tie-breaking
 * - Special role mechanics
 * - Win condition checks
 * - Proper game state management
 */
export class VotingPhase {
  private props: VotingLogicProps;

  constructor(props: VotingLogicProps) {
    this.props = props;
  }

  // ==========================================
  // PHASE 1: VOTE VALIDATION & COLLECTION
  // ==========================================

  /**
   * Validates if a vote is legal according to game rules
   */
  private validateVote(voterId: string, targetId: string): { valid: boolean; reason?: string } {
    const { players, individualVotes } = this.props;
    
    const voter = players.find(p => p.id === voterId);
    const target = players.find(p => p.id === targetId);

    // Check voter exists and is eligible
    if (!voter) {
      return { valid: false, reason: 'Voter not found' };
    }

    // Voter must be alive OR be a ghost with voting rights
    if (!voter.isAlive && !voter.canVote) {
      return { valid: false, reason: 'Voter is eliminated and cannot vote' };
    }

    // Check target exists and is alive
    if (!target || !target.isAlive) {
      return { valid: false, reason: 'Cannot vote for eliminated or non-existent player' };
    }

    // Prevent self-voting
    if (voterId === targetId) {
      return { valid: false, reason: 'Cannot vote for yourself' };
    }

    // Check for duplicate votes
    if (individualVotes[voterId]) {
      return { valid: false, reason: 'Player has already voted' };
    }

    return { valid: true };
  }

  /**
   * Collects a single vote in pass-and-play mode
   */
  public castVote = async (targetId: string): Promise<void> => {
    const { 
      getCurrentVoter, 
      isProcessingVotes,
      individualVotes,
      votingResults,
      setIndividualVotes,
      setVotingResults,
      setCurrentVoterIndex,
      currentVoterIndex,
      getVotingPlayers,
      setIsProcessingVotes
    } = this.props;

    try {
      // Prevent voting during processing
      if (isProcessingVotes) {
        console.warn('⚠️ Votes are being processed, cannot cast new vote');
        return;
      }

      const currentVoter = getCurrentVoter();
      if (!currentVoter) {
        console.warn('⚠️ No current voter found');
        return;
      }

      // Validate the vote
      const validation = this.validateVote(currentVoter.id, targetId);
      if (!validation.valid) {
        console.warn(`❌ Invalid vote: ${validation.reason}`);
        return;
      }

      const targetPlayer = this.props.players.find(p => p.id === targetId);
      console.log(`🗳️ ${currentVoter.name} votes to eliminate ${targetPlayer?.name}`);

      // Record individual vote (kept secret)
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
        // All votes collected - process results
        console.log('🎯 All votes collected! Processing elimination...');
        setIsProcessingVotes(true);
        await this.processVotingResults(updatedVotingResults);
      } else {
        // Move to next voter
        setCurrentVoterIndex(currentVoterIndex + 1);
      }
    } catch (error) {
      console.error('💥 Error casting vote:', error);
      setIsProcessingVotes(false);
    }
  };

  // ==========================================
  // PHASE 2: VOTE COUNTING & TIE RESOLUTION
  // ==========================================

  /**
   * Determines elimination based on vote counts and tie-breaking rules
   */
  private determineElimination(results: Record<string, number>): {
    eliminatedId: string | null;
    tieResolved: boolean;
    method: 'majority' | 'goddess' | 'unresolved';
  } {
    const { players } = this.props;

    if (Object.keys(results).length === 0) {
      console.log('📭 No votes cast');
      return { eliminatedId: null, tieResolved: false, method: 'unresolved' };
    }

    const maxVotes = Math.max(...Object.values(results));
    const tiedPlayerIds = Object.keys(results).filter(id => results[id] === maxVotes);

    console.log(`🏆 Most votes: ${maxVotes}`);
    console.log(`🤝 Tied players: ${tiedPlayerIds.map(id => players.find(p => p.id === id)?.name).join(', ')}`);

    // No tie - clear majority
    if (tiedPlayerIds.length === 1) {
      const winner = players.find(p => p.id === tiedPlayerIds[0]);
      console.log(`✅ Clear elimination: ${winner?.name}`);
      return { eliminatedId: tiedPlayerIds[0], tieResolved: true, method: 'majority' };
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
      return { eliminatedId: selectedId, tieResolved: true, method: 'goddess' };
    }

    // No tie-breaker available
    console.log('🤷 Unresolved tie - no elimination this round');
    return { eliminatedId: null, tieResolved: false, method: 'unresolved' };
  }

  // ==========================================
  // PHASE 3: ELIMINATION PROCESSING
  // ==========================================

  /**
   * Main elimination processing logic
   */
  private async processVotingResults(results: Record<string, number>): Promise<void> {
    const { players, setEliminatedPlayer, setIsProcessingVotes, resetVotingState } = this.props;

    try {
      console.log('🔄 Processing voting results...');
      
      const elimination = this.determineElimination(results);
      
      if (!elimination.eliminatedId) {
        // No elimination due to unresolved tie
        console.log('⏭️ No elimination this round - continuing game');
        setIsProcessingVotes(false);
        resetVotingState();
        return;
      }

      const eliminatedPlayer = players.find(p => p.id === elimination.eliminatedId);
      if (!eliminatedPlayer) {
        console.error('💥 Eliminated player not found:', elimination.eliminatedId);
        setIsProcessingVotes(false);
        resetVotingState();
        return;
      }

      console.log(`💀 ELIMINATED: ${eliminatedPlayer.name} (${eliminatedPlayer.role})`);
      setEliminatedPlayer(eliminatedPlayer);

      // Process elimination based on role
      await this.processRoleElimination(eliminatedPlayer);

    } catch (error) {
      console.error('💥 Error processing voting results:', error);
      setIsProcessingVotes(false);
      resetVotingState();
    }
  }

  /**
   * Processes elimination based on the eliminated player's role
   */
  private async processRoleElimination(eliminatedPlayer: Player): Promise<void> {
    const { setIsProcessingVotes, setEliminatedPlayer } = this.props;

    // CRITICAL: Set eliminated player and stop processing BEFORE calling handlers
    setEliminatedPlayer(eliminatedPlayer);
    setIsProcessingVotes(false);

    switch (eliminatedPlayer.role) {
      case 'civilian':
        await this.handleCivilianElimination(eliminatedPlayer);
        break;
      case 'undercover':
        await this.handleUndercoverElimination(eliminatedPlayer);
        break;
      case 'mrwhite':
        await this.handleMrWhiteElimination(eliminatedPlayer);
        break;
      default:
        console.warn(`⚠️ Unknown role: ${eliminatedPlayer.role}`);
        await this.props.onPlayerEliminated(eliminatedPlayer);
    }
  }

  // ==========================================
  // PHASE 4: ROLE-SPECIFIC ELIMINATION HANDLERS
  // ==========================================

  /**
   * Handles civilian elimination and special role triggers
   */
  private async handleCivilianElimination(eliminatedPlayer: Player): Promise<void> {
    const { currentRound, onRevengerEliminated, onPlayerEliminated, setEliminatedPlayer } = this.props;

    console.log(`👥 Processing civilian elimination: ${eliminatedPlayer.name}`);
    
    // Check for special role triggers
    // Check for special role triggers (only if special roles are enabled)
    if (eliminatedPlayer.specialRole) {
      if (eliminatedPlayer.specialRole === 'revenger') {
        console.log('⚔️ Revenger eliminated - triggering revenge!');
        this.props.onRevengerEliminated(eliminatedPlayer);
        return;
      }

      if (eliminatedPlayer.specialRole === 'joy-fool' && this.props.currentRound === 1) {
        console.log('🃏 Joy Fool eliminated in first round - bonus points awarded!');
        // Joy Fool gets bonus points but game continues normally
      }

      if (eliminatedPlayer.specialRole === 'ghost') {
        console.log('👻 Ghost eliminated - they continue to participate!');
        // Ghost continues voting after elimination
      }
    }

    // Handle chain eliminations (Lovers, etc.) and continue game
    setEliminatedPlayer(eliminatedPlayer);
    await onPlayerEliminated(eliminatedPlayer);
  }

  /**
   * Handles undercover elimination and win condition checks
   */
  private async handleUndercoverElimination(eliminatedPlayer: Player): Promise<void> {
    const { players, onRevengerEliminated, onPlayerEliminated } = this.props;

    console.log(`🕵️ Processing undercover elimination: ${eliminatedPlayer.name}`);
    
    // Check for special role triggers first (only if special roles are enabled)
    if (eliminatedPlayer.specialRole) {
      if (eliminatedPlayer.specialRole === 'revenger') {
        console.log('⚔️ Undercover Revenger eliminated - triggering revenge!');
        this.props.onRevengerEliminated(eliminatedPlayer);
        return;
      }
    }

    // Count remaining impostors after this elimination
    const remainingImpostors = players.filter(p => 
      p.isAlive && 
      p.id !== eliminatedPlayer.id && 
      (p.role === 'undercover' || p.role === 'mrwhite')
    );

    console.log(`🕵️ After undercover elimination - Remaining impostors: ${remainingImpostors.length}`);

    if (remainingImpostors.length === 0) {
      console.log('🎉 Last impostor eliminated - Civilians win!');
    } else {
      console.log('🔄 Game continues - impostors remain');
    }

    await onPlayerEliminated(eliminatedPlayer);
  }

  /**
   * Handles Mr. White elimination with final guess logic
   */
  private async handleMrWhiteElimination(eliminatedPlayer: Player): Promise<void> {
    const { players, onRevengerEliminated, onMrWhiteEliminated, setEliminatedPlayer } = this.props;

    console.log(`❓ Processing Mr. White elimination: ${eliminatedPlayer.name}`);
    
    // Check for special role triggers first (only if special roles are enabled)
    if (eliminatedPlayer.specialRole) {
      if (eliminatedPlayer.specialRole === 'revenger') {
        console.log('⚔️ Mr. White Revenger eliminated - triggering revenge!');
        this.props.onRevengerEliminated(eliminatedPlayer);
        return;
      }
    }

    // Mr. White ALWAYS gets a guess opportunity when eliminated
    console.log('🎯 Mr. White eliminated - showing guess screen!');
    setEliminatedPlayer(eliminatedPlayer);
    await onMrWhiteEliminated(eliminatedPlayer);
  }

  // ==========================================
  // PHASE 5: SPECIAL ROLE MECHANICS
  // ==========================================

  /**
   * Handles special role chain reactions after elimination
   */
  public processSpecialRoleEffects(eliminatedPlayer: Player): {
    chainEliminations: string[];
    specialEffects: string[];
  } {
    const { players } = this.props;
    const chainEliminations: string[] = [];
    const specialEffects: string[] = [];

    // If no special role, return empty effects
    if (!eliminatedPlayer.specialRole) {
      return { chainEliminations, specialEffects };
    }

    // The Lovers: Chain elimination
    if (eliminatedPlayer.specialRole === 'lovers' && eliminatedPlayer.loverId) {
      const lover = players.find(p => p.id === eliminatedPlayer.loverId);
      if (lover && lover.isAlive) {
        chainEliminations.push(lover.id);
        specialEffects.push(`💕 ${lover.name} eliminated due to lover's bond`);
        console.log(`💕 Lover chain elimination: ${lover.name}`);
      }
    }

    // The Ghost: Continues participating
    if (eliminatedPlayer.specialRole === 'ghost') {
      specialEffects.push(`👻 ${eliminatedPlayer.name} continues as a ghost`);
      console.log(`👻 ${eliminatedPlayer.name} becomes a ghost and continues voting`);
    }

    // Joy Fool: Bonus points if eliminated first
    if (eliminatedPlayer.specialRole === 'joy-fool') {
      specialEffects.push(`🃏 ${eliminatedPlayer.name} achieved their goal`);
      console.log(`🃏 Joy Fool bonus applied to ${eliminatedPlayer.name}`);
    }

    return { chainEliminations, specialEffects };
  }

  // ==========================================
  // PHASE 6: WIN CONDITION CHECKS
  // ==========================================

  /**
   * Checks all possible win conditions after elimination
   */
  public checkWinConditions(playersAfterElimination: Player[]): {
    winner: string | null;
    isGameOver: boolean;
    reason: string;
  } {
    const alivePlayers = playersAfterElimination.filter(p => p.isAlive);
    const aliveCivilians = alivePlayers.filter(p => p.role === 'civilian');
    const aliveUndercovers = alivePlayers.filter(p => p.role === 'undercover');
    const aliveMrWhites = alivePlayers.filter(p => p.role === 'mrwhite');
    const totalImpostors = aliveUndercovers.length + aliveMrWhites.length;

    console.log(`🎯 Win check - Civilians: ${aliveCivilians.length}, Undercovers: ${aliveUndercovers.length}, Mr. Whites: ${aliveMrWhites.length}, Total Impostors: ${totalImpostors}`);

    // CIVILIANS WIN: All impostors (Undercover + Mr. White) eliminated
    if (totalImpostors === 0) {
      return { 
        winner: 'Civilians', 
        isGameOver: true, 
        reason: 'All impostors have been eliminated' 
      };
    }

    // IMPOSTORS WIN: Impostors equal or outnumber civilians (they can control votes)
    if (totalImpostors >= aliveCivilians.length && totalImpostors > 0) {
      // When both impostor types are present, they win as a team
      if (aliveUndercovers.length > 0 && aliveMrWhites.length > 0) {
        return {
          winner: 'Impostors',
          isGameOver: true,
          reason: `Impostors (${totalImpostors}) equal or outnumber civilians (${aliveCivilians.length})`
        };
      }
      // Only one impostor type remains - they get individual credit
      else if (aliveUndercovers.length > 0) {
        return {
          winner: 'Undercover',
          isGameOver: true,
          reason: `Undercover agents (${aliveUndercovers.length}) equal or outnumber civilians (${aliveCivilians.length})`
        };
      }
      else if (aliveMrWhites.length > 0) {
        return {
          winner: 'Mr. White',
          isGameOver: true,
          reason: `Mr. White (${aliveMrWhites.length}) equals or outnumbers civilians (${aliveCivilians.length})`
        };
      }
    }

    // Game continues
    return { 
      winner: null, 
      isGameOver: false, 
      reason: `Game continues - Civilians: ${aliveCivilians.length}, Impostors: ${totalImpostors}` 
    };
  }

  // ==========================================
  // PHASE 7: UTILITY FUNCTIONS
  // ==========================================

  /**
   * Gets current voting statistics for UI display
   */
  public getVotingStats() {
    const { getVotingPlayers, individualVotes, getCurrentVoter } = this.props;
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
  }

  /**
   * Gets vote distribution for results display
   */
  public getVoteDistribution() {
    const { votingResults, players } = this.props;
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
  }

  /**
   * Checks if Goddess of Justice is present and active
   */
  public hasGoddessOfJustice(): boolean {
    return this.props.players.some(p => {
      // Only check if player has special roles enabled
      if (!p.specialRole) return false;
      
      return p.specialRole === 'goddess-of-justice' && 
             (p.isAlive || p.canVote);
    });
  }
}

/**
 * HOOK INTERFACE FOR REACT COMPONENTS
 * 
 * This hook provides a clean interface to the voting system
 */
export const useVotingLogic = (props: VotingLogicProps) => {
  const votingPhase = new VotingPhase(props);

  return {
    // Core voting functions
    castVote: votingPhase.castVote,
    
    // Utility functions for UI
    getVotingStats: useCallback(() => votingPhase.getVotingStats(), [votingPhase]),
    getVoteDistribution: useCallback(() => votingPhase.getVoteDistribution(), [votingPhase]),
    hasGoddessOfJustice: useCallback(() => votingPhase.hasGoddessOfJustice(), [votingPhase]),
    
    // Special role processing
    processSpecialRoleEffects: useCallback(
      (player: Player) => votingPhase.processSpecialRoleEffects(player), 
      [votingPhase]
    ),
    
    // Win condition checking
    checkWinConditions: useCallback(
      (players: Player[]) => votingPhase.checkWinConditions(players), 
      [votingPhase]
    ),
  };
};