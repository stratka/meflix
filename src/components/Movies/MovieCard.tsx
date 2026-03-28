import { Star, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TMDBMovie } from '../../types/tmdb';
import type { StreamingService } from '../../types/app';
import { TMDB_IMAGE_BASE } from '../../utils/constants';

interface Props {
  movie: TMDBMovie;
  onClick: (movie: TMDBMovie) => void;
  isWatched?: boolean;
  watchedDate?: string;
  dimmed?: boolean;
  availableOn?: StreamingService[];
}

export function MovieCard({ movie, onClick, isWatched, watchedDate, dimmed, availableOn }: Props) {
  const { t, i18n } = useTranslation();

  const posterUrl = movie.poster_path
    ? `${TMDB_IMAGE_BASE}/w342${movie.poster_path}`
    : null;

  const year = movie.release_date ? movie.release_date.slice(0, 4) : '—';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';

  return (
    <button
      onClick={() => onClick(movie)}
      className={`group bg-gray-900 rounded-xl overflow-hidden text-left transition-all duration-200 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/50 focus:outline-none focus:ring-2 focus:ring-red-500 ${dimmed ? 'opacity-50 hover:opacity-100' : ''}`}
    >
      <div className="relative aspect-[2/3] bg-gray-800 overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${dimmed ? 'grayscale group-hover:grayscale-0' : ''} ${isWatched ? 'opacity-50' : ''}`}
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
        {/* Provider badges for unavailable movies */}
        {dimmed && availableOn && availableOn.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {availableOn.slice(0, 3).map(s => (
              <span
                key={s.id}
                className="text-xs font-bold px-1.5 py-0.5 rounded leading-tight"
                style={{ backgroundColor: s.color, color: s.textColor }}
              >
                {s.name}
              </span>
            ))}
          </div>
        )}
        {/* Watched badge */}
        {isWatched && (
          <div className="absolute bottom-2 left-2 bg-green-600/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
            <Eye className="w-3 h-3 text-white" />
            <span className="text-xs font-bold text-white">
              {watchedDate
                ? new Date(watchedDate).toLocaleDateString(i18n.language, { day: 'numeric', month: 'numeric', year: '2-digit' })
                : t('watched.badge')}
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">
          {movie.title}
        </h3>
        <p className="text-xs text-gray-500 mt-1">{year}</p>
      </div>
    </button>
  );
}
