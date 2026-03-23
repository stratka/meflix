import { Star } from 'lucide-react';
import type { TMDBMovie } from '../../types/tmdb';
import { TMDB_IMAGE_BASE } from '../../utils/constants';

interface Props {
  movie: TMDBMovie;
  onClick: (movie: TMDBMovie) => void;
}

export function MovieCard({ movie, onClick }: Props) {
  const posterUrl = movie.poster_path
    ? `${TMDB_IMAGE_BASE}/w342${movie.poster_path}`
    : null;

  const year = movie.release_date ? movie.release_date.slice(0, 4) : '—';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';

  return (
    <button
      onClick={() => onClick(movie)}
      className="group bg-gray-900 rounded-xl overflow-hidden text-left transition-all duration-200 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/50 focus:outline-none focus:ring-2 focus:ring-red-500"
    >
      <div className="relative aspect-[2/3] bg-gray-800 overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm px-4 text-center">
            {movie.title}
          </div>
        )}
        {/* Rating badge */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold text-white">{rating}</span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 group-hover:text-red-400 transition-colors">
          {movie.title}
        </h3>
        <p className="text-xs text-gray-500 mt-1">{year}</p>
      </div>
    </button>
  );
}
