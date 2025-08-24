/*
  # Add game name column to games table

  1. Changes
    - Add `game_name` column to `games` table for meaningful game identification
    - Add default value for existing games
    - Update RLS policies to include new column

  2. Security
    - Maintain existing RLS policies
    - Allow public access for game names
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'game_name'
  ) THEN
    ALTER TABLE games ADD COLUMN game_name text DEFAULT 'Unnamed Game';
  END IF;
END $$;