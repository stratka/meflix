import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Replace with actual Play Store URL once published
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.mimoovie';

const STORAGE_KEY = 'mimoovie_rating';

type RatingState = 'dismissed' | { snoozedUntil: number };

export function shouldShowRating(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return true;
  try {
    const val: RatingState = JSON.parse(raw);
    if (val === 'dismissed') return false;
    if (typeof val === 'object' && 'snoozedUntil' in val) {
      return Date.now() > val.snoozedUntil;
    }
  } catch {}
  return true;
}

interface Props {
  onClose: () => void;
}

export function RatingPrompt({ onClose }: Props) {
  const { t } = useTranslation();

  function handleRate() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('dismissed'));
    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
    onClose();
  }

  function handleLater() {
    const snoozedUntil = Date.now() + 3 * 24 * 60 * 60 * 1000; // 3 days
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ snoozedUntil }));
    onClose();
  }

  function handleNever() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('dismissed'));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-6 text-center">
        <div className="flex justify-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className="w-7 h-7 text-yellow-400 fill-yellow-400" />
          ))}
        </div>
        <h2 className="text-lg font-bold text-white mb-2">{t('rating.title')}</h2>
        <p className="text-sm text-gray-400 mb-6">{t('rating.subtitle')}</p>
        <button
          onClick={handleRate}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors mb-2"
        >
          {t('rating.rate')}
        </button>
        <button
          onClick={handleLater}
          className="w-full py-2.5 text-gray-400 hover:text-white text-sm transition-colors"
        >
          {t('rating.later')}
        </button>
        <button
          onClick={handleNever}
          className="w-full py-2 text-gray-600 hover:text-gray-400 text-xs transition-colors"
        >
          {t('rating.never')}
        </button>
      </div>
    </div>
  );
}
