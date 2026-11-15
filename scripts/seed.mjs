import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { students } from "../src/mockData.js";

const { FIREBASE_SERVICE_ACCOUNT, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId } = process.env;
const account = FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(FIREBASE_SERVICE_ACCOUNT)
  : { projectId, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") };
if (!account.clientEmail || !account.privateKey) throw new Error("Set the service account in .env.local first (see .env.local.example).");

const db = getFirestore(initializeApp({ credential: cert(account) }));
const now = new Date().toISOString();
const batch = db.batch();

for (const email of (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)) {
  batch.set(db.doc(`admins/${email}`), { addedAt: now });
}

for (const { id, name } of students) batch.set(db.doc(`students/${id}`), { name });

await batch.commit();
console.log(`Seeded admins and ${students.length} student(s).`);
