import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseEnabled = !!(url && key);

export const supabase = supabaseEnabled
  ? createClient(url!, key!)
  : createClient('https://placeholder.supabase.co', 'placeholder');

export type DbUserSettings = {
  user_id: string;
  region: string;
  selected_services: string[];
  updated_at: string;
};

export type DbWatchedMovie = {
  user_id: string;
  movie_id: number;
  title: string;
  watched_at: string;
};

export type DbWatchlistItem = {
  user_id: string;
  movie_id: number;
  title: string;
  added_at: string;
};
