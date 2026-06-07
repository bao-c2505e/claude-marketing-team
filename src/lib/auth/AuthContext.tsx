import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import type { RoleName } from '../../types/core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: RoleName;
  avatarUrl: string | null;
}

export type AuthMode = 'supabase' | 'demo' | 'unconfigured';

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  mode: AuthMode;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Demo user (used when Supabase is not configured)
// ---------------------------------------------------------------------------

const DEMO_USER: AuthUser = {
  id: 'demo-owner-000',
  email: 'owner@thecore.agency',
  displayName: 'Demo Owner',
  role: 'owner',
  avatarUrl: null,
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function supabaseUserToAuthUser(user: User, role: RoleName = 'viewer'): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? null,
    role,
    avatarUrl: user.user_metadata?.avatar_url ?? null,
  };
}

// Fetch the user's role from DB. Falls back to 'viewer' on any error.
async function fetchUserRole(userId: string): Promise<RoleName> {
  if (!supabase) return 'viewer';
  try {
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('granted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!userRole?.role_id) return 'viewer';

    const { data: roleRow } = await supabase
      .from('roles')
      .select('name')
      .eq('id', userRole.role_id)
      .maybeSingle();

    const validRoles: RoleName[] = ['owner', 'manager', 'client', 'viewer'];
    const name = roleRow?.name as string | undefined;
    return validRoles.includes(name as RoleName) ? (name as RoleName) : 'viewer';
  } catch {
    return 'viewer';
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    mode: isSupabaseConfigured ? 'supabase' : 'unconfigured',
    error: null,
  });

  // Bootstrap: restore session on mount
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setState(prev => ({ ...prev, loading: false, mode: 'unconfigured' }));
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        setState({
          user: supabaseUserToAuthUser(session.user, role),
          session,
          loading: false,
          isAuthenticated: true,
          mode: 'supabase',
          error: null,
        });
      } else {
        setState(prev => ({ ...prev, loading: false, session: null, user: null, isAuthenticated: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        setState({
          user: supabaseUserToAuthUser(session.user, role),
          session,
          loading: false,
          isAuthenticated: true,
          mode: 'supabase',
          error: null,
        });
      } else {
        setState({
          user: null,
          session: null,
          loading: false,
          isAuthenticated: false,
          mode: 'supabase',
          error: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // signIn
  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    // Demo mode login
    if (!isSupabaseConfigured) {
      if (email === DEMO_USER.email && password === 'demo1234') {
        setState(prev => ({
          ...prev,
          user: DEMO_USER,
          session: null,
          loading: false,
          isAuthenticated: true,
          mode: 'demo',
          error: null,
        }));
        return { error: null };
      }
      return { error: 'Demo mode: use owner@thecore.agency / demo1234' };
    }

    if (!supabase) return { error: 'Supabase not initialized' };

    setState(prev => ({ ...prev, loading: true, error: null }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { error: error.message };
    }
    return { error: null };
  }, []);

  // signOut
  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setState(prev => ({
        ...prev,
        user: null,
        session: null,
        isAuthenticated: false,
        mode: 'unconfigured',
        error: null,
      }));
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
