import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseEnabled = !!(url && key);

// IndexedDB storage adapter — perzistentnější než localStorage na iOS PWA
const IDB_NAME = 'mimoovie-auth-db';
const IDB_STORE = 'auth';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const idbStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const db = await openIDB();
      return new Promise((resolve, reject) => {
        const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
        req.onsuccess = () => resolve(req.result ?? localStorage.getItem(key));
        req.onerror = () => { resolve(localStorage.getItem(key)); reject; };
      });
    } catch { return localStorage.getItem(key); }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    localStorage.setItem(key, value);
    try {
      const db = await openIDB();
      return new Promise((resolve, reject) => {
        const req = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch { /* localStorage already saved */ }
  },
  removeItem: async (key: string): Promise<void> => {
    localStorage.removeItem(key);
    try {
      const db = await openIDB();
      return new Promise((resolve, reject) => {
        const req = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch { /* localStorage already removed */ }
  },
};

const clientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: idbStorage,
  },
};

export const supabase = supabaseEnabled
  ? createClient(url!, key!, clientOptions)
  : createClient('https://placeholder.supabase.co', 'placeholder', clientOptions);

export type DbUserSettings = {
  user_id: string;
  region: string;
  selected_services: string[];
  updated_at: string;
};

export type DbWatchedMovie = {
  user_id: string;
  movie_id: number;
  title: string;
  watched_at: string;
};

export type DbWatchlistItem = {
  user_id: string;
  movie_id: number;
  title: string;
  added_at: string;
};
