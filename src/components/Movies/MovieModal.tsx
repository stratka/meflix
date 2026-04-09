import { useEffect, useState, useCallback, useRef } from 'react';
import { Star, Clock, ExternalLink, Play, Youtube, Eye, ArrowLeft, Bookmark, BookmarkCheck, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TMDBMovie, TMDBMovieDetail, Provider } from '../../types/tmdb';
import type { AppSettings, StreamingService, WatchedEntry } from '../../types/app';
import { fetchMovieDetail, fetchSimilarMovies } from '../../utils/tmdb';
import type { TMDBDiscoverResponse } from '../../types/tmdb';
import { TMDB_IMAGE_BASE, getServiceByTmdbId, getWatchUrl, createDynamicService } from '../../utils/constants';
import { fetchJustWatchLinks } from '../../utils/justwatch';
import type { DirectStreamingLinks } from '../../utils/streamingAvailability';
import { ServiceBadge } from '../common/ServiceBadge';

interface Props {
  movie: TMDBMovie;
  settings: AppSettings;
  onClose: () => void;
  onNotAvailable?: (movieId: number) => void;
  watchedEntry?: WatchedEntry;
  onMarkWatched: (id: number, title: string) => void;
  onUnmarkWatched: (id: number) => void;
  onPersonClick?: (personId: number, personName: string, role: 'cast' | 'crew') => void;
  isInWatchlist?: boolean;
  onToggleWatchlist?: (id: number, title: string) => void;
  onMovieClick?: (movie: TMDBMovie) => void;
}

