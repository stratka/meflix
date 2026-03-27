-- Run this in Supabase SQL Editor

CREATE TABLE user_settings (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  region TEXT NOT NULL DEFAULT 'CZ',
  selected_services TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE watched_movies (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE TABLE watchlist (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

-- Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own data only" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data only" ON watched_movies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data only" ON watchlist FOR ALL USING (auth.uid() = user_id);
