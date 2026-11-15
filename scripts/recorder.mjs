import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getDatabase } from "firebase-admin/database";
import { parseSensorValue, SENSORS, SENSOR_VALUE } from "../src/lib/sensorMap.js";
import { CONFIG } from "../src/config.js";

const GRACE_MS = CONFIG.sessions.graceMinutes * 60_000;
const MIN_SESSION_MS = CONFIG.sessions.minSessionMinutes * 60_000;

const { FIREBASE_SERVICE_ACCOUNT, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId, NEXT_PUBLIC_FIREBASE_DATABASE_URL: databaseURL } = process.env;
const account = FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(FIREBASE_SERVICE_ACCOUNT)
  : { projectId, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") };
if (!account.clientEmail || !account.privateKey) throw new Error("Set the service account in .env.local first (see .env.local.example).");
if (!databaseURL) throw new Error("Set NEXT_PUBLIC_FIREBASE_DATABASE_URL in .env.local.");

const app = initializeApp({ credential: cert(account), databaseURL });
const db = getFirestore(app);
const rtdb = getDatabase(app);

const iso = (ms) => new Date(ms).toISOString();
const log = (...args) => console.log(new Date().toLocaleTimeString("en-IN", { hour12: false }), ...args);

const seats = new Map(SENSORS.map((s) => [s.key, { ...s, value: null, session: null, closeTimer: null, pendingEnd: null, queue: Promise.resolve() }]));

async function openSession(seat, atMs, approximate = false) {
  const ref = db.collection("sessions").doc();
  seat.session = { id: ref.id, seatId: seat.seatId, startedAt: iso(atMs), endedAt: null, breakStartedAt: null, breakMinutes: 0, breaks: 0, ...(approximate && { approximate: true }) };
  await ref.set(seat.session);
  log(`${seat.key} session opened ${ref.id}${approximate ? " (approximate start)" : ""}`);
}

async function checkIn(seat, atMs) {
  const holdRef = db.doc(`holds/${seat.seatId}`);
  const hold = await holdRef.get();
  if (!hold.exists || hold.data().expiresAt <= iso(atMs)) return;
  await db.batch()
    .update(db.doc(`reservations/${hold.data().id}`), { status: "completed", closedAt: iso(atMs), closeReason: "checked-in" })
    .delete(holdRef)
    .commit();
  log(`${seat.key} kiosk reservation ${hold.data().id} checked in`);
}

async function closeSession(seat, endMs, approximate = false) {
  const s = seat.session;
  if (!s) return;
  seat.session = null;
  const ref = db.doc(`sessions/${s.id}`);
  if (endMs - Date.parse(s.startedAt) < MIN_SESSION_MS) {
    await ref.delete();
    log(`${seat.key} session ${s.id} dropped (shorter than ${MIN_SESSION_MS / 60_000} min)`);
    return;
  }
  await ref.update({ endedAt: iso(endMs), breakStartedAt: null, ...(approximate && { approximate: true }) });
  log(`${seat.key} session ${s.id} closed, ${Math.round((endMs - Date.parse(s.startedAt)) / 60_000)} min`);
}

function cancelPendingClose(seat) {
  clearTimeout(seat.closeTimer);
  seat.closeTimer = null;
  seat.pendingEnd = null;
}

async function onChange(seat, from, to, atMs) {
  await db.collection("events").add({ seatId: seat.seatId, sensor: seat.key, from, to, at: iso(atMs) });
  log(`${seat.key} ${from} -> ${to}`);

  if (to === SENSOR_VALUE.OCCUPIED) {
    await checkIn(seat, atMs);
    if (seat.pendingEnd !== null) {
      cancelPendingClose(seat);
    } else if (seat.session?.breakStartedAt) {
      const breakMinutes = seat.session.breakMinutes + Math.round((atMs - Date.parse(seat.session.breakStartedAt)) / 60_000);
      seat.session = { ...seat.session, breakStartedAt: null, breakMinutes };
      await db.doc(`sessions/${seat.session.id}`).update({ breakStartedAt: null, breakMinutes });
    } else if (!seat.session) {
      await openSession(seat, atMs);
    }
  }

  if (to === SENSOR_VALUE.BREAK) {
    if (seat.pendingEnd !== null) cancelPendingClose(seat);
    if (seat.session && !seat.session.breakStartedAt) {
      const breaks = seat.session.breaks + 1;
      seat.session = { ...seat.session, breakStartedAt: iso(atMs), breaks };
      await db.doc(`sessions/${seat.session.id}`).update({ breakStartedAt: iso(atMs), breaks });
    }
  }

  if (to === SENSOR_VALUE.FREE && seat.session) {
    if (seat.session.breakStartedAt) {
      await closeSession(seat, Date.parse(seat.session.breakStartedAt));
    } else {
      seat.pendingEnd = atMs;
      seat.closeTimer = setTimeout(() => {
        const end = seat.pendingEnd;
        cancelPendingClose(seat);
        enqueue(seat, () => closeSession(seat, end));
      }, GRACE_MS);
    }
  }
}

function enqueue(seat, job) {
  seat.queue = seat.queue.then(job).catch((e) => log(`${seat.key} error:`, e.message));
  return seat.queue;
}

async function reconcile(seat, value, atMs) {
  const open = await db.collection("sessions").where("seatId", "==", seat.seatId).where("endedAt", "==", null).get();
  const docs = open.docs.map((d) => d.data()).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  for (const extra of docs.slice(0, -1)) await db.doc(`sessions/${extra.id}`).update({ endedAt: iso(atMs), approximate: true });
  seat.session = docs.at(-1) ?? null;

  if (value === null) {
    log(`${seat.key} (${seat.seatId}) has no valid value in the database; skipped`);
    return;
  }
  if (value === SENSOR_VALUE.OCCUPIED) await checkIn(seat, atMs);
  const inUse = value === SENSOR_VALUE.OCCUPIED || value === SENSOR_VALUE.BREAK;
  if (inUse && !seat.session) await openSession(seat, atMs, true);
  else if (!inUse && seat.session) await closeSession(seat, seat.session.breakStartedAt ? Date.parse(seat.session.breakStartedAt) : atMs, true);
  else if (value === SENSOR_VALUE.BREAK && !seat.session.breakStartedAt) {
    seat.session = { ...seat.session, breakStartedAt: iso(atMs), breaks: seat.session.breaks + 1 };
    await db.doc(`sessions/${seat.session.id}`).update({ breakStartedAt: seat.session.breakStartedAt, breaks: seat.session.breaks });
  } else if (value === SENSOR_VALUE.OCCUPIED && seat.session?.breakStartedAt) {
    const breakMinutes = seat.session.breakMinutes + Math.round((atMs - Date.parse(seat.session.breakStartedAt)) / 60_000);
    seat.session = { ...seat.session, breakStartedAt: null, breakMinutes };
    await db.doc(`sessions/${seat.session.id}`).update({ breakStartedAt: null, breakMinutes });
  }
  log(`${seat.key} (${seat.seatId}) is ${value ?? "missing"}, ${seat.session ? `session ${seat.session.id} open` : "no open session"}`);
}

let first = true;
rtdb.ref("sensors").on(
  "value",
  (snap) => {
    const node = snap.val() ?? {};
    const atMs = Date.now();
    for (const seat of seats.values()) {
      const value = parseSensorValue(node[seat.key]);
      const prev = seat.value;
      seat.value = value;
      if (first) enqueue(seat, () => reconcile(seat, value, atMs));
      else if (value !== prev && value !== null && prev !== null) enqueue(seat, () => onChange(seat, prev, value, atMs));
      else if (value !== prev) log(`${seat.key} ${prev} -> ${value} (ignored: missing or invalid value)`);
    }
    first = false;
  },
  (e) => log("Realtime Database error:", e.message),
);
log(`Recording ${SENSORS.map((s) => s.key).join(", ")}. Press Ctrl+C to stop.`);

async function shutdown() {
  log("Stopping…");
  rtdb.ref("sensors").off();
  await Promise.all([...seats.values()].map((seat) => {
    if (seat.pendingEnd === null) return seat.queue;
    const end = seat.pendingEnd;
    cancelPendingClose(seat);
    return enqueue(seat, () => closeSession(seat, end));
  }));
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
