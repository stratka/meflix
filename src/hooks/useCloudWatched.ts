import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import type { WatchedMovies } from '../types/app';
import { supabase } from '../lib/supabase';

const LOCAL_KEY = 'meflix_watched';

function loadLocal(): WatchedMovies {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}'); }
  catch { return {}; }
}

function saveLocal(data: WatchedMovies) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

export function useCloudWatched(user: User | null) {
  const [watched, setWatched] = useState<WatchedMovies>(loadLocal);

  // Load from Supabase on login
  useEffect(() => {
    if (!user) return;
    supabase
      .from('watched_movies')
      .select('movie_id, title, watched_at')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return;
        const map: WatchedMovies = {};
        for (const r of data) map[r.movie_id] = { date: r.watched_at, title: r.title };
        setWatched(map);
        saveLocal(map);
      });
  }, [user?.id]);

  const markWatched = useCallback(async (id: number, title: string) => {
    const entry = { date: new Date().toISOString(), title };
    setWatched(prev => { const n = { ...prev, [id]: entry }; saveLocal(n); return n; });
    if (!user) return;
    await supabase.from('watched_movies').upsert({ user_id: user.id, movie_id: id, title, watched_at: entry.date });
  }, [user]);

  const unmarkWatched = useCallback(async (id: number) => {
    setWatched(prev => { const n = { ...prev }; delete n[id]; saveLocal(n); return n; });
    if (!user) return;
    await supabase.from('watched_movies').delete().eq('user_id', user.id).eq('movie_id', id);
  }, [user]);

  const isWatched = useCallback((id: number) => !!watched[id], [watched]);

  return { watched, markWatched, unmarkWatched, isWatched };
}
