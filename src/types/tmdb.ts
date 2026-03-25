export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  genres?: Genre[];
  popularity: number;
  original_language: string;
  media_type?: 'movie' | 'tv';
}

export interface TMDBVideo {
  id: string;
  key: string;       // YouTube video ID
  name: string;
  site: string;      // 'YouTube', 'Vimeo', ...
  type: string;      // 'Trailer', 'Teaser', 'Clip', ...
  official: boolean;
  published_at: string;
}

export interface TMDBMovieDetail extends TMDBMovie {
  genres: Genre[];
  runtime: number | null;
  tagline: string;
  credits?: Credits;
  watch_providers?: WatchProviderResponse;
  videos?: { results: TMDBVideo[] };
  number_of_seasons?: number;
  episode_run_time?: number[];
  created_by?: { id: number; name: string }[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface WatchProviderResponse {
  results: Record<string, RegionProviders>;
}

export interface RegionProviders {
  link?: string;
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
}

export interface Provider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface TMDBDiscoverResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
}

export interface TMDBSearchPersonResponse {
  results: TMDBPerson[];
}

export interface TMDBGenresResponse {
  genres: Genre[];
}
