"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  subscribeToAuthChanges,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  resetUserPassword,
  logoutUser,
  getUserProfile,
  getLocalCurrentUser,
} from "@/lib/firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import type { UserProfile } from "@/types/user";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (name: string, email: string, password: string) => Promise<UserProfile>;
  signInGoogle: () => Promise<UserProfile>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = subscribeToAuthChanges((profile) => {
      setUser(profile);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    const uid =
      user?.uid ||
      getFirebaseAuth()?.currentUser?.uid ||
      getLocalCurrentUser()?.uid;
    if (!uid) return;
    const updated = await getUserProfile(uid);
    if (updated) {
      setUser(updated);
    }
  }, [user?.uid]);

  const login = useCallback(async (email: string, password: string) => {
    const profile = await loginWithEmail(email, password);
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const profile = await registerWithEmail(name, email, password);
      setUser(profile);
      return profile;
    },
    []
  );

  const signInGoogle = useCallback(async () => {
    const profile = await loginWithGoogle();
    setUser(profile);
    return profile;
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await resetUserPassword(email);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        loading,
        login,
        register,
        signInGoogle,
        sendPasswordReset,
        logout,
        refreshProfile,
      },
    },
    mounted ? children : null
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return ctx;
}
