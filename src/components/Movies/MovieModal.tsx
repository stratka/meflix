import { useEffect, useState, useCallback } from 'react';
import { X, Star, Clock, ExternalLink, Play, Youtube } from 'lucide-react';
import type { TMDBMovie, TMDBMovieDetail, Provider } from '../../types/tmdb';
import type { AppSettings, StreamingService } from '../../types/app';
import { fetchMovieDetail } from '../../utils/tmdb';
import { TMDB_IMAGE_BASE, getServiceByTmdbId, getWatchUrl } from '../../utils/constants';
import { fetchDirectStreamingLinks, RateLimitError, NotSubscribedError, type DirectStreamingLinks } from '../../utils/streamingAvailability';
import { ServiceBadge } from '../common/ServiceBadge';

interface Props {
  movie: TMDBMovie;
  settings: AppSettings;
  onClose: () => void;
  onNotAvailable?: (movieId: number) => void;
}

export function MovieModal({ movie, settings, onClose, onNotAvailable }: Props) {
  const [detail, setDetail] = useState<TMDBMovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [directLinks, setDirectLinks] = useState<DirectStreamingLinks>({});
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [notSubscribed, setNotSubscribed] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    fetchMovieDetail(movie.id, settings.region)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [movie.id, settings.region]);

  // Fetch direct streaming links via server proxy
  useEffect(() => {
    setLinksLoading(true);
    setLinksError(null);
    setRateLimited(false);
    setNotSubscribed(false);
    fetchDirectStreamingLinks(movie.id, settings.region)
      .then(links => setDirectLinks(links))
      .catch(err => {
        if (err instanceof RateLimitError) setRateLimited(true);
        else if (err instanceof NotSubscribedError) setNotSubscribed(true);
        else setLinksError(String(err?.message || err));
      })
      .finally(() => setLinksLoading(false));
  }, [movie.id, settings.region]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const backdropUrl = movie.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}`
    : null;

  const posterUrl = movie.poster_path
    ? `${TMDB_IMAGE_BASE}/w342${movie.poster_path}`
    : null;

  const year = movie.release_date?.slice(0, 4);

  // Get available providers for user's region
  const regionProviders = detail?.watch_providers?.results?.[settings.region];
  const flatrate: Provider[] = regionProviders?.flatrate || [];

  // Match providers with user's selected streaming services
  const userServices: { service: StreamingService; provider: Provider; watchLink: string }[] = [];
  for (const provider of flatrate) {
    const service = getServiceByTmdbId(provider.provider_id);
    if (service && settings.selectedServices.includes(service.id)) {
      const watchLink = directLinks[service.id] || getWatchUrl(service.id, movie.title);
      userServices.push({ service, provider, watchLink });
    }
  }

  // Pokud film není dostupný na žádné uživatelově službě, odstraň ho z gridu a zavři modal
  useEffect(() => {
    if (!loading && detail && userServices.length === 0) {
      onNotAvailable?.(movie.id);
      onClose();
    }
  }, [loading, detail, userServices.length, movie.id, onNotAvailable, onClose]);

  // Other available services not in user's list
  const otherServices: { service: StreamingService; provider: Provider }[] = [];
  for (const provider of flatrate) {
    const service = getServiceByTmdbId(provider.provider_id);
    if (service && !settings.selectedServices.includes(service.id)) {
      otherServices.push({ service, provider });
    }
  }

  const director = detail?.credits?.crew?.find(c => c.job === 'Director');
  const topCast = detail?.credits?.cast?.slice(0, 8) || [];

  // Najdi nejlepší trailer — preferuj oficiální YouTube trailer
  const trailer = detail?.videos?.results?.find(
    v => v.site === 'YouTube' && v.type === 'Trailer' && v.official
  ) ?? detail?.videos?.results?.find(
    v => v.site === 'YouTube' && v.type === 'Trailer'
  ) ?? detail?.videos?.results?.find(
    v => v.site === 'YouTube' && v.type === 'Teaser'
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] bg-gray-900 sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {/* Backdrop */}
          <div className="relative h-48 sm:h-64 bg-gray-800">
            {backdropUrl && (
              <img
                src={backdropUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 pb-6">
            {/* Title row */}
            <div className="flex gap-4 -mt-16 relative">
              {posterUrl && (
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <img
                    src={posterUrl}
                    alt={movie.title}
                    className="w-24 sm:w-32 rounded-xl shadow-2xl border-2 border-gray-700"
                  />
                  {userServices.length > 0 && (
                    <div className="flex flex-col gap-1.5 w-full">
                      {userServices.map(({ service, watchLink }) => (
                        <a
                          key={service.id}
                          href={watchLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded-lg font-semibold text-xs transition-all hover:opacity-90 hover:scale-105 active:scale-95"
                          style={{ backgroundColor: service.color, color: service.textColor }}
                        >
                          <Play className="w-3 h-3 fill-current flex-shrink-0" />
                          <span className="truncate">{service.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col justify-end pb-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  {movie.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-400">
                  {year && <span>{year}</span>}
                  {detail?.runtime && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(detail.runtime / 60)}h {detail.runtime % 60}min
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-3 h-3 fill-yellow-400" />
                    <span className="font-bold">{movie.vote_average.toFixed(1)}</span>
                    <span className="text-gray-500 text-xs">({movie.vote_count.toLocaleString()})</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="mt-4 space-y-2 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-full" />
                <div className="h-4 bg-gray-800 rounded w-4/5" />
                <div className="h-4 bg-gray-800 rounded w-3/5" />
              </div>
            )}

            {/* Genres */}
            {detail?.genres && detail.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {detail.genres.map(g => (
                  <span key={g.id} className="px-2.5 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <p className="mt-4 text-gray-300 text-sm leading-relaxed">{movie.overview}</p>
            )}

            {/* Trailer */}
            <div className="mt-4">
              {loading && (
                <div className="h-9 w-36 bg-gray-800 rounded-lg animate-pulse" />
              )}
              {!loading && trailer && !showTrailer && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                  Přehrát trailer
                </button>
              )}
              {!loading && trailer && showTrailer && (
                <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                    title={trailer.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              {!loading && !trailer && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-500 text-sm font-semibold rounded-lg cursor-not-allowed w-fit">
                  <Youtube className="w-4 h-4" />
                  Trailer není k dispozici
                </div>
              )}
            </div>

            {/* Director */}
            {director && (
              <p className="mt-3 text-sm text-gray-400">
                <span className="text-gray-500">Režie: </span>
                <span className="text-white">{director.name}</span>
              </p>
            )}

            {/* Cast */}
            {topCast.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Obsazení</p>
                <div className="flex flex-wrap gap-2">
                  {topCast.map(actor => (
                    <span key={actor.id} className="text-sm text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full">
                      {actor.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Watch on your services */}
            {userServices.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm text-gray-500">Dostupné na tvých službách</p>
                  {linksLoading && (
                    <span className="text-xs text-gray-500 animate-pulse">· načítám přímé odkazy…</span>
                  )}
                  {!linksLoading && settings.rapidApiKey && Object.keys(directLinks).length > 0 && (
                    <span className="text-xs text-green-500">· přímé odkazy ✓</span>
                  )}
                  {!linksLoading && rateLimited && (
                    <span className="text-xs text-yellow-500" title="Překročen limit API (429) — zobrazuji vyhledávací odkaz">· limit API</span>
                  )}
                  {!linksLoading && notSubscribed && (
                    <a
                      href="https://rapidapi.com/movie-of-the-night-movie-of-the-night-default/api/streaming-availability"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-400 hover:text-orange-300 underline"
                    >
                      · přihlásit se k API →
                    </a>
                  )}
                  {!linksLoading && linksError && (
                    <span className="text-xs text-red-400">· chyba API: {linksError}</span>
                  )}
                  {!linksLoading && settings.rapidApiKey && !linksError && !rateLimited && Object.keys(directLinks).length === 0 && (
                    <span className="text-xs text-yellow-500">· API: žádné přímé links</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {userServices.map(({ service, watchLink }) => (
                    <a
                      key={service.id}
                      href={watchLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-105 active:scale-95"
                      style={{ backgroundColor: service.color, color: service.textColor }}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      {service.name}
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Also on (other services) */}
            {otherServices.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Také dostupné na</p>
                <div className="flex flex-wrap gap-2">
                  {otherServices.map(({ service }) => (
                    <ServiceBadge key={service.id} service={service} size="sm" />
                  ))}
                </div>
              </div>
            )}

            {/* Not available */}
            {!loading && flatrate.length === 0 && (
              <div className="mt-6 p-3 bg-gray-800 rounded-lg text-sm text-gray-400 text-center">
                Tento film není momentálně dostupný na žádné streamovací službě ve tvém regionu.
              </div>
            )}

            {/* TMDB link */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <a
                href={`https://www.themoviedb.org/movie/${movie.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1"
              >
                Zobrazit na TMDB <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
