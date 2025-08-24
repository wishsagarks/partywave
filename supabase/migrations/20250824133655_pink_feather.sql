/*
  # Undercover Game Database Schema

  1. New Tables
    - `players`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `total_points` (integer, default 0)
      - `games_played` (integer, default 0)
      - `games_won` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `games`
      - `id` (uuid, primary key)
      - `player_count` (integer)
      - `winner_role` (text)
      - `total_rounds` (integer)
      - `duration_minutes` (integer)
      - `word_pair_used` (jsonb)
      - `created_at` (timestamp)
      - `completed_at` (timestamp)
    
    - `game_participants`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key)
      - `player_id` (uuid, foreign key)
      - `role` (text)
      - `word_assigned` (text)
      - `points_earned` (integer, default 0)
      - `elimination_round` (integer, nullable)
      - `was_winner` (boolean, default false)
    
    - `word_libraries`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `is_official` (boolean, default false)
      - `is_active` (boolean, default true)
      - `created_by` (uuid, nullable)
      - `created_at` (timestamp)
    
    - `word_pairs`
      - `id` (uuid, primary key)
      - `library_id` (uuid, foreign key)
      - `civilian_word` (text)
      - `undercover_word` (text)
      - `category` (text)
      - `difficulty_level` (integer, default 1)
      - `usage_count` (integer, default 0)
      - `created_at` (timestamp)
    
    - `game_rounds`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key)
      - `round_number` (integer)
      - `eliminated_player_id` (uuid, foreign key)
      - `vote_results` (jsonb)
      - `mr_white_guess` (text, nullable)
      - `mr_white_guess_correct` (boolean, nullable)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (since this is a party game)
    - Add policies for authenticated users to manage custom content
</*/

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  total_points integer DEFAULT 0,
  games_played integer DEFAULT 0,
  games_won integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_count integer NOT NULL,
  winner_role text,
  total_rounds integer DEFAULT 0,
  duration_minutes integer,
  word_pair_used jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create game_participants table
CREATE TABLE IF NOT EXISTS game_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  role text NOT NULL,
  word_assigned text,
  points_earned integer DEFAULT 0,
  elimination_round integer,
  was_winner boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create word_libraries table
CREATE TABLE IF NOT EXISTS word_libraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_official boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create word_pairs table
CREATE TABLE IF NOT EXISTS word_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid REFERENCES word_libraries(id) ON DELETE CASCADE,
  civilian_word text NOT NULL,
  undercover_word text NOT NULL,
  category text DEFAULT 'General',
  difficulty_level integer DEFAULT 1,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create game_rounds table
CREATE TABLE IF NOT EXISTS game_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  eliminated_player_id uuid REFERENCES players(id),
  vote_results jsonb,
  mr_white_guess text,
  mr_white_guess_correct boolean,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (party game needs open access)
