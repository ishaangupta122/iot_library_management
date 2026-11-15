"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CONFIG } from "@/config";
import { MOCK_NOW } from "@/mockData";
import { createInitialState } from "@/lib/demoData";
import { countByStatus, deriveSeatStatus, getReservationStatus, RESERVATION_STATUS, SEAT_STATUS } from "@/lib/seatStatus";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseAuth, useLiveData } from "@/lib/firebase";
import { SENSOR_VALUE, sensorForSeat } from "@/lib/sensorMap";
import { MIN, normalizeRoll } from "@/lib/utils";
import { useLiveFeed } from "./useLiveFeed";
import { Toasts } from "@/components/ui/Toasts";

const LibraryContext = createContext(null);

const DEMO_LOAD_MS = 600;
const ok = (extra) => ({ ok: true, ...extra });
const fail = (error) => ({ ok: false, error });

export function LibraryProvider({ children }) {
  const [mock, setMock] = useState(createInitialState);
  const { user } = useAuth();
  const live = useLiveFeed(useLiveData, Boolean(user));
  const [toasts, setToasts] = useState([]);

  const [clockRunning, setClockRunning] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.parse(MOCK_NOW));
  useEffect(() => {
    const startedAt = Date.now();
    const tick = () => setNowMs(useLiveData ? Date.now() : Date.parse(MOCK_NOW) + (Date.now() - startedAt));
    tick();
    const id = setInterval(tick, clockRunning ? 1000 : 15_000);
    return () => clearInterval(id);
  }, [clockRunning]);
  const now = new Date(nowMs).toISOString();

  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  const [demoLoaded, setDemoLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDemoLoaded(true), DEMO_LOAD_MS);
    return () => clearTimeout(t);
  }, []);
  const feedStatus = !online ? "offline" : useLiveData ? (live.error ? "error" : live.ready ? "ready" : "loading") : demoLoaded ? "ready" : "loading";
  const retryFeed = useCallback(() => window.location.reload(), []);

  const notify = useCallback((message, tone = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const data = useMemo(() => {
    if (!useLiveData) return mock;
    const sensors = live.sensors ?? {};
    const holds = (live.holds ?? []).map((h) => ({ ...h, studentId: "", studentName: "", source: "kiosk", closedAt: null, closeReason: null }));
    return {
      ...mock,
      operatingHours: Array.isArray(live.config?.operatingHours) && live.config.operatingHours.length === 7 ? live.config.operatingHours : mock.operatingHours,
      sensorReadings: Object.fromEntries(
        Object.entries(sensors).map(([id, s]) => [id, { value: s.value, occupied: s.value === SENSOR_VALUE.OCCUPIED, onBreak: s.value === SENSOR_VALUE.BREAK }]),
      ),
      reservations: live.reservations ?? holds,
      occupancySessions: live.sessions ?? [],
      students: [],
    };
  }, [mock, live.config, live.sensors, live.holds, live.reservations, live.sessions]);

  const { floors, seats, devices, sensorReadings, reservations, occupancySessions } = data;

  const derived = useMemo(() => {
    const floorById = new Map(floors.map((f) => [f.id, f]));
    const deviceById = new Map(devices.map((d) => [d.id, d]));
    const seatViews = seats.map((seat) => {
      const device = deviceById.get(seat.deviceId) ?? null;
      const state = deriveSeatStatus({ seat, device, reading: device ? sensorReadings[device.id] ?? null : null, reservations, now });
      return { ...seat, floor: floorById.get(seat.floorId), device, ...state };
    });
    const seatById = new Map(seatViews.map((s) => [s.id, s]));
    const reservationViews = reservations
      .map((r) => ({ ...r, status: getReservationStatus(r, now), seat: seatById.get(r.seatId) ?? null }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const publicSeatViews = seatViews.filter((s) => s.status !== SEAT_STATUS.UNAVAILABLE);
    const monitoredSeats = seatViews.filter((s) => (useLiveData ? sensorForSeat(s.id) : s.deviceId) && s.enabled && !s.maintenance);
    return { seatViews, seatById, reservationViews, seatCounts: countByStatus(seatViews), publicSeatViews, publicSeatCounts: countByStatus(publicSeatViews), monitoredSeats };
  }, [floors, seats, devices, sensorReadings, reservations, now]);

  const checkedIn = useRef(new Set());
  useEffect(() => {
    if (!useLiveData) return;
    for (const seat of derived.seatViews) {
      const held = seat.reservation;
      if (seat.status !== SEAT_STATUS.OCCUPIED || !held || checkedIn.current.has(held.id)) continue;
      checkedIn.current.add(held.id);
      fetch("/api/checkin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ seatId: seat.id }) })
        .catch(() => checkedIn.current.delete(held.id));
    }
  }, [derived.seatViews]);

  const reserveWithCard = useCallback(
    async (seatId, scanned) => {
      if (useLiveData) {
        try {
          const res = await fetch("/api/reserve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ seatId, roll: scanned }), signal: AbortSignal.timeout(20_000) });
          const body = await res.json().catch(() => ({}));
          if (res.ok) return ok({ reservation: body.reservation });
          console.error("Reservation failed", res.status, body);
          return fail(body.error ?? "The library system had a problem. Please try again or ask the library desk.");
        } catch (error) {
          if (error?.name === "TimeoutError") return fail("The library system is taking too long to respond. Please try again or ask the library desk.");
          return fail("Can't reach the library system. Please try again.");
        }
      }
      const seat = derived.seatById.get(seatId);
      const student = data.students.find((s) => normalizeRoll(s.id) === normalizeRoll(scanned));
      if (!student) return fail(`We don't recognise this card (${String(scanned).trim() || "nothing scanned"}). Please try again or ask the library desk.`);
      if (!seat || seat.status !== SEAT_STATUS.AVAILABLE) return fail("This seat is no longer available. Please choose another.");
      const mine = reservations.filter((r) => r.studentId === student.id && getReservationStatus(r, now) === RESERVATION_STATUS.ACTIVE);
      if (mine.length >= CONFIG.reservation.maxActivePerStudent) return fail("You already hold a seat. Only one seat can be reserved at a time.");
      const holdMinutes = CONFIG.reservation.holdMinutes;
      const reservation = {
        id: `RSV-${Date.now()}`, seatId, studentId: student.id, studentName: student.name, source: "kiosk",
        createdAt: now, expiresAt: new Date(nowMs + holdMinutes * MIN).toISOString(), durationMinutes: holdMinutes,
        status: RESERVATION_STATUS.ACTIVE, closedAt: null, closeReason: null,
      };
      setMock((d) => ({ ...d, reservations: [...d.reservations, reservation] }));
      return ok({ reservation: { id: reservation.id, seatId, studentName: student.name, durationMinutes: holdMinutes, expiresAt: reservation.expiresAt } });
    },
    [derived.seatById, data.students, reservations, now, nowMs],
  );

  const updateOperatingHours = useCallback(async (hours) => {
    if (!useLiveData) {
      setMock((d) => ({ ...d, operatingHours: hours }));
      return ok();
    }
    try {
      const token = await getFirebaseAuth().currentUser.getIdToken();
      const res = await fetch("/api/settings", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ operatingHours: hours }) });
      const body = await res.json();
      return res.ok ? ok() : fail(body.error ?? "Couldn't save the opening hours.");
    } catch {
      return fail("Can't reach the server. Please try again.");
    }
  }, []);

  const value = {
    isLive: useLiveData,
    feedStatus,
    retryFeed,
    now,
    nowMs,
    library: data.library,
    operatingHours: data.operatingHours,
    floors,
    occupancySessions,
    ...derived,
    setClockRunning,
    reserveWithCard,
    updateOperatingHours,
    notify,
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside <LibraryProvider>");
  return ctx;
}
