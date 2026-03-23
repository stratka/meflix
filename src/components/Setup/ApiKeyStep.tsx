import { useState } from 'react';
import { Key, ExternalLink, Eye, EyeOff, Loader2 } from 'lucide-react';
import { validateApiKey } from '../../utils/tmdb';

interface Props {
  onNext: (apiKey: string) => void;
  initial?: string;
}

export function ApiKeyStep({ onNext, initial = '' }: Props) {
  const [key, setKey] = useState(initial);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    const valid = await validateApiKey(key.trim());
    setLoading(false);
    if (valid) {
      onNext(key.trim());
    } else {
      setError('Neplatný API klíč. Zkontroluj ho a zkus znovu.');
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
          <Key className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">TMDB API klíč</h2>
          <p className="text-sm text-gray-400">Potřebujeme přístup k databázi filmů</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-950/50 border border-blue-800/50 rounded-lg text-sm text-blue-300">
        Získej bezplatný API klíč (Read Access Token) na{' '}
        <a
          href="https://www.themoviedb.org/settings/api"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline hover:text-blue-200"
        >
          themoviedb.org <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiJ9..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!key.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Ověřuji...' : 'Pokračovat'}
        </button>
      </form>
    </div>
  );
}
