import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type AppUser = {
  id: string;
  username: string;
  email?: string | null;
  full_name: string;
  grade: string;
  is_admin: boolean;
  is_active?: boolean;
};

type AuthCtx = {
  user: AppUser | null;
  sessionLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  sessionLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(Ctx);

async function fetchAppUserByAuthId(authId: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, full_name, grade, is_admin, is_active')
    .eq('id', authId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as AppUser | null;
}

async function fetchAppUserByUsername(username: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, full_name, grade, is_admin, is_active')
    .eq('username', username)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as AppUser | null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // initial load + subscribe to auth state
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          // Prefer row by auth id
          const row = await fetchAppUserByAuthId(session.user.id);
          if (row) setUser(row);
          else {
            // Fallback: try username part of email (demo style)
            const uname = session.user.email?.split('@')[0] ?? '';
            if (uname) {
              const row2 = await fetchAppUserByUsername(uname);
              if (row2) setUser(row2);
            }
          }
        }
      } finally {
        if (mounted) setSessionLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (evt, sess) => {
      if (evt === 'SIGNED_OUT') {
        setUser(null);
        return;
      }
      if (sess?.user?.id) {
        try {
          const row = await fetchAppUserByAuthId(sess.user.id);
          if (row) setUser(row);
          else {
            const uname = sess.user.email?.split('@')[0] ?? '';
            const row2 = uname ? await fetchAppUserByUsername(uname) : null;
            if (row2) setUser(row2);
          }
        } catch {
          // swallow
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string) => {
    const email = username.includes('@') ? username : `${username}@example.com`;
    // Sign in
    const { error: signInErr, data: signInData } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      // Optional fallback: auto sign-up if not exists and email confirmation is OFF
      const { error: signUpErr } = await supabase.auth.signUp({ email, password });
      if (signUpErr) throw signInErr;
      // After sign-up, try sign-in again
      const retry = await supabase.auth.signInWithPassword({ email, password });
      if (retry.error) throw retry.error;
    }

    // Load app user profile
    const { data: me } = await supabase.auth.getUser();
    if (me.user?.id) {
      const row = await fetchAppUserByAuthId(me.user.id);
      if (row) {
        setUser(row);
        return;
      }
      const uname = email.split('@')[0];
      const row2 = await fetchAppUserByUsername(uname);
      if (row2) setUser(row2);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = useMemo(() => ({ user, sessionLoading, login, logout }), [user, sessionLoading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
