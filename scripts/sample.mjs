import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { reservationHistory, sessionHistory } from "../src/lib/demoData.js";
import { operatingHours } from "../src/mockData.js";
import { addDays, dateKeyOf } from "../src/lib/utils.js";

const DAYS = 21;
const remove = process.argv.includes("--remove");

const { FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_PRIVATE_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId } = process.env;
if (!clientEmail || !FIREBASE_PRIVATE_KEY) throw new Error("Set the service account in .env.local first.");
const db = getFirestore(initializeApp({ credential: cert({ projectId, clientEmail, privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") }) }));

const COLLECTIONS = ["sessions", "reservations"];
const dayOf = (iso) => dateKeyOf(Date.parse(iso));

async function commitInBatches(items, write) {
  for (let i = 0; i < items.length; i += 400) {
    const batch = db.batch();
    items.slice(i, i + 400).forEach((item) => write(batch, item));
    await batch.commit();
  }
}

const existing = Object.fromEntries(await Promise.all(COLLECTIONS.map(async (c) => [c, await db.collection(c).where("sample", "==", true).get()])));

if (remove) {
  for (const c of COLLECTIONS) {
    await commitInBatches(existing[c].docs, (batch, doc) => batch.delete(doc.ref));
    console.log(`Removed ${existing[c].size} sample ${c}.`);
  }
  process.exit(0);
}

if (COLLECTIONS.some((c) => !existing[c].empty)) {
  console.log(`Sample data already exists. Run "npm run sample:remove" first.`);
  process.exit(1);
}

const now = Date.now();
const since = `${addDays(dateKeyOf(now), -DAYS)}T00:00:00`;
const options = { nowMs: now, days: DAYS, hours: operatingHours, includeToday: true };
const generated = {
  sessions: sessionHistory({ ...options, seed: now % 100000 }),
  reservations: reservationHistory({ ...options, seed: (now + 7) % 100000 }),
};

for (const c of COLLECTIONS) {
  const realField = c === "sessions" ? "startedAt" : "createdAt";
  const real = await db.collection(c).where(realField, ">=", since).get();
  const realDays = new Set(real.docs.map((d) => dayOf(d.data()[realField])));
  const items = generated[c].filter((item) => !realDays.has(dayOf(item[realField])));
  await commitInBatches(items, (batch, item) => {
    const ref = db.collection(c).doc();
    batch.set(ref, { id: ref.id, ...item, sample: true });
  });
  const skipped = realDays.size ? ` (skipped ${realDays.size} day(s) with real data)` : "";
  console.log(`Added ${items.length} sample ${c} from ${addDays(dateKeyOf(now), -(DAYS - 1))} to ${dateKeyOf(now)}${skipped}.`);
}
console.log(`Remove them any time with: npm run sample:remove`);
