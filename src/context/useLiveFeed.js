"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { onValue, ref } from "firebase/database";
import { getDb, getRtdb } from "@/lib/firebase";
import { readSensors } from "@/lib/sensorMap";
import { CONFIG } from "@/config";

const HISTORY_DAYS = CONFIG.history.loadDays;
const listen = (source, onData, onError) => onSnapshot(source, onData, onError);
const docsOf = (snapshot) => snapshot.docs.map((d) => d.data());

export function useLiveFeed(enabled, isAdmin) {
  const [state, setState] = useState({ config: null, sensors: null, holds: null, sessions: null });
  const [reservations, setReservations] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const db = getDb();
    const rtdb = getRtdb();
    const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();
    const needsHistory = !window.location.pathname.startsWith("/kiosk");
    const fail = (e) => setError(e);
    const set = (key) => (value) => {
      setError(null);
      setState((s) => ({ ...s, [key]: value }));
    };
    const stops = [
      listen(doc(db, "config/settings"), (snap) => set("config")(snap.data() ?? {}), fail),
      rtdb
        ? onValue(ref(rtdb, "sensors"), (snap) => set("sensors")(readSensors(snap.val())), fail)
        : (fail(new Error("NEXT_PUBLIC_FIREBASE_DATABASE_URL is not set.")), () => {}),
      listen(collection(db, "holds"), (snap) => set("holds")(docsOf(snap)), fail),
      needsHistory
        ? listen(query(collection(db, "sessions"), where("startedAt", ">=", since)), (snap) => set("sessions")(docsOf(snap)), fail)
        : (set("sessions")([]), () => {}),
    ];
    return () => stops.forEach((stop) => stop());
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !isAdmin) return undefined;
    const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();
    return listen(query(collection(getDb(), "reservations"), where("createdAt", ">=", since)), (snap) => setReservations(docsOf(snap)), (e) => setError(e));
  }, [enabled, isAdmin]);

  const ready = enabled && Object.values(state).every((v) => v !== null) && (!isAdmin || reservations !== null);
  return { ...state, reservations, ready, error };
}
