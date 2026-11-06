// Creates the starting data in Firestore. Safe to run again.
//   node --env-file=.env.local scripts/seed.mjs
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { seats } from "../src/data/mockData.js";

const { FIREBASE_SERVICE_ACCOUNT, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId } = process.env;
const account = FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(FIREBASE_SERVICE_ACCOUNT)
  : { projectId, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") };
if (!account.clientEmail || !account.privateKey) throw new Error("Set the service account in .env.local first (see .env.local.example).");

const db = getFirestore(initializeApp({ credential: cert(account) }));
const now = new Date().toISOString();
const batch = db.batch();

batch.set(db.doc("config/settings"), {
  reservation: { durationMinutes: 5, autoExpire: true, maxActivePerStudent: 1 },
  sensors: { timeoutSeconds: 120 },
  preferences: { rowsPerPage: 10, notifyDeviceOffline: true, notifyReservationExpiry: false, dailySummaryEmail: true },
});

// One sensor document per seat. The ESP32 for a seat posts with its deviceId.
for (const seat of seats.filter((s) => s.deviceId)) {
  batch.set(db.doc(`sensors/${seat.deviceId}`), { seatId: seat.id, occupied: false, updatedAt: now, lastSeenAt: now }, { merge: true });
}

// Admin emails that may read reservations.
for (const email of (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)) {
  batch.set(db.doc(`admins/${email}`), { addedAt: now });
}

// Registered students: the document ID is the roll number printed in the ID card barcode.
const STUDENTS = (process.env.SEED_STUDENTS ?? "1024031118:Ishaan Gupta").split(",").map((pair) => pair.split(":").map((x) => x.trim()));
for (const [roll, name] of STUDENTS) batch.set(db.doc(`students/${roll.toUpperCase()}`), { name });

await batch.commit();
console.log(`Seeded settings, ${seats.filter((s) => s.deviceId).length} sensors, admins and ${STUDENTS.length} student(s).`);
