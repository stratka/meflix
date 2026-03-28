import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import type { AppSettings } from '../types/app';
import { supabase, supabaseEnabled } from '../lib/supabase';

const LOCAL_KEY = 'streampicker-settings';

const DEFAULT: AppSettings = { region: 'CZ', selectedServices: [] };

function loadLocal(): AppSettings {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null') ?? DEFAULT; }
  catch { return DEFAULT; }
}

export function useCloudSettings(user: User | null) {
  const [settings, setSettingsState] = useState<AppSettings>(loadLocal);
  const [synced, setSynced] = useState(false);

  // Load from Supabase on login
  useEffect(() => {
    if (!user) { setSynced(false); return; }
    if (!supabaseEnabled) { setSynced(true); return; }
    supabase
      .from('user_settings')
      .select('region, selected_services')
      .eq('user_id', user.id)
      .single()
      .then(async ({ data }) => {
        if (data) {
          // Cloud má data → použij cloud
          const s: AppSettings = { region: data.region, selectedServices: data.selected_services };
          setSettingsState(s);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(s));
        } else {
          // Cloud nemá data → nahraj lokální nastavení do cloudu
          const local = loadLocal();
          if (local.region) {
            await supabase.from('user_settings').upsert({
              user_id: user.id,
              region: local.region,
              selected_services: local.selectedServices,
              updated_at: new Date().toISOString(),
            });
          }
        }
        setSynced(true);
      });
  }, [user?.id]);

  const setSettings = useCallback(async (next: AppSettings) => {
    setSettingsState(next);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    if (!user || !supabaseEnabled) return;
    await supabase.from('user_settings').upsert({
      user_id: user.id,
      region: next.region,
      selected_services: next.selectedServices,
      updated_at: new Date().toISOString(),
    });
  }, [user]);

  return { settings, setSettings, synced };
}
