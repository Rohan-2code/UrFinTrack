import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localAuth } from '@/lib/localStorage';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isLocalMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const local = localAuth.getCurrentUser();
      if (local) setUser({ id: local.id, email: local.email });
      setIsLocalMode(true);
      setLoading(false);
      return;
    }

    // Check existing session
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      if (s?.user) {
        setUser({ id: s.user.id, email: s.user.email });
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email });
        } else {
          setUser(null);
        }
      })();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const u = localAuth.signIn(email);
      setUser({ id: u.id, email: u.email });
      setIsLocalMode(true);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const u = localAuth.signUp(email);
      setUser({ id: u.id, email: u.email });
      setIsLocalMode(true);
      return { error: null };
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // If email confirmation is off, the session is created immediately.
    if (data.user && !data.session) {
      return { error: 'Check your email to confirm your account before signing in.' };
    }
    if (data.session?.user) {
      setUser({ id: data.session.user.id, email: data.session.user.email });
    }
    return { error: null };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured || isLocalMode) {
      localAuth.signOut();
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isLocalMode, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
