import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const LOCAL_KEY = 'meflix_watchlist';

function loadLocal(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')); }
  catch { return new Set(); }
}

function saveLocal(data: Set<number>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify([...data]));
}

export function useCloudWatchlist(user: User | null) {
  const [watchlist, setWatchlist] = useState<Set<number>>(loadLocal);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('watchlist')
      .select('movie_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return;
        const s = new Set<number>(data.map(r => r.movie_id));
        setWatchlist(s);
        saveLocal(s);
      });
  }, [user?.id]);

  const addToWatchlist = useCallback(async (id: number, title: string) => {
    setWatchlist(prev => { const n = new Set(prev).add(id); saveLocal(n); return n; });
    if (!user) return;
    await supabase.from('watchlist').upsert({ user_id: user.id, movie_id: id, title, added_at: new Date().toISOString() });
  }, [user]);

  const removeFromWatchlist = useCallback(async (id: number) => {
    setWatchlist(prev => { const n = new Set(prev); n.delete(id); saveLocal(n); return n; });
    if (!user) return;
    await supabase.from('watchlist').delete().eq('user_id', user.id).eq('movie_id', id);
  }, [user]);

  const isInWatchlist = useCallback((id: number) => watchlist.has(id), [watchlist]);

  return { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist };
}
