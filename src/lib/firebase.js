import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(config).every(Boolean);

export const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const firebaseApp = () => (getApps().length ? getApp() : initializeApp(config));

export function getFirebaseAuth() {
  if (!isFirebaseConfigured) return null;
  return getAuth(firebaseApp());
}

export const useLiveData = isFirebaseConfigured && process.env.NEXT_PUBLIC_DATA_SOURCE === "firestore";

const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
export function getRtdb() {
  if (!isFirebaseConfigured || !databaseURL) return null;
  return getDatabase(firebaseApp(), databaseURL);
}

export function getDb() {
  if (!isFirebaseConfigured) return null;
  return getFirestore(firebaseApp());
}
