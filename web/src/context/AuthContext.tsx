'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import { syncUserWithFirestore, updateUserPlanInFirestore } from '@/lib/user-service';
import { getUsageState, updatePlan, resetGuestSession } from '@/lib/storage';

export interface SonichecksUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  plan?: 'free' | 'pro' | 'studio';
  tier?: 'FREE' | 'PRO' | 'STUDIO';
  status?: 'active' | 'expired' | 'cancelled';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  resetDate?: string;
  daysRemaining?: number;
  filesChecked?: number;
  monthlyAllowance?: number;
  lastLoginAt?: string;
  registeredAt?: string;
  isAnonymous?: boolean;
}

interface AuthContextType {
  user: SonichecksUser | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (onSuccessCallback?: () => void) => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithLocalEmail: (email: string) => Promise<void>;
  setUserPlan: (plan: 'free' | 'pro' | 'studio') => Promise<void>;
  syncUserWithServer: (overrideEmail?: string) => Promise<void>;
  cancelSubscription: () => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  authSuccessCallback: (() => void) | null;
}

const LOCAL_USER_KEY = 'sonichecks_user_session_v1';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SonichecksUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authSuccessCallback, setAuthSuccessCallback] = useState<(() => void) | null>(null);

  const syncLoginWithServer = async (u: SonichecksUser) => {
    if (!u.email) return;
    try {
      // Calculate total files checked in the current month from history
      const localUsage = getUsageState(u.email);
      const clientFilesChecked = localUsage.filesChecked;

      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: u.email,
          displayName: u.displayName,
          clientFilesChecked
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.plan) {
          u.plan = data.plan;
          u.tier = data.tier || data.plan.toUpperCase();
          u.status = data.status || 'active';
          u.subscriptionStartDate = data.subscriptionStartDate;
          u.subscriptionEndDate = data.subscriptionEndDate;
          u.resetDate = data.resetDate;
          u.daysRemaining = data.daysRemaining;
          u.filesChecked = data.filesChecked;
          u.monthlyAllowance = data.monthlyAllowance;
          u.lastLoginAt = data.lastLoginAt;
          u.registeredAt = data.registeredAt;
          updatePlan(data.plan, u.email);
          setUser({ ...u });
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
          }
        }
      }
    } catch (err) {
      console.warn('Server user sync notice:', err);
    }
  };

  const syncUserWithServer = async (overrideEmail?: string) => {
    const targetEmail = overrideEmail || user?.email;
    if (!targetEmail) return;
    const currentUser = user || { email: targetEmail, uid: targetEmail, plan: 'free' };
    await syncLoginWithServer(currentUser);
  };

  useEffect(() => {
    // 1. Check local session storage first
    let cachedUser: SonichecksUser | null = null;
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(LOCAL_USER_KEY);
        if (saved) {
          cachedUser = JSON.parse(saved);
          if (cachedUser && cachedUser.email) {
            const usage = getUsageState(cachedUser.email);
            cachedUser.plan = usage.plan;
            setUser(cachedUser);
            // Trigger server sync in background
            syncLoginWithServer(cachedUser);
          }
        }
      }
    } catch (e) {}

    // 2. Listen to Firebase auth state and sync with Firestore
    let unsubscribeAuth = () => {};

    if (auth) {
      try {
        unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            const u: SonichecksUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              lastLoginAt: new Date().toISOString()
            };

            await syncLoginWithServer(u);
            setUser(u);

            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
            }
            setIsAuthModalOpen(false);
          }
          setLoading(false);
        }, (error) => {
          console.warn('Firebase Auth State listener notice:', error);
          setLoading(false);
        });
      } catch (err) {
        console.warn('Firebase Auth init notice:', err);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const openAuthModal = (callback?: () => void) => {
    if (user) {
      if (callback) callback();
      return;
    }
    if (callback) {
      setAuthSuccessCallback(() => callback);
    } else {
      setAuthSuccessCallback(null);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthSuccessCallback(null);
  };

  const triggerSuccess = async (signedInUser: SonichecksUser) => {
    await syncLoginWithServer(signedInUser);
    setUser(signedInUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(signedInUser));
    }
    setIsAuthModalOpen(false);
    if (authSuccessCallback) {
      const cb = authSuccessCallback;
      setAuthSuccessCallback(null);
      setTimeout(() => cb(), 50);
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase Auth is not configured. Please use Email Sign In.');
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await triggerSuccess({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!auth) {
      await signInWithLocalEmail(email);
      return;
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await triggerSuccess({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });
      }
    } catch (err: any) {
      console.error('Email Sign In error:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    if (!auth) {
      await signInWithLocalEmail(email);
      return;
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await triggerSuccess({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });
      }
    } catch (err: any) {
      console.error('Email Sign Up error:', err);
      throw err;
    }
  };

  const signInWithLocalEmail = async (email: string) => {
    const localUser: SonichecksUser = {
      uid: `local_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      email: email.trim().toLowerCase(),
      displayName: email.split('@')[0],
      lastLoginAt: new Date().toISOString()
    };
    await triggerSuccess(localUser);
  };

  const setUserPlan = async (plan: 'free' | 'pro' | 'studio') => {
    if (user?.email) {
      try {
        await fetch('/api/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, forcePlan: plan })
        });
      } catch (e) {}
      updatePlan(plan, user.email);
      setUser((prev) => prev ? { ...prev, plan, tier: plan.toUpperCase() as any } : prev);
    } else {
      updatePlan(plan);
    }
  };

  const cancelSubscription = async (): Promise<{ success: boolean; message?: string }> => {
    if (!user?.email) {
      return { success: false, message: 'Please sign in to manage your subscription.' };
    }
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser: SonichecksUser = {
          ...user,
          status: 'cancelled'
        };
        setUser(updatedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));
        }
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to cancel subscription.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network communication error.' };
    }
  };

  const logout = async () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
    resetGuestSession();
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInWithLocalEmail,
        setUserPlan,
        syncUserWithServer,
        cancelSubscription,
        logout,
        authSuccessCallback
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
