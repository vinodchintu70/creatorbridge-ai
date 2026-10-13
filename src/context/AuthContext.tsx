'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authService, AuthState } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import type { UserProfile, UserRole } from '@/types/invitation';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (params: {
    email: string;
    password: string;
    role: UserRole;
    displayName: string;
    creatorId?: string;
    brandName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loginAsTestAccount: (type: 'brand' | 'creatorElena' | 'creatorKai') => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const state = await authService.getCurrentUser();
      setAuthState(state);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          let profile = await authService.getUserProfile(session.user.id);
          if (!profile && session.user.email) {
            // Check TEST_ACCOUNTS
            for (const [, acc] of Object.entries({
              brand: { email: 'brand@creatorbridge.test', role: 'brand', brandName: 'Lumina Labs', displayName: 'Lumina Brand Studio' },
              creatorElena: { email: 'elena@creatorbridge.test', role: 'creator', creatorId: 'creator-1', displayName: 'Elena Rostova' },
              creatorKai: { email: 'kai@creatorbridge.test', role: 'creator', creatorId: 'creator-2', displayName: 'Kai Takahashi' },
            })) {
              if (acc.email === session.user.email) {
                profile = {
                  id: session.user.id,
                  role: acc.role as UserRole,
                  creatorId: 'creatorId' in acc ? acc.creatorId : undefined,
                  brandName: 'brandName' in acc ? acc.brandName : undefined,
                  displayName: acc.displayName,
                  createdAt: new Date().toISOString(),
                };
                break;
              }
            }
          }
          setAuthState({
            user: { id: session.user.id, email: session.user.email },
            profile,
            isAuthenticated: true,
          });
        } else {
          setAuthState({
            user: null,
            profile: null,
            isAuthenticated: false,
          });
        }
        setIsLoading(false);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [refreshSession]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.signIn(email, password);
      if (res.success) {
        await refreshSession();
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (params: {
    email: string;
    password: string;
    role: UserRole;
    displayName: string;
    creatorId?: string;
    brandName?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await authService.signUp(params);
      if (res.success) {
        await refreshSession();
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setAuthState({ user: null, profile: null, isAuthenticated: false });
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsTestAccount = async (type: 'brand' | 'creatorElena' | 'creatorKai') => {
    setIsLoading(true);
    try {
      const res = await authService.loginAsTestAccount(type);
      if (res.success && res.profile) {
        setAuthState({
          user: { id: res.profile.id, email: `${type}@creatorbridge.test` },
          profile: res.profile,
          isAuthenticated: true,
        });
      } else if (res.success) {
        await refreshSession();
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        profile: authState.profile,
        role: authState.profile?.role || null,
        isAuthenticated: authState.isAuthenticated,
        isLoading,
        signIn,
        signUp,
        signOut,
        loginAsTestAccount,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
