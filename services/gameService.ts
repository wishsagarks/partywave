import { supabase } from '@/lib/supabase';
import { Player, WordPair, WordLibrary, GameResult, PlayerRole, SpecialRole } from '@/types/game';

export class GameService {
  // Player Management
  static async createOrUpdatePlayer(name: string): Promise<string> {
    try {
      // Check if player exists
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('name', name)
        .maybeSingle();

      if (existingPlayer) {
        return existingPlayer.id;
      }

      // Create new player
      const { data, error } = await supabase
        .from('players')
        .insert({ name })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating/updating player:', error);
      throw error;
    }
  }

  static async getTopPlayers(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching top players:', error);
      return [];
    }
  }

  // Word Library Management
  static async getActiveWordLibraries(): Promise<WordLibrary[]> {
    try {
      const { data: libraries, error: libError } = await supabase
        .from('word_libraries')
        .select('*')
        .eq('is_active', true)
        .order('is_official', { ascending: false });

      if (libError) throw libError;

      const librariesWithPairs = await Promise.all(
        (libraries || []).map(async (library) => {
          const { data: pairs, error: pairsError } = await supabase
            .from('word_pairs')
            .select('*')
            .eq('library_id', library.id)
            .order('usage_count', { ascending: true });

          if (pairsError) throw pairsError;

          return {
            ...library,
            pairs: pairs || [],
          };
        })
      );

      return librariesWithPairs;
    } catch (error) {
      console.error('Error fetching word libraries:', error);
      return [];
    }
  }

  static async getAllWordLibraries(): Promise<WordLibrary[]> {
    try {
      const { data: libraries, error: libError } = await supabase
        .from('word_libraries')
        .select('*')
        .order('is_official', { ascending: false });

      if (libError) throw libError;

      const librariesWithPairs = await Promise.all(
        (libraries || []).map(async (library) => {
          const { data: pairs, error: pairsError } = await supabase
            .from('word_pairs')
            .select('*')
            .eq('library_id', library.id);

          if (pairsError) throw pairsError;

          return {
            ...library,
            pairs: pairs || [],
          };
        })
      );

      return librariesWithPairs;
    } catch (error) {
      console.error('Error fetching all word libraries:', error);
      return [];
    }
  }

  static async toggleWordLibrary(libraryId: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('word_libraries')
        .update({ is_active: isActive })
        .eq('id', libraryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling word library:', error);
      throw error;
    }
  }

  static async addCustomWordPair(
    civilianWord: string,
    undercoverWord: string,
    category: string = 'Custom'
  ): Promise<void> {
    try {
      // Get Custom Pack library ID
      const { data: customLib, error: libError } = await supabase
        .from('word_libraries')
        .select('id')
        .eq('name', 'Custom Pack')
        .single();

      if (libError) throw libError;

      const { error } = await supabase
        .from('word_pairs')
        .insert({
          library_id: customLib.id,
          civilian_word: civilianWord,
          undercover_word: undercoverWord,
          category,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding custom word pair:', error);
      throw error;
    }
  }

  static async deleteWordPair(pairId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('word_pairs')
        .delete()
        .eq('id', pairId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting word pair:', error);
      throw error;
    }
  }

  static async updateWordPair(
    pairId: string,
    civilianWord: string,
    undercoverWord: string,
    category: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('word_pairs')
        .update({
          civilian_word: civilianWord,
          undercover_word: undercoverWord,
          category,
        })
        .eq('id', pairId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating word pair:', error);
      throw error;
    }
  }

  // Game Initialization
  static async initializeGame(options: {
    playerNames: string[];
    playerIds: string[];
    customRoles?: { civilians: number; undercover: number; mrWhite: number };
    useSpecialRoles?: boolean;
    selectedSpecialRoles?: SpecialRole[];
  }): Promise<{ players: Player[]; wordPair: WordPair } | null> {
    try {
      const { playerNames, playerIds, customRoles, useSpecialRoles, selectedSpecialRoles } = options;

      // Get random word pair
      const wordPair = await this.getRandomWordPair();
      if (!wordPair) {
        throw new Error('No word pairs available');
      }

      // Assign roles to players
      const players = this.assignRoles(
        playerNames,
        wordPair,
        playerIds,
        customRoles,
        useSpecialRoles,
        selectedSpecialRoles
      );

      // Increment word pair usage count
      await supabase
        .from('word_pairs')
        .update({ usage_count: wordPair.usage_count + 1 })
        .eq('id', wordPair.id);

      return { players, wordPair };
    } catch (error) {
      console.error('Error initializing game:', error);
      return null;
    }
  }

  // Game Management
  static async getRandomWordPair(): Promise<WordPair | null> {
    try {
      const libraries = await this.getActiveWordLibraries();
      const allPairs = libraries.flatMap(lib => lib.pairs);
      
      if (allPairs.length === 0) return null;
      
      // Prefer less-used word pairs for variety
      const sortedPairs = allPairs.sort((a, b) => a.usage_count - b.usage_count);
      const leastUsedCount = sortedPairs[0]?.usage_count || 0;
      const leastUsedPairs = sortedPairs.filter(pair => pair.usage_count === leastUsedCount);
      
      return leastUsedPairs[Math.floor(Math.random() * leastUsedPairs.length)];
    } catch (error) {
      console.error('Error getting random word pair:', error);
      return null;
    }
  }

  static async createGame(playerCount: number, gameName: string = 'Unnamed Game'): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('games')
        .insert({
          player_count: playerCount,
          game_name: gameName,
          total_rounds: 0,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  static async saveGameResult(
    gameId: string,
    result: GameResult,
    wordPair: WordPair,
    playerIds: string[]
  ): Promise<void> {
    try {
      // Update game with final results
      const { error: gameError } = await supabase
        .from('games')
        .update({
          winner_role: result.winner.toLowerCase(),
          total_rounds: result.totalRounds,
          duration_minutes: result.duration,
          word_pair_used: {
            civilian: wordPair.civilian_word,
            undercover: wordPair.undercover_word,
            category: wordPair.category,
          },
          completed_at: new Date().toISOString(),
        })
        .eq('id', gameId);

      if (gameError) throw gameError;

      // Save participant results
      const participantData = result.players.map((player) => ({
        game_id: gameId,
        player_id: player.id,
        role: player.role,
        word_assigned: player.word,
        points_earned: player.points,
        was_winner: player.wasWinner,
      }));

      const { error: participantError } = await supabase
        .from('game_participants')
        .insert(participantData);

      if (participantError) throw participantError;
    } catch (error) {
      console.error('Error saving game result:', error);
      throw error;
    }
  }

  static async getRecentGames(limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          game_participants (
            *,
            players (name)
          )
        `)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent games:', error);
      return [];
    }
  }

  static async saveGameRound(
    gameId: string,
    roundNumber: number,
    eliminatedPlayerId: string,
    voteResults: { [playerId: string]: number },
    mrWhiteGuess?: string,
    mrWhiteGuessCorrect?: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_rounds')
        .insert({
          game_id: gameId,
          round_number: roundNumber,
          eliminated_player_id: eliminatedPlayerId,
          vote_results: voteResults,
          mr_white_guess: mrWhiteGuess,
          mr_white_guess_correct: mrWhiteGuessCorrect,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving game round:', error);
      throw error;
    }
  }

  // Role Assignment Logic (following specification)
  static getRoleDistribution(playerCount: number): {
    civilians: number;
    undercover: number;
    mrWhite: number;
  } {
    if (playerCount <= 4) {
      return {
        civilians: playerCount - 1,
        undercover: 1,
        mrWhite: 0,
      };
    } else if (playerCount <= 7) {
      return {
        civilians: playerCount - 2,
        undercover: 1,
        mrWhite: 1,
      };
    } else if (playerCount <= 12) {
      return {
        civilians: playerCount - 3,
        undercover: 2,
        mrWhite: 1,
      };
    } else {
      return {
        civilians: playerCount - 4,
        undercover: 3,
        mrWhite: 1,
      };
    }
  }

  static assignRoles(
    playerNames: string[], 
    wordPair: WordPair, 
    playerIds: string[], 
    customRoles?: { civilians: number; undercover: number; mrWhite: number },
    useSpecialRoles?: boolean,
    selectedSpecialRoles?: SpecialRole[]
  ): Player[] {
    const playerCount = playerNames.length;
    
    // Use custom roles if provided, otherwise use default distribution
    let distribution;
    if (customRoles) {
      // Validate custom roles configuration
      const totalCustomRoles = customRoles.civilians + customRoles.undercover + customRoles.mrWhite;
      if (totalCustomRoles !== playerCount) {
        console.warn(`Custom roles total (${totalCustomRoles}) doesn't match player count (${playerCount}). Using default distribution.`);
        distribution = this.getRoleDistribution(playerCount);
      } else {
        distribution = customRoles;
      }
    } else {
      distribution = this.getRoleDistribution(playerCount);
    }
    
    // Validate final distribution
    const totalRoles = distribution.civilians + distribution.undercover + distribution.mrWhite;
    if (totalRoles !== playerCount) {
      throw new Error(`Role distribution error: ${totalRoles} roles for ${playerCount} players`);
    }
    
    // Create role array
    const roles: PlayerRole[] = [
      ...Array(distribution.civilians).fill('civilian'),
      ...Array(distribution.undercover).fill('undercover'),
      ...Array(distribution.mrWhite).fill('mrwhite'),
    ];
    
    // Validate role array length
    if (roles.length !== playerCount) {
      throw new Error(`Role array length (${roles.length}) doesn't match player count (${playerCount})`);
    }

    // Multiple shuffles for maximum randomness
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    
    // Additional shuffle with different seed
    for (let i = 0; i < roles.length; i++) {
      const j = Math.floor(Math.random() * roles.length);
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // Create multiple shuffled arrays for maximum randomness
    const playerIndices = Array.from({ length: playerNames.length }, (_, i) => i);
    
    // First shuffle
    for (let i = playerIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIndices[i], playerIndices[j]] = [playerIndices[j], playerIndices[i]];
    }
    
    // Second shuffle with different pattern
    for (let i = 0; i < playerIndices.length; i++) {
      const j = Math.floor(Math.random() * playerIndices.length);
      [playerIndices[i], playerIndices[j]] = [playerIndices[j], playerIndices[i]];
    }
    
    // Third shuffle for roles array again
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // Assign basic roles to players
    const players = playerNames.map((name, originalIndex) => {
      const shuffledIndex = playerIndices[originalIndex];
      const role = roles[shuffledIndex];
      
      return {
      id: playerIds[originalIndex],
      name,
      role,
      isEliminated: false,
      canVote: true,
      word: role === 'civilian' ? wordPair.civilian_word :
            role === 'undercover' ? wordPair.undercover_word : '',
      isAlive: true,
      points: 0,
    };
    });
    
    // Final validation: count assigned roles
    const assignedCivilians = players.filter(p => p.role === 'civilian').length;
    const assignedUndercover = players.filter(p => p.role === 'undercover').length;
    const assignedMrWhite = players.filter(p => p.role === 'mrwhite').length;
    
    if (assignedCivilians !== distribution.civilians || 
        assignedUndercover !== distribution.undercover || 
        assignedMrWhite !== distribution.mrWhite) {
      throw new Error(`Role assignment mismatch: Expected ${distribution.civilians}/${distribution.undercover}/${distribution.mrWhite}, got ${assignedCivilians}/${assignedUndercover}/${assignedMrWhite}`);
    }

    // Assign special roles if enabled
    if (useSpecialRoles && selectedSpecialRoles && selectedSpecialRoles.length > 0) {
      return this.assignSpecialRoles(players, selectedSpecialRoles);
    }

    return players;
  }

  static assignSpecialRoles(players: Player[], selectedSpecialRoles: SpecialRole[]): Player[] {
    const availablePlayers = [...players];
    const updatedPlayers = [...players];

    // Shuffle available players for random assignment
    for (let i = availablePlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePlayers[i], availablePlayers[j]] = [availablePlayers[j], availablePlayers[i]];
    }

    let playerIndex = 0;

    for (const specialRole of selectedSpecialRoles) {
      if (specialRole === 'lovers') {
        // Assign lovers pair
        if (playerIndex + 1 < availablePlayers.length) {
          const lover1 = availablePlayers[playerIndex];
          const lover2 = availablePlayers[playerIndex + 1];
          
          const lover1Index = updatedPlayers.findIndex(p => p.id === lover1.id);
          const lover2Index = updatedPlayers.findIndex(p => p.id === lover2.id);
          
          updatedPlayers[lover1Index].specialRole = 'lovers';
          updatedPlayers[lover1Index].loverId = lover2.id;
          updatedPlayers[lover2Index].specialRole = 'lovers';
          updatedPlayers[lover2Index].loverId = lover1.id;
          
          playerIndex += 2;
        }
      } else {
        // Assign single special role
        if (playerIndex < availablePlayers.length) {
          const player = availablePlayers[playerIndex];
          const playerIndexInArray = updatedPlayers.findIndex(p => p.id === player.id);
          updatedPlayers[playerIndexInArray].specialRole = specialRole;
          playerIndex++;
        }
      }
    }

    return updatedPlayers;
  }

  static resolveVotingTie(
    players: Player[], 
    votingResults: {[key: string]: number},
    hasGoddessOfJustice: boolean
  ): { eliminatedPlayerId: string | null; tieResolved: boolean } {
    const maxVotes = Math.max(...Object.values(votingResults));
    const tiedPlayerIds = Object.entries(votingResults)
      .filter(([_, votes]) => votes === maxVotes)
      .map(([id, _]) => id);

    if (tiedPlayerIds.length <= 1) {
      return { 
        eliminatedPlayerId: tiedPlayerIds[0] || null, 
        tieResolved: true 
      };
    }

    // If Goddess of Justice is present, randomly resolve tie
    if (hasGoddessOfJustice) {
      const randomIndex = Math.floor(Math.random() * tiedPlayerIds.length);
      return { 
        eliminatedPlayerId: tiedPlayerIds[randomIndex], 
        tieResolved: true 
      };
    }

    return { eliminatedPlayerId: null, tieResolved: false };
  }

  static handleSpecialRoleElimination(
    players: Player[], 
    eliminatedPlayerId: string
  ): { updatedPlayers: Player[]; chainEliminations: string[] } {
    const updatedPlayers = [...players];
    const chainEliminations: string[] = [];
    const eliminatedPlayer = updatedPlayers.find(p => p.id === eliminatedPlayerId);

    if (!eliminatedPlayer) {
      return { updatedPlayers, chainEliminations };
    }

    // Handle Lovers elimination
    if (eliminatedPlayer.specialRole === 'lovers' && eliminatedPlayer.loverId) {
      const lover = updatedPlayers.find(p => p.id === eliminatedPlayer.loverId);
      if (lover && lover.isAlive) {
        const loverIndex = updatedPlayers.findIndex(p => p.id === lover.id);
        updatedPlayers[loverIndex].isAlive = false;
        updatedPlayers[loverIndex].isEliminated = true;
        updatedPlayers[loverIndex].canVote = false;
        chainEliminations.push(lover.id);
      }
    }

    // Handle Ghost role - they can still vote after elimination
    if (eliminatedPlayer.specialRole === 'ghost') {
      const playerIndex = updatedPlayers.findIndex(p => p.id === eliminatedPlayerId);
      updatedPlayers[playerIndex].isEliminated = true;
      updatedPlayers[playerIndex].canVote = true; // Ghost can still vote
    } else {
      // Normal elimination
      const playerIndex = updatedPlayers.findIndex(p => p.id === eliminatedPlayerId);
      updatedPlayers[playerIndex].isEliminated = true;
      updatedPlayers[playerIndex].canVote = false;
    }

    return { updatedPlayers, chainEliminations };
  }

  static handleRevengerElimination(
    players: Player[], 
    revengerId: string, 
    targetId: string
  ): Player[] {
    const updatedPlayers = [...players];
    const targetIndex = updatedPlayers.findIndex(p => p.id === targetId);
    
    if (targetIndex >= 0) {
      updatedPlayers[targetIndex].isAlive = false;
      updatedPlayers[targetIndex].isEliminated = true;
      updatedPlayers[targetIndex].canVote = false;
      
      // Handle chain eliminations if target is a Lover
      const { updatedPlayers: finalPlayers } = this.handleSpecialRoleElimination(updatedPlayers, targetId);
      return finalPlayers;
    }
    
    return updatedPlayers;
  }

  static checkJoyFoolWin(players: Player[], eliminatedPlayerId: string, roundNumber: number): boolean {
    const eliminatedPlayer = players.find(p => p.id === eliminatedPlayerId);
    return eliminatedPlayer?.specialRole === 'joy-fool' && roundNumber === 1;
  }

  static getSpecialRoleDescription(role: SpecialRole): string {
    switch (role) {
      case 'goddess-of-justice':
        return 'Automatically resolves voting ties by randomly selecting one tied player for elimination.';
      case 'lovers':
        return 'Two players secretly linked. If one is eliminated, the other is automatically eliminated too.';
      case 'mr-meme':
        return 'Must communicate only through miming and gestures - no verbal clues allowed!';
      case 'revenger':
        return 'When eliminated, can choose one other player to eliminate instantly.';
      case 'ghost':
        return 'Even after elimination, continues to participate in discussions and voting.';
      case 'joy-fool':
        return 'Wins bonus points if eliminated in the first round. Encourages suspicious behavior!';
      default:
        return 'Unknown special role.';
    }
  }

  static getSpecialRoleEmoji(role: SpecialRole): string {
    switch (role) {
      case 'goddess-of-justice': return '⚖️';
      case 'lovers': return '💕';
      case 'mr-meme': return '🤡';
      case 'revenger': return '⚔️';
      case 'ghost': return '👻';
      case 'joy-fool': return '🃏';
      default: return '❓';
    }
  }

  static checkWinCondition(players: Player[]): {
    winner: string | null;
    isGameOver: boolean;
  } {
    const alivePlayers = players.filter(p => p.isAlive);
    const aliveCivilians = alivePlayers.filter(p => p.role === 'civilian');
    const aliveUndercovers = alivePlayers.filter(p => p.role === 'undercover');
    const aliveMrWhites = alivePlayers.filter(p => p.role === 'mrwhite');
    const totalImpostors = aliveUndercovers.length + aliveMrWhites.length;

    // Civilians win: all impostors eliminated
    if (totalImpostors === 0) {
      return { winner: 'Civilians', isGameOver: true };
    }

    // Impostors win: equal or outnumber civilians
    if (totalImpostors >= aliveCivilians.length && totalImpostors > 0) {
      // Determine winner based on remaining impostor composition
      if (aliveUndercovers.length > aliveMrWhites.length) {
        return { winner: 'Undercover', isGameOver: true };
      } else if (aliveMrWhites.length > aliveUndercovers.length) {
        return { winner: 'Mr. White', isGameOver: true };
      } else {
        return { winner: 'Undercover', isGameOver: true }; // Default to Undercover
      }
    }

    // Game continues
    return { winner: null, isGameOver: false };
  }

    return { winner: null, isGameOver: false };
  }

  static calculatePoints(players: Player[], winner: string): Player[] {
    return players.map(player => {
      let points = 0;
      
      if (winner === 'Civilians' && player.role === 'civilian') {
        points = 2;
      } else if (winner === 'Mr. White' && player.role === 'mrwhite') {
        points = 6;
      } else if (winner === 'Undercover' && player.role === 'undercover') {
        points = 10;
      } else if (winner === 'Impostors' && (player.role === 'undercover' || player.role === 'mrwhite')) {
        points = player.role === 'undercover' ? 10 : 6;
      }

      return { ...player, points };
    });
  }
}