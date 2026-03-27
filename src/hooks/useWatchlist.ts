import { useState, useCallback } from 'react';

const KEY = 'meflix_watchlist';

function load(): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function save(data: Set<number>) {
  localStorage.setItem(KEY, JSON.stringify([...data]));
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Set<number>>(load);

  const addToWatchlist = useCallback((id: number) => {
    setWatchlist(prev => {
      const next = new Set(prev).add(id);
      save(next);
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback((id: number) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      next.delete(id);
      save(next);
      return next;
    });
  }, []);

  const isInWatchlist = useCallback((id: number) => watchlist.has(id), [watchlist]);

  return { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist };
}
