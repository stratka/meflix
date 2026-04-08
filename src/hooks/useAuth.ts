import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, supabaseEnabled } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabaseEnabled) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }

  async function signUpWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return error;
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return error;
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setIsPasswordRecovery(false);
    return error;
  }

  return { user, session, loading, isPasswordRecovery, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, resetPassword, updatePassword };
}
