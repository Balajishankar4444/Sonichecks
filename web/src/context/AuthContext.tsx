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
import { auth, googleProvider } from '@/lib/firebase';

export interface SonichecksUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
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

  useEffect(() => {
    // 1. Check local session storage first
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(LOCAL_USER_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email) {
            setUser(parsed);
          }
        }
      }
    } catch (e) {}

    // 2. Listen to Firebase auth state
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const u: SonichecksUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          };
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

    return () => unsubscribe();
  }, []);

  const openAuthModal = (callback?: () => void) => {
    // If user is already logged in, do not open modal, execute callback immediately
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

  const triggerSuccess = (signedInUser: SonichecksUser) => {
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
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        triggerSuccess({
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
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        triggerSuccess({
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
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        triggerSuccess({
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
      displayName: email.split('@')[0]
    };
    triggerSuccess(localUser);
  };

  const logout = async () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
    try {
      await firebaseSignOut(auth);
    } catch (e) {}
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