CREATE POLICY "Anyone can read players"
  ON players FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert players"
  ON players FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update players"
  ON players FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can read games"
  ON games FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert games"
  ON games FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update games"
  ON games FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can read game_participants"
  ON game_participants FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert game_participants"
  ON game_participants FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update game_participants"
  ON game_participants FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can read word_libraries"
  ON word_libraries FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert word_libraries"
  ON word_libraries FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update word_libraries"
  ON word_libraries FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can read word_pairs"
  ON word_pairs FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert word_pairs"
  ON word_pairs FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update word_pairs"
  ON word_pairs FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can read game_rounds"
  ON game_rounds FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert game_rounds"
  ON game_rounds FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_total_points ON players(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_word_pairs_library_id ON word_pairs(library_id);
CREATE INDEX IF NOT EXISTS idx_word_libraries_active ON word_libraries(is_active);

-- Insert official word libraries
INSERT INTO word_libraries (name, description, is_official, is_active) VALUES
  ('Animals', 'Pets, wild animals, and creatures', true, true),
  ('Food & Drinks', 'Meals, beverages, and culinary items', true, true),
  ('Entertainment', 'Movies, music, sports, and leisure', true, true),
  ('Professions', 'Jobs, careers, and occupations', true, false),
  ('Objects & Tools', 'Everyday items and equipment', true, false),
  ('Places & Travel', 'Locations, destinations, and geography', true, false),
  ('Custom Pack', 'User-created word pairs', false, true)
ON CONFLICT (name) DO NOTHING;

-- Get library IDs for inserting word pairs
DO $$
DECLARE
  animals_id uuid;
  food_id uuid;
  entertainment_id uuid;
  professions_id uuid;
  objects_id uuid;
  places_id uuid;
BEGIN
  SELECT id INTO animals_id FROM word_libraries WHERE name = 'Animals';
  SELECT id INTO food_id FROM word_libraries WHERE name = 'Food & Drinks';
  SELECT id INTO entertainment_id FROM word_libraries WHERE name = 'Entertainment';
  SELECT id INTO professions_id FROM word_libraries WHERE name = 'Professions';
  SELECT id INTO objects_id FROM word_libraries WHERE name = 'Objects & Tools';
  SELECT id INTO places_id FROM word_libraries WHERE name = 'Places & Travel';

  -- Insert Animals word pairs
  INSERT INTO word_pairs (library_id, civilian_word, undercover_word, category, difficulty_level) VALUES
    (animals_id, 'Cat', 'Dog', 'Pets', 1),
    (animals_id, 'Lion', 'Tiger', 'Wild Cats', 2),
    (animals_id, 'Snake', 'Lizard', 'Reptiles', 2),
    (animals_id, 'Eagle', 'Hawk', 'Birds of Prey', 3),
    (animals_id, 'Whale', 'Dolphin', 'Marine Mammals', 2),
    (animals_id, 'Horse', 'Zebra', 'Equines', 2),
    (animals_id, 'Butterfly', 'Moth', 'Flying Insects', 3),
    (animals_id, 'Rabbit', 'Hamster', 'Small Mammals', 1),
    (animals_id, 'Shark', 'Barracuda', 'Predator Fish', 3),
    (animals_id, 'Owl', 'Raven', 'Night Birds', 2)
  ON CONFLICT DO NOTHING;

  -- Insert Food & Drinks word pairs
  INSERT INTO word_pairs (library_id, civilian_word, undercover_word, category, difficulty_level) VALUES
    (food_id, 'Coffee', 'Tea', 'Hot Beverages', 1),
    (food_id, 'Pizza', 'Burger', 'Fast Food', 1),
    (food_id, 'Apple', 'Orange', 'Fruits', 1),
    (food_id, 'Chocolate', 'Vanilla', 'Flavors', 1),
    (food_id, 'Sandwich', 'Wrap', 'Lunch Items', 1),
    (food_id, 'Pasta', 'Noodles', 'Carbohydrates', 2),
    (food_id, 'Wine', 'Beer', 'Alcoholic Drinks', 2),
    (food_id, 'Cake', 'Pie', 'Desserts', 1),
    (food_id, 'Soup', 'Stew', 'Hot Meals', 2),
    (food_id, 'Cheese', 'Butter', 'Dairy Products', 2),
    (food_id, 'Bread', 'Toast', 'Baked Goods', 1),
    (food_id, 'Salad', 'Soup', 'Healthy Options', 2)
  ON CONFLICT DO NOTHING;

  -- Insert Entertainment word pairs
  INSERT INTO word_pairs (library_id, civilian_word, undercover_word, category, difficulty_level) VALUES
    (entertainment_id, 'Movie', 'TV Show', 'Visual Media', 1),
    (entertainment_id, 'Guitar', 'Piano', 'Musical Instruments', 1),
    (entertainment_id, 'Football', 'Basketball', 'Team Sports', 1),
    (entertainment_id, 'Book', 'Magazine', 'Reading Material', 1),
    (entertainment_id, 'Theatre', 'Cinema', 'Entertainment Venues', 2),
    (entertainment_id, 'Concert', 'Festival', 'Live Events', 2),
    (entertainment_id, 'Video Game', 'Board Game', 'Games', 1),
    (entertainment_id, 'Podcast', 'Radio', 'Audio Content', 2),
    (entertainment_id, 'Dancing', 'Singing', 'Performance Arts', 2),
    (entertainment_id, 'Comedy', 'Drama', 'Entertainment Genres', 3)
  ON CONFLICT DO NOTHING;

  -- Insert Professions word pairs
  INSERT INTO word_pairs (library_id, civilian_word, undercover_word, category, difficulty_level) VALUES
    (professions_id, 'Doctor', 'Nurse', 'Medical', 1),
    (professions_id, 'Teacher', 'Professor', 'Education', 1),
    (professions_id, 'Chef', 'Baker', 'Culinary', 1),
    (professions_id, 'Pilot', 'Captain', 'Transportation', 2),
    (professions_id, 'Artist', 'Designer', 'Creative', 2),
    (professions_id, 'Engineer', 'Architect', 'Technical', 2),
    (professions_id, 'Lawyer', 'Judge', 'Legal', 2),
    (professions_id, 'Farmer', 'Gardener', 'Agriculture', 1),
    (professions_id, 'Scientist', 'Researcher', 'Academic', 3),
    (professions_id, 'Mechanic', 'Electrician', 'Trades', 2)
  ON CONFLICT DO NOTHING;

  -- Insert Objects & Tools word pairs
  INSERT INTO word_pairs (library_id, civilian_word, undercover_word, category, difficulty_level) VALUES
    (objects_id, 'Pencil', 'Pen', 'Writing Tools', 1),
    (objects_id, 'Hammer', 'Screwdriver', 'Hand Tools', 1),
    (objects_id, 'Phone', 'Tablet', 'Electronics', 1),
    (objects_id, 'Chair', 'Stool', 'Seating', 1),
    (objects_id, 'Umbrella', 'Raincoat', 'Weather Protection', 2),
    (objects_id, 'Watch', 'Clock', 'Timepieces', 1),
    (objects_id, 'Backpack', 'Suitcase', 'Luggage', 1),
    (objects_id, 'Glasses', 'Sunglasses', 'Eyewear', 1),
    (objects_id, 'Knife', 'Fork', 'Cutlery', 1),
    (objects_id, 'Mirror', 'Window', 'Transparent Objects', 2)
  ON CONFLICT DO NOTHING;

  -- Insert Places & Travel word pairs
  INSERT INTO word_pairs (library_id, civilian_word, undercover_word, category, difficulty_level) VALUES
    (places_id, 'Beach', 'Lake', 'Water Bodies', 1),
    (places_id, 'Mountain', 'Hill', 'Elevated Terrain', 1),
    (places_id, 'City', 'Town', 'Urban Areas', 1),
    (places_id, 'Hotel', 'Motel', 'Accommodation', 1),
    (places_id, 'Airport', 'Train Station', 'Transport Hubs', 2),
    (places_id, 'Restaurant', 'Cafe', 'Dining Venues', 1),
    (places_id, 'Park', 'Garden', 'Green Spaces', 1),
    (places_id, 'Museum', 'Gallery', 'Cultural Venues', 2),
    (places_id, 'Library', 'Bookstore', 'Book Venues', 2),
    (places_id, 'Hospital', 'Clinic', 'Medical Facilities', 2)
  ON CONFLICT DO NOTHING;
END $$;

-- Create function to update player statistics
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total points and games played
  UPDATE players 
  SET 
    total_points = total_points + NEW.points_earned,
    games_played = games_played + 1,
    games_won = games_won + (CASE WHEN NEW.was_winner THEN 1 ELSE 0 END),
    updated_at = now()
  WHERE id = NEW.player_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update player stats
CREATE TRIGGER update_player_stats_trigger
  AFTER INSERT ON game_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats();

-- Create function to increment word pair usage
CREATE OR REPLACE FUNCTION increment_word_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract word pair info from the game data
  IF NEW.word_pair_used IS NOT NULL THEN
    UPDATE word_pairs 
    SET usage_count = usage_count + 1
    WHERE civilian_word = (NEW.word_pair_used->>'civilian')
      AND undercover_word = (NEW.word_pair_used->>'undercover');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to track word pair usage
CREATE TRIGGER increment_word_usage_trigger
  AFTER UPDATE ON games
  FOR EACH ROW
  WHEN (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION increment_word_usage();