export function MovieModal({ movie, settings, onClose, watchedEntry, onMarkWatched, onUnmarkWatched, onPersonClick, isInWatchlist, onToggleWatchlist, onMovieClick }: Props) {
  const { t, i18n } = useTranslation();
  const [detail, setDetail] = useState<TMDBMovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [directLinks, setDirectLinks] = useState<DirectStreamingLinks>({});
  const [similar, setSimilar] = useState<TMDBDiscoverResponse['results']>([]);

  const dragY = useRef(0);
  const scrollY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const DISMISS_THRESHOLD = 150;
  const DISMISS_VELOCITY = 0.5;

  const applyDrag = (dy: number) => {
    if (!sheetRef.current || !overlayRef.current) return;
    const clamped = Math.max(0, dy);
    sheetRef.current.style.transform = `translateY(${clamped}px) scale(${1 - clamped * 0.00004})`;
    overlayRef.current.style.opacity = String(Math.max(0, 0.8 - (clamped / DISMISS_THRESHOLD) * 0.8));
  };

  const resetDrag = () => {
    if (!sheetRef.current || !overlayRef.current) return;
    sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
    sheetRef.current.style.transform = '';
    overlayRef.current.style.transition = 'opacity 0.3s ease';
    overlayRef.current.style.opacity = '';
    setTimeout(() => {
      if (sheetRef.current) sheetRef.current.style.transition = '';
      if (overlayRef.current) overlayRef.current.style.transition = '';
    }, 300);
  };

  const dismissSheet = () => {
    if (!sheetRef.current || !overlayRef.current) return;
    sheetRef.current.style.transition = 'transform 0.26s ease-in';
    sheetRef.current.style.transform = `translateY(100%)`;
    overlayRef.current.style.transition = 'opacity 0.26s ease-in';
    overlayRef.current.style.opacity = '0';
    setTimeout(onClose, 260);
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    dragY.current = 0;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (scrollY.current <= 0 && dy > 0) {
      dragY.current = dy;
      applyDrag(dy);
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = dragY.current;
    const dt = e.timeStamp;
    const velocity = dt > 0 ? dy / dt : 0;
    startY.current = null;
    if (dy > DISMISS_THRESHOLD || velocity > DISMISS_VELOCITY) {
      dismissSheet();
    } else {
      resetDrag();
    }
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      try { screen.orientation.lock('portrait'); } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    fetchMovieDetail(movie.id, settings.region, movie.media_type ?? 'movie')
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [movie.id, settings.region]);

  useEffect(() => {
    fetchJustWatchLinks(movie.id, settings.region, movie.title, movie.media_type ?? 'movie')
      .then(links => setDirectLinks(links))
      .catch(() => { /* silently ignore errors */ });
  }, [movie.id, settings.region, movie.title]);

  useEffect(() => {
    setSimilar([]);
    fetchSimilarMovies(movie.id, movie.media_type ?? 'movie')
      .then(r => setSimilar(r.results.slice(0, 12)))
      .catch(() => {});
  }, [movie.id, movie.media_type]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Android back button: push a history entry so back closes the modal instead of leaving the app
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    history.pushState({ modal: true }, '');
    const handlePopState = () => onCloseRef.current();
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (history.state?.modal) history.back();
    };
  }, []); // prázdné deps — efekt běží jen při mount/unmount, ne při každém re-renderu

  const backdropUrl = movie.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}`
    : null;

  const posterUrl = movie.poster_path
    ? `${TMDB_IMAGE_BASE}/w342${movie.poster_path}`
    : null;

  const year = movie.release_date?.slice(0, 4);

  const regionProviders = detail?.watch_providers?.results?.[settings.region];
  const flatrate: Provider[] = regionProviders?.flatrate || [];

  const userServices: { service: StreamingService; provider: Provider; watchLink: string }[] = [];
  for (const provider of flatrate) {
    const service = getServiceByTmdbId(provider.provider_id)
      ?? createDynamicService(provider.provider_id, provider.provider_name);
    if (settings.selectedServices.includes(service.id)) {
      const watchLink = directLinks[service.id] || getWatchUrl(service.id, movie.title);
      userServices.push({ service, provider, watchLink });
    }
  }

  const otherServices: { service: StreamingService; provider: Provider }[] = [];
  for (const provider of flatrate) {
    const service = getServiceByTmdbId(provider.provider_id)
      ?? createDynamicService(provider.provider_id, provider.provider_name);
    if (!settings.selectedServices.includes(service.id)) {
      otherServices.push({ service, provider });
    }
  }

  const director = detail?.credits?.crew?.find(c => c.job === 'Director');
  const createdBy = detail?.created_by?.[0];
  const topCast = detail?.credits?.cast?.slice(0, 8) || [];

  const trailer = detail?.videos?.results?.find(
    v => v.site === 'YouTube' && v.type === 'Trailer' && v.official
  ) ?? detail?.videos?.results?.find(
    v => v.site === 'YouTube' && v.type === 'Trailer'
  ) ?? detail?.videos?.results?.find(
    v => v.site === 'YouTube' && v.type === 'Teaser'
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className="relative w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] bg-gray-900 sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Back button */}
        <button
          onClick={onClose}
          className="fixed bottom-6 right-6 z-[60] w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
          aria-label={t('modal.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Scrollable content */}
        <div
          className="overflow-y-auto flex-1"
          onScroll={e => { scrollY.current = (e.target as HTMLElement).scrollTop; }}
        >
          {/* Backdrop */}
          <div className="relative h-48 sm:h-64 bg-gray-800">
            {backdropUrl && (
              <img src={backdropUrl} alt="" className="w-full h-full object-cover" />
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
                  {userServices.length === 0 && (
                    <div className="flex gap-1 w-full mt-1">
                      <button
                        onClick={() => watchedEntry ? onUnmarkWatched(movie.id) : onMarkWatched(movie.id, movie.title)}
                        title={watchedEntry ? t('modal.unmarkWatched') : t('modal.markWatched')}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors ${watchedEntry ? 'bg-green-600/30 text-green-400' : 'bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700'}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {onToggleWatchlist && (
                        <button
                          onClick={() => onToggleWatchlist(movie.id, movie.title)}
                          title={isInWatchlist ? t('modal.removeWatchlist') : t('modal.addWatchlist')}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors ${isInWatchlist ? 'bg-blue-600/30 text-blue-400' : 'bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700'}`}
                        >
                          {isInWatchlist ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  )}
                  {userServices.length > 0 && (
                    <div className="flex flex-col gap-1.5 w-full">
                      {userServices.map(({ service, watchLink }) => (
                        <div key={service.id} className="flex gap-1">
                          <a
                            href={watchLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg font-semibold text-xs transition-all hover:opacity-90 hover:scale-105 active:scale-95"
                            style={{ backgroundColor: service.color, color: service.textColor }}
                            onClick={() => onMarkWatched(movie.id, movie.title)}
                          >
                            <Play className="w-3 h-3 fill-current flex-shrink-0" />
                            <span className="truncate">{service.name}</span>
                          </a>
                          <button
                            onClick={() => watchedEntry ? onUnmarkWatched(movie.id) : onMarkWatched(movie.id, movie.title)}
                            title={watchedEntry ? t('modal.unmarkWatched') : t('modal.markWatched')}
                            className={`w-7 flex-shrink-0 flex items-center justify-center rounded-lg transition-colors ${watchedEntry ? 'bg-green-600/30 text-green-400' : 'bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700'}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {onToggleWatchlist && (
                            <button
                              onClick={() => onToggleWatchlist(movie.id, movie.title)}
                              title={isInWatchlist ? t('modal.removeWatchlist') : t('modal.addWatchlist')}
                              className={`w-7 flex-shrink-0 flex items-center justify-center rounded-lg transition-colors ${isInWatchlist ? 'bg-blue-600/30 text-blue-400' : 'bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700'}`}
                            >
                              {isInWatchlist ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col justify-end pb-1 min-w-0">
                <div className="flex items-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight flex-1">
                    {movie.title}
                  </h2>
                  <button
                    onClick={() => {
                      const url = `https://www.mimoovie.com`;
                      const data = { title: movie.title, text: movie.overview || movie.title, url };
                      if (navigator.share) navigator.share(data);
                      else navigator.clipboard?.writeText(url);
                    }}
                    className="flex-shrink-0 mt-1 text-gray-500 hover:text-white transition-colors"
                    title={t('share.movie')}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
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
                  {!detail?.runtime && detail?.episode_run_time && detail.episode_run_time.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {detail.episode_run_time[0]} {t('modal.minPerEpisode')}
                      </span>
                    </>
                  )}
                  {detail?.number_of_seasons && (
                    <>
                      <span>·</span>
                      <span>{t('modal.seasons', { count: detail.number_of_seasons })}</span>
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
                  onClick={() => {
                    setShowTrailer(true);
                    try { screen.orientation.unlock(); } catch { /* ignore */ }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                  {t('modal.playTrailer')}
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
                  {t('modal.noTrailer')}
                </div>
              )}
            </div>

            {/* Director / Creator */}
            {(director || createdBy) && (
              <p className="mt-3 text-sm text-gray-400">
                <span className="text-gray-500">{createdBy && !director ? t('modal.creator') : t('modal.director')} </span>
                <button
                  onClick={() => {
                    const p = director ?? createdBy!;
                    onPersonClick?.(p.id, p.name, 'crew');
                    onClose();
                  }}
                  className="text-white hover:text-red-400 transition-colors underline-offset-2 hover:underline"
                >
                  {director?.name ?? createdBy?.name}
                </button>
              </p>
            )}

            {/* Cast */}
            {topCast.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">{t('modal.cast')}</p>
                <div className="flex flex-wrap gap-2">
                  {topCast.map(actor => (
                    <button
                      key={actor.id}
                      onClick={() => { onPersonClick?.(actor.id, actor.name, 'cast'); onClose(); }}
                      className="text-sm text-gray-300 bg-gray-800 hover:bg-red-600/30 hover:text-white px-2.5 py-1 rounded-full transition-colors"
                    >
                      {actor.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Watched date */}
            {watchedEntry && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-green-400">
                <Eye className="w-3.5 h-3.5" />
                <span>
                  {t('modal.watchedOn', {
                    date: new Date(watchedEntry.date).toLocaleDateString(i18n.language, {
                      day: 'numeric', month: 'long', year: 'numeric',
                    }),
                  })}
                </span>
              </div>
            )}

            {/* Also available on (other services only) */}
            {!loading && otherServices.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">{t('modal.alsoOn')}</p>
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
                {t('modal.notAvailable')}
              </div>
            )}

            {/* Similar movies */}
            {similar.length > 0 && onMovieClick && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-3">{t('modal.similar')}</p>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
                  {similar.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { onMovieClick(s); onClose(); }}
                      className="flex-shrink-0 w-24 group"
                    >
                      <div className="w-24 h-36 rounded-lg overflow-hidden bg-gray-800 mb-1 relative">
                        {s.poster_path ? (
                          <img
                            src={`${TMDB_IMAGE_BASE}/w185${s.poster_path}`}
                            alt={s.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs text-center p-1">
                            {s.title}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                      </div>
                      <p className="text-xs text-gray-400 group-hover:text-white transition-colors line-clamp-2 text-left leading-tight">
                        {s.title}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TMDB link */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <a
                href={`https://www.themoviedb.org/${movie.media_type === 'tv' ? 'tv' : 'movie'}/${movie.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1"
              >
                {t('modal.viewOnTMDB')} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
