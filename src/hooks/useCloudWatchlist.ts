import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseEnabled } from '../lib/supabase';

const LOCAL_KEY = 'meflix_watchlist';

// Watchlist lokálně ukládá jen ID, ale pro merge potřebujeme i title
// Ukládáme jako Record<id, title>
const LOCAL_TITLES_KEY = 'meflix_watchlist_titles';

function loadLocal(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')); }
  catch { return new Set(); }
}

function loadLocalTitles(): Record<number, string> {
  try { return JSON.parse(localStorage.getItem(LOCAL_TITLES_KEY) || '{}'); }
  catch { return {}; }
}

function saveLocal(data: Set<number>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify([...data]));
}

function saveLocalTitle(id: number, title: string) {
  const titles = loadLocalTitles();
  titles[id] = title;
  localStorage.setItem(LOCAL_TITLES_KEY, JSON.stringify(titles));
}

export function useCloudWatchlist(user: User | null) {
  const [watchlist, setWatchlist] = useState<Set<number>>(loadLocal);

  // Při přihlášení: slouč lokální data s cloudovými
  useEffect(() => {
    if (!user || !supabaseEnabled) return;
    supabase
      .from('watchlist')
      .select('movie_id, title')
      .eq('user_id', user.id)
      .then(async ({ data }) => {
        const local = loadLocal();
        const localTitles = loadLocalTitles();
        const cloudIds = new Set<number>((data || []).map(r => r.movie_id));

        // Nahraj lokální záznamy které nejsou v cloudu
        const onlyLocal = [...local].filter(id => !cloudIds.has(id));
        if (onlyLocal.length > 0) {
          await supabase.from('watchlist').upsert(
            onlyLocal.map(id => ({
              user_id: user.id,
              movie_id: id,
              title: localTitles[id] || '',
              added_at: new Date().toISOString(),
            }))
          );
        }

        // Merge
        const merged = new Set<number>([...cloudIds, ...local]);
        setWatchlist(merged);
        saveLocal(merged);
      });
  }, [user?.id]);

  const addToWatchlist = useCallback(async (id: number, title: string) => {
    setWatchlist(prev => { const n = new Set(prev).add(id); saveLocal(n); return n; });
    saveLocalTitle(id, title);
    if (!user || !supabaseEnabled) return;
    await supabase.from('watchlist').upsert({ user_id: user.id, movie_id: id, title, added_at: new Date().toISOString() });
  }, [user]);

  const removeFromWatchlist = useCallback(async (id: number) => {
    setWatchlist(prev => { const n = new Set(prev); n.delete(id); saveLocal(n); return n; });
    if (!user || !supabaseEnabled) return;
    await supabase.from('watchlist').delete().eq('user_id', user.id).eq('movie_id', id);
  }, [user]);

  const isInWatchlist = useCallback((id: number) => watchlist.has(id), [watchlist]);

  return { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist };
}
