import { useState, useEffect } from 'react';
import type { Genre } from '../types/tmdb';
import { fetchGenres } from '../utils/tmdb';

export function useGenres() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchGenres()
      .then(data => setGenres(data.genres))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { genres, loading };
}
