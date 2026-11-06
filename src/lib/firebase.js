import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** False until the four NEXT_PUBLIC_FIREBASE_* keys are set (see .env.local.example). The app then runs in demo mode. */
export const isFirebaseConfigured = Object.values(config).every(Boolean);

/** The only emails allowed into the admin dashboard (comma separated in NEXT_PUBLIC_ADMIN_EMAILS). */
export const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const firebaseApp = () => (getApps().length ? getApp() : initializeApp(config));

export function getFirebaseAuth() {
  if (!isFirebaseConfigured) return null;
  return getAuth(firebaseApp());
}

/** True once NEXT_PUBLIC_DATA_SOURCE=firestore: the app then reads live data instead of the built-in demo data. */
export const useLiveData = isFirebaseConfigured && process.env.NEXT_PUBLIC_DATA_SOURCE === "firestore";

export function getDb() {
  if (!isFirebaseConfigured) return null;
  return getFirestore(firebaseApp());
}
