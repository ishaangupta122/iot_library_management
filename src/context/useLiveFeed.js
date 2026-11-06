"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

const HISTORY_DAYS = 90;
const listen = (source, onData, onError) => onSnapshot(source, onData, onError);
const docsOf = (snapshot) => snapshot.docs.map((d) => d.data());

/**
 * Live listeners for the shared data. Everything here is read-only: writes go through the /api routes.
 * Returns the raw documents plus `ready` (first data received) and `error`.
 * `isAdmin` also subscribes to the private reservations list.
 */
export function useLiveFeed(enabled, isAdmin) {
  const [state, setState] = useState({ config: null, sensors: null, holds: null, sessions: null });
  const [reservations, setReservations] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const db = getDb();
    const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();
    const fail = (e) => setError(e);
    const set = (key) => (value) => {
      setError(null);
      setState((s) => ({ ...s, [key]: value }));
    };
    const stops = [
      listen(doc(db, "config/settings"), (snap) => set("config")(snap.data() ?? {}), fail),
      listen(collection(db, "sensors"), (snap) => set("sensors")(docsOf(snap).length ? Object.fromEntries(snap.docs.map((d) => [d.id, d.data()])) : {}), fail),
      listen(collection(db, "holds"), (snap) => set("holds")(docsOf(snap)), fail),
      listen(query(collection(db, "sessions"), where("startedAt", ">=", since)), (snap) => set("sessions")(docsOf(snap)), fail),
    ];
    return () => stops.forEach((stop) => stop());
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !isAdmin) return undefined;
    return listen(collection(getDb(), "reservations"), (snap) => setReservations(docsOf(snap)), (e) => setError(e));
  }, [enabled, isAdmin]);

  const ready = enabled && Object.values(state).every((v) => v !== null) && (!isAdmin || reservations !== null);
  return { ...state, reservations, ready, error };
}
