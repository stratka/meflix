import { useState, useCallback } from 'react';
import type { WatchedMovies } from '../types/app';

const KEY = 'meflix_watched';

function load(): WatchedMovies {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function save(data: WatchedMovies) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function useWatched() {
  const [watched, setWatched] = useState<WatchedMovies>(load);

  const markWatched = useCallback((id: number, title: string) => {
    setWatched(prev => {
      const next = { ...prev, [id]: { date: new Date().toISOString(), title } };
      save(next);
      return next;
    });
  }, []);

  const unmarkWatched = useCallback((id: number) => {
    setWatched(prev => {
      const next = { ...prev };
      delete next[id];
      save(next);
      return next;
    });
  }, []);

  const isWatched = useCallback((id: number) => !!watched[id], [watched]);

  return { watched, markWatched, unmarkWatched, isWatched };
}
