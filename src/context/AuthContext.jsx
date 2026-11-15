"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { CONFIG } from "@/config";
import { ADMIN_EMAILS, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { DAY } from "@/lib/utils";

const AuthContext = createContext(null);

export const DEMO_CREDENTIALS = { email: "admin@smartlib.demo", password: "admin123" };
const DEMO_USER = { email: DEMO_CREDENTIALS.email, name: "Priya Nair" };
const DEMO_KEY = "smartlib-demo-admin";

const MESSAGES = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes or reset your password.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/popup-blocked": "The sign-in popup was blocked. Allow popups and try again.",
};
const friendly = (error) => MESSAGES[error?.code] ?? "Something went wrong. Please try again.";
const isAdmin = (email) => ADMIN_EMAILS.includes((email ?? "").toLowerCase());

const toUser = (u) => ({ email: u.email, name: u.displayName || u.email.split("@")[0] });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const expiresAt = useRef(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      try {
        if (sessionStorage.getItem(DEMO_KEY)) setUser(DEMO_USER);
      } catch {}
      setReady(true);
      return undefined;
    }
    const auth = getFirebaseAuth();
    const stop = onAuthStateChanged(auth, async (u) => {
      if (!u || !isAdmin(u.email)) {
        expiresAt.current = null;
        setUser(null);
        setReady(true);
        return;
      }
      const { authTime } = await u.getIdTokenResult();
      expiresAt.current = Date.parse(authTime) + CONFIG.admin.sessionDays * DAY;
      if (Date.now() >= expiresAt.current) {
        await firebaseSignOut(auth);
        return;
      }
      setUser(toUser(u));
      setReady(true);
    });
    const check = setInterval(() => {
      if (expiresAt.current && Date.now() >= expiresAt.current) firebaseSignOut(auth);
    }, 60_000);
    return () => {
      stop();
      clearInterval(check);
    };
  }, []);

  const admit = useCallback(async (credential) => {
    if (isAdmin(credential.user.email)) return { ok: true };
    await firebaseSignOut(getFirebaseAuth());
    return { ok: false, error: "This account does not have admin access." };
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    if (!isFirebaseConfigured) {
      if (email.trim().toLowerCase() !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) return { ok: false, error: "Incorrect email or password." };
      try { sessionStorage.setItem(DEMO_KEY, "1"); } catch {}
      setUser(DEMO_USER);
      return { ok: true };
    }
    try {
      return await admit(await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password));
    } catch (error) {
      return { ok: false, error: friendly(error) };
    }
  }, [admit]);

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) {
      try { sessionStorage.setItem(DEMO_KEY, "1"); } catch {}
      setUser(DEMO_USER);
      return { ok: true };
    }
    try {
      return await admit(await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider()));
    } catch (error) {
      return error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request" ? { ok: false, error: "" } : { ok: false, error: friendly(error) };
    }
  }, [admit]);

  const resetPassword = useCallback(async (email) => {
    if (!isFirebaseConfigured) return { ok: true, demo: true };
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      return { ok: true };
    } catch (error) {
      if (error?.code === "auth/user-not-found") return { ok: true };
      return { ok: false, error: friendly(error) };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isFirebaseConfigured) await firebaseSignOut(getFirebaseAuth());
    else {
      try { sessionStorage.removeItem(DEMO_KEY); } catch {}
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, isDemo: !isFirebaseConfigured, signInWithEmail, signInWithGoogle, resetPassword, signOut }),
    [user, ready, signInWithEmail, signInWithGoogle, resetPassword, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
