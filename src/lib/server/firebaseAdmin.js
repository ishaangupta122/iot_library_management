import "server-only";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Server-side Firebase (Admin SDK). Used only by the /api routes, never in the browser.
 * Credentials come from the service account key: either the whole JSON in FIREBASE_SERVICE_ACCOUNT,
 * or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (see .env.local.example).
 */
function credential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  const { FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_PRIVATE_KEY: privateKey } = process.env;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!clientEmail || !privateKey || !projectId) throw new Error("Firebase Admin credentials are not set.");
  return cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, "\n") });
}

const app = () => (getApps().length ? getApp() : initializeApp({ credential: credential() }));

export const adminDb = () => getFirestore(app());
export const adminAuth = () => getAuth(app());
