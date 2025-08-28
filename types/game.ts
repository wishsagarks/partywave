export type PlayerRole = 'civilian' | 'undercover' | 'mrwhite';
export type SpecialRole = 'goddess-of-justice' | 'lovers' | 'mr-meme' | 'revenger' | 'ghost' | 'joy-fool';
export type GamePhase = 'setup' | 'word-distribution' | 'description' | 'discussion' | 'voting' | 'elimination-result' | 'mr-white-guess' | 'final-results';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  specialRole?: SpecialRole;
  loverId?: string; // For lovers pairing
  isEliminated: boolean; // Separate from isAlive for Ghost role
  canVote: boolean; // For Ghost role
  word: string;
  isAlive: boolean;
  points: number;
  eliminationRound?: number;
}

export interface WordPair {
  id: string;
  civilian_word: string;
  undercover_word: string;
  category: string;
  difficulty_level: number;
  usage_count: number;
}

export interface WordLibrary {
  id: string;
  name: string;
  description: string | null;
  is_official: boolean;
  is_active: boolean;
  pairs: WordPair[];
}

export interface GameState {
  id: string;
  players: Player[];
  currentPhase: GamePhase;
  currentRound: number;
  currentPlayerIndex: number;
  currentDescriptionIndex: number;
  wordPair: WordPair | null;
  votingResults: { [playerId: string]: number };
  eliminatedPlayer: Player | null;
  eliminationHistory: Array<{
    round: number;
    player: Player;
    votesReceived: number;
    eliminationMethod: 'voting' | 'chain' | 'revenger' | 'mr-white-guess';
  }>;
  gameWinner: string;
  startTime: Date;
  endTime?: Date;
}

export interface VoteResult {
  playerId: string;
  votes: number;
}

export interface GameResult {
  winner: string;
  players: Array<{
    name: string;
    role: PlayerRole;
    word: string;
    points: number;
    wasWinner: boolean;
  }>;
  totalRounds: number;
  duration: number;
}