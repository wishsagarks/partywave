export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          name: string
          total_points: number
          games_played: number
          games_won: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          total_points?: number
          games_played?: number
          games_won?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          total_points?: number
          games_played?: number
          games_won?: number
          created_at?: string
          updated_at?: string
        }
      }
      games: {
        Row: {
          id: string
          game_name: string
          player_count: number
          winner_role: string | null
          total_rounds: number
          duration_minutes: number | null
          word_pair_used: Json | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          game_name?: string
          player_count: number
          winner_role?: string | null
          total_rounds?: number
          duration_minutes?: number | null
          word_pair_used?: Json | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          game_name?: string
          player_count?: number
          winner_role?: string | null
          total_rounds?: number
          duration_minutes?: number | null
          word_pair_used?: Json | null
          created_at?: string
          completed_at?: string | null
        }
      }
      game_participants: {
        Row: {
          id: string
          game_id: string | null
          player_id: string | null
          role: string
          word_assigned: string | null
          points_earned: number
          elimination_round: number | null
          was_winner: boolean
          created_at: string
        }
        Insert: {
          id?: string
          game_id?: string | null
          player_id?: string | null
          role: string
          word_assigned?: string | null
          points_earned?: number
          elimination_round?: number | null
          was_winner?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string | null
          player_id?: string | null
          role?: string
          word_assigned?: string | null
          points_earned?: number
          elimination_round?: number | null
          was_winner?: boolean
          created_at?: string
        }
      }
      word_libraries: {
        Row: {
          id: string
          name: string
          description: string | null
          is_official: boolean
          is_active: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_official?: boolean
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_official?: boolean
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
      }
      word_pairs: {
        Row: {
          id: string
          library_id: string | null
          civilian_word: string
          undercover_word: string
          category: string
          difficulty_level: number
          usage_count: number
          created_at: string
        }
        Insert: {
          id?: string
          library_id?: string | null
          civilian_word: string
          undercover_word: string
          category?: string
          difficulty_level?: number
          usage_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          library_id?: string | null
          civilian_word?: string
          undercover_word?: string
          category?: string
          difficulty_level?: number
          usage_count?: number
          created_at?: string
        }
      }
      game_rounds: {
        Row: {
          id: string
          game_id: string | null
          round_number: number
          eliminated_player_id: string | null
          vote_results: Json | null
          mr_white_guess: string | null
          mr_white_guess_correct: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id?: string | null
          round_number: number
          eliminated_player_id?: string | null
          vote_results?: Json | null
          mr_white_guess?: string | null
          mr_white_guess_correct?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string | null
          round_number?: number
          eliminated_player_id?: string | null
          vote_results?: Json | null
          mr_white_guess?: string | null
          mr_white_guess_correct?: boolean | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}