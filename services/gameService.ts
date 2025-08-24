import { supabase } from '@/lib/supabase';
import { Player, WordPair, WordLibrary, GameResult, PlayerRole } from '@/types/game';

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

  static async createGame(playerCount: number): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('games')
        .insert({
          player_count: playerCount,
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
      const participantData = result.players.map((player, index) => ({
        game_id: gameId,
        player_id: playerIds[index],
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

  static assignRoles(playerNames: string[], wordPair: WordPair, playerIds: string[]): Player[] {
    const playerCount = playerNames.length;
    const distribution = this.getRoleDistribution(playerCount);
    
    // Create role array
    const roles: PlayerRole[] = [
      ...Array(distribution.civilians).fill('civilian'),
      ...Array(distribution.undercover).fill('undercover'),
      ...Array(distribution.mrWhite).fill('mrwhite'),
    ];

    // Shuffle roles using Fisher-Yates algorithm for true randomness
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // Create a shuffled array of player indices to ensure role assignment is independent of player order
    const playerIndices = Array.from({ length: playerNames.length }, (_, i) => i);
    for (let i = playerIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIndices[i], playerIndices[j]] = [playerIndices[j], playerIndices[i]];
    }

    // Assign to players
    return playerNames.map((name, originalIndex) => {
      const shuffledIndex = playerIndices[originalIndex];
      const role = roles[shuffledIndex];
      
      return {
      id: playerIds[originalIndex],
      name,
      role,
      word: role === 'civilian' ? wordPair.civilian_word :
            role === 'undercover' ? wordPair.undercover_word : '',
      isAlive: true,
      points: 0,
    };
    });
  }

  static checkWinCondition(players: Player[]): {
    winner: string | null;
    isGameOver: boolean;
  } {
    const alivePlayers = players.filter(p => p.isAlive);
    const aliveCivilians = alivePlayers.filter(p => p.role === 'civilian');
    const aliveUndercovers = alivePlayers.filter(p => p.role === 'undercover');
    const aliveMrWhites = alivePlayers.filter(p => p.role === 'mrwhite');

    // Civilians win: all impostors eliminated
    if (aliveUndercovers.length === 0 && aliveMrWhites.length === 0) {
      return { winner: 'Civilians', isGameOver: true };
    }

    // Impostors win: civilians reduced to 1 or fewer
    if (aliveCivilians.length <= 1) {
      if (aliveUndercovers.length > 0 && aliveMrWhites.length > 0) {
        return { winner: 'Impostors', isGameOver: true };
      } else if (aliveUndercovers.length > 0) {
        return { winner: 'Undercover', isGameOver: true };
      } else if (aliveMrWhites.length > 0) {
        return { winner: 'Mr. White', isGameOver: true };
      }
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