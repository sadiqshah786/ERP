import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, FIREBASE_CONFIGURED } from "@/lib/firebase";

export interface SignupProfile {
  name: string;
  company: string;
  whatsapp: string;
}

interface AuthUser {
  uid: string;
  email: string | null;
  name: string;
  company?: string;
  emailVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile: SignupProfile) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: () => Promise<void>;
  checkVerified: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthState>(null!);
export const useAuth = () => useContext(AuthContext);

const DEMO_KEY = "amal_erp::demo_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (FIREBASE_CONFIGURED) {
      return onAuthStateChanged(auth, (u: User | null) => {
        setUser(
          u
            ? {
                uid: u.uid,
                email: u.email,
                name: u.displayName || u.email?.split("@")[0] || "User",
                emailVerified: u.emailVerified,
              }
            : null
        );
        setLoading(false);
      });
    }
    const raw = localStorage.getItem(DEMO_KEY);
    setUser(raw ? JSON.parse(raw) : null);
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    if (FIREBASE_CONFIGURED) {
      await signInWithEmailAndPassword(auth, email, password);
      return;
    }
    const u: AuthUser = { uid: "demo", email, name: email.split("@")[0] || "User", emailVerified: true };
    localStorage.setItem(DEMO_KEY, JSON.stringify(u));
    setUser(u);
  };

  const signUp = async (email: string, password: string, profile: SignupProfile) => {
    if (FIREBASE_CONFIGURED) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: profile.name });
      await setDoc(doc(db, "company_profiles", cred.user.uid), {
        name: profile.name,
        company: profile.company,
        whatsapp: profile.whatsapp,
        email,
        createdAt: serverTimestamp(),
      });
      await sendEmailVerification(cred.user);
      setUser({ uid: cred.user.uid, email, name: profile.name, company: profile.company, emailVerified: false });
      return;
    }
    // demo mode — create unverified pending user (verification simulated)
    const u: AuthUser = { uid: "demo", email, name: profile.name, company: profile.company, emailVerified: false };
    localStorage.setItem(DEMO_KEY, JSON.stringify(u));
    setUser(u);
  };

  const resendVerification = async () => {
    if (FIREBASE_CONFIGURED && auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const checkVerified = async () => {
    if (FIREBASE_CONFIGURED && auth.currentUser) {
      await reload(auth.currentUser);
      const verified = auth.currentUser.emailVerified;
      if (verified) setUser((p) => (p ? { ...p, emailVerified: true } : p));
      return verified;
    }
    // demo mode — auto-verify
    setUser((p) => {
      if (!p) return p;
      const next = { ...p, emailVerified: true };
      localStorage.setItem(DEMO_KEY, JSON.stringify(next));
      return next;
    });
    return true;
  };

  const resetPassword = async (email: string) => {
    if (FIREBASE_CONFIGURED) {
      await sendPasswordResetEmail(auth, email);
      return;
    }
    // demo mode — no real email; resolve so the UI shows the sent state
    await new Promise((r) => setTimeout(r, 400));
  };

  const signOut = async () => {
    if (FIREBASE_CONFIGURED) {
      await fbSignOut(auth);
      return;
    }
    localStorage.removeItem(DEMO_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, resendVerification, checkVerified, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}
