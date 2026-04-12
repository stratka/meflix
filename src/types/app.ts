export interface StreamingService {
  id: string;
  name: string;
  tmdbId: number;
  tmdbIds?: number[]; // alternativní TMDB ID (liší se podle regionu)
  color: string;
  textColor: string;
}

export interface AppSettings {
  region: string;
  selectedServices: string[];
}

export interface FilterState {
  genres: number[];
  minRating: number;
  yearFrom: number;
  yearTo: number;
  services: string[];
  personId: number | null;
  personName: string;
  personRole: 'cast' | 'crew';
  sortBy: SortOption;
  watchedFilter: 'all' | 'hide' | 'only';
  watchlistFilter: 'all' | 'hide' | 'only';
  originCountry: string;
  mediaType: 'movie' | 'tv';
  certification: '' | 'G' | 'PG' | 'PG-13';
  signLanguage: boolean;
}

export interface WatchedEntry {
  date: string; // ISO datum
  title: string;
}

export type WatchedMovies = Record<number, WatchedEntry>;

export type SortOption =
  | 'vote_average.desc'
  | 'release_date.desc'
  | 'popularity.desc'
  | 'title.asc';
