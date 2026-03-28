import { ArrowLeft, Eye, Trash2, Film } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { WatchedMovies } from '../../types/app';

interface Props {
  watched: WatchedMovies;
  onUnmark: (id: number) => void;
  onClose: () => void;
}

export function WatchedScreen({ watched, onUnmark, onClose }: Props) {
  const { t, i18n } = useTranslation();

  const entries = Object.entries(watched)
    .map(([id, entry]) => ({ id: Number(id), ...entry }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(i18n.language, {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center gap-3">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-red-500" />
          <h1 className="text-lg font-bold text-white">{t('watched.title')}</h1>
        </div>
        <span className="ml-auto text-sm text-gray-500">{t('browser.movies', { count: entries.length })}</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
            <Film className="w-16 h-16 opacity-30" />
            <p className="text-lg">{t('watched.empty')}</p>
            <p className="text-sm text-gray-600">{t('watched.emptyHint')}</p>
          </div>
        ) : (
          <ul className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-2">
            {entries.map(({ id, title, date }) => (
              <li
                key={id}
                className="flex items-center justify-between gap-3 bg-gray-900 rounded-xl px-4 py-3 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{t('watched.watchedOn', { date: formatDate(date) })}</p>
                </div>
                <button
                  onClick={() => onUnmark(id)}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                  title={t('watched.remove')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
