"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createInitialState } from "@/data/mockData";
import {
  countByStatus,
  deriveSeatStatus,
  findActiveReservation,
  getDeviceStatus,
  getReservationStatus,
  RESERVATION_STATUS,
  SEAT_STATUS,
} from "@/lib/seatStatus";
import { tickLiveClock } from "@/lib/simulation";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseAuth, useLiveData } from "@/lib/firebase";
import { useLiveFeed } from "./useLiveFeed";
import { Toasts } from "@/components/ui/Toasts";

const LibraryContext = createContext(null);

const MIN = 60_000;
const nextId = (prefix, list, width) => {
  const max = list.reduce((m, item) => Math.max(m, Number(item.id.split("-").pop()) || 0), 0);
  return `${prefix}-${String(max + 1).padStart(width, "0")}`;
};
const ok = (extra) => ({ ok: true, ...extra });
const fail = (error) => ({ ok: false, error });

/**
 * In-memory stand-in for the future Firebase layer. Every interface (admin,
 * student web, kiosk) should read and write through this one provider.
 * Swap the `setData` calls for database writes and the rest of the app is unchanged.
 */
export function LibraryProvider({ children }) {
  const [mock, setData] = useState(createInitialState);
  const { user } = useAuth();
  const live = useLiveFeed(useLiveData, Boolean(user));
  const [liveNow, setLiveNow] = useState(() => mock.now);
  const [toasts, setToasts] = useState([]);
  const [clockRunning, setClockRunning] = useState(false);

  // Connection to the live data feed. Today that is the browser's network state plus a dev toggle;
  // when Firebase is wired in, drive `feedConnected` from its connection listener instead.
  const [browserOnline, setBrowserOnline] = useState(true);
  const [forcedOffline, setForcedOffline] = useState(false);
  const isOnline = browserOnline && !forcedOffline;

  // Feed status shown to the public site: loading -> ready, or offline / error.
  // The first snapshot is simulated with a short delay; Firebase's first onValue callback will replace it.
  const [loaded, setLoaded] = useState(false);
  const [forcedError, setForcedError] = useState(false);
  const loadTimer = useRef(null);
  const reloadFeed = useCallback(() => {
    clearTimeout(loadTimer.current);
    setLoaded(false);
    loadTimer.current = setTimeout(() => setLoaded(true), 900);
  }, []);
  useEffect(() => {
    reloadFeed();
    return () => clearTimeout(loadTimer.current);
  }, [reloadFeed]);
  const retryFeed = useCallback(() => {
    setForcedError(false);
    reloadFeed();
  }, [reloadFeed]);
  const feedStatus = !isOnline
    ? "offline"
    : useLiveData
      ? live.error ? "error" : live.ready ? "ready" : "loading"
      : forcedError ? "error" : loaded ? "ready" : "loading";
  useEffect(() => {
    setBrowserOnline(navigator.onLine);
    const goOnline = () => setBrowserOnline(true);
    const goOffline = () => setBrowserOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const notify = useCallback((message, tone = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  /* ------------------------------ derived views ------------------------------ */

  // Live mode keeps the layout (floors, seats) from the built-in definitions and takes everything that
  // changes (sensors, holds, reservations, sessions, settings) from Firestore.
  const data = useMemo(() => {
    if (!useLiveData) return mock;
    const sensors = live.sensors ?? {};
    const settings = { ...mock.settings, ...live.config, reservation: { ...mock.settings.reservation, ...live.config?.reservation }, sensors: { ...mock.settings.sensors, ...live.config?.sensors } };
    const holds = (live.holds ?? []).map((h) => ({ ...h, studentId: "", studentName: "", source: "kiosk", closedAt: null, closeReason: null }));
    return {
      ...mock,
      now: liveNow,
      settings,
      devices: mock.devices.map((d) => ({ ...d, lastSeenAt: sensors[d.id]?.lastSeenAt ?? null })),
      sensorReadings: Object.fromEntries(Object.entries(sensors).map(([id, s]) => [id, { occupied: s.occupied, updatedAt: s.updatedAt }])),
      reservations: live.reservations ?? holds,
      occupancySessions: live.sessions ?? [],
      students: [],
    };
  }, [mock, live.config, live.sensors, live.holds, live.reservations, live.sessions, liveNow]);

  useEffect(() => {
    if (!useLiveData) return undefined;
    const tick = () => setLiveNow(new Date().toISOString());
    tick();
    const id = setInterval(tick, clockRunning ? 1000 : 15_000);
    return () => clearInterval(id);
  }, [clockRunning]);

  const { now, settings, floors, sections, seats, devices, sensorReadings, reservations, occupancySessions } = data;
  const nowMs = Date.parse(now);
  const timeoutMs = settings.sensors.timeoutSeconds * 1000;
  const autoExpire = settings.reservation.autoExpire;

  const derived = useMemo(() => {
    const floorById = new Map(floors.map((f) => [f.id, f]));
    const sectionById = new Map(sections.map((s) => [s.id, s]));
    const deviceById = new Map(devices.map((d) => [d.id, d]));

    const seatViews = seats.map((seat) => {
      const device = deviceById.get(seat.deviceId) ?? null;
      const state = deriveSeatStatus({ seat, device, reading: device ? sensorReadings[device.id] : null, reservations, now, timeoutMs, autoExpire });
      return { ...seat, floor: floorById.get(seat.floorId), section: sectionById.get(seat.sectionId), device, ...state };
    });
    const seatById = new Map(seatViews.map((s) => [s.id, s]));

    const deviceViews = devices.map((device) => ({
      ...device,
      status: getDeviceStatus(device, now, timeoutMs),
      reading: sensorReadings[device.id] ?? null,
      seat: seatById.get(device.seatId) ?? null,
    }));

    const reservationViews = reservations
      .map((r) => ({ ...r, status: getReservationStatus(r, now, autoExpire), seat: seatById.get(r.seatId) ?? null }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const sessionViews = occupancySessions
      .map((s) => ({ ...s, seat: seatById.get(s.seatId) ?? null }))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

    return { floorById, sectionById, seatViews, seatById, deviceViews, reservationViews, sessionViews, seatCounts: countByStatus(seatViews) };
  }, [floors, sections, seats, devices, sensorReadings, reservations, occupancySessions, now, timeoutMs, autoExpire]);

  /* --------------------------------- actions --------------------------------- */

  const patch = useCallback((fn) => setData((d) => ({ ...d, ...fn(d) })), []);

  // Reservations -----------------------------------------------------------
  const cancelReservation = useCallback(
    (id, by = "admin") => {
      patch((d) => ({
        reservations: d.reservations.map((r) =>
          r.id === id && getReservationStatus(r, d.now, d.settings.reservation.autoExpire) === RESERVATION_STATUS.ACTIVE
            ? { ...r, status: RESERVATION_STATUS.CANCELLED, closedAt: d.now, closeReason: `cancelled-by-${by}` }
            : r,
        ),
      }));
    },
    [patch],
  );

  /** Used by the dev simulator today; the kiosk and student site will call this too. */
  const createReservation = useCallback(
    (seatId, student, source = "kiosk") => {
      const seat = derived.seatById.get(seatId);
      if (!seat) return fail("Seat not found.");
      if (seat.status !== SEAT_STATUS.AVAILABLE) return fail(`Seat ${seat.number} is ${seat.status}, so it cannot be reserved.`);
      const open = reservations.filter(
        (r) => r.studentId === student.studentId && getReservationStatus(r, now, autoExpire) === RESERVATION_STATUS.ACTIVE,
      ).length;
      // Fixed rule: one active hold per student at a time.
      if (open >= 1) return fail(`${student.studentName} already holds a seat. Only one seat can be reserved at a time.`);
      const id = nextId("RSV", reservations, 4);
      const duration = settings.reservation.durationMinutes;
      patch((d) => ({
        reservations: [
          ...d.reservations,
          { id, seatId, ...student, source, createdAt: d.now, expiresAt: new Date(Date.parse(d.now) + duration * MIN).toISOString(), durationMinutes: duration, status: RESERVATION_STATUS.ACTIVE, closedAt: null, closeReason: null },
        ],
      }));
      return ok({ id });
    },
    [derived.seatById, reservations, now, autoExpire, settings.reservation, patch],
  );

  // Devices & simulation ---------------------------------------------------
  const heartbeatAll = useCallback(
    () =>
      patch((d) => ({
        devices: d.devices.map((dev) => (dev.isActive ? { ...dev, lastSeenAt: d.now } : dev)),
        sensorReadings: Object.fromEntries(Object.entries(d.sensorReadings).map(([id, r]) => [id, { ...r, updatedAt: d.now }])),
      })),
    [patch],
  );

  /** Simulate a connectivity problem: "offline" (no heartbeat) or "stale" (heartbeat but old reading). */
  const setDeviceConnectivity = useCallback(
    (deviceId, mode) =>
      patch((d) => {
        const old = new Date(Date.parse(d.now) - d.settings.sensors.timeoutSeconds * 3 * 1000).toISOString();
        const reading = d.sensorReadings[deviceId] ?? { occupied: false };
        return {
          devices: d.devices.map((dev) => (dev.id === deviceId ? { ...dev, lastSeenAt: mode === "offline" ? old : d.now } : dev)),
          sensorReadings: { ...d.sensorReadings, [deviceId]: { ...reading, updatedAt: mode === "online" ? d.now : old } },
        };
      }),
    [patch],
  );

  /** Sensor reports a change in physical occupancy; manages the session and reservation check-in. */
  const setOccupancy = useCallback(
    (seatId, occupied) =>
      patch((d) => {
        const seat = d.seats.find((s) => s.id === seatId);
        if (!seat?.deviceId) return {};
        const next = {
          sensorReadings: { ...d.sensorReadings, [seat.deviceId]: { occupied, updatedAt: d.now } },
          devices: d.devices.map((dev) => (dev.id === seat.deviceId ? { ...dev, lastSeenAt: d.now } : dev)),
        };
        const open = d.occupancySessions.find((s) => s.seatId === seatId && !s.endedAt);
        if (occupied && !open) {
          next.occupancySessions = [...d.occupancySessions, { id: nextId("SES", d.occupancySessions, 5), seatId, startedAt: d.now, endedAt: null }];
          const held = findActiveReservation(d.reservations, seatId, d.now, d.settings.reservation.autoExpire);
          if (held) {
            next.reservations = d.reservations.map((r) => (r.id === held.id ? { ...r, status: RESERVATION_STATUS.COMPLETED, closedAt: d.now, closeReason: "checked-in" } : r));
          }
        } else if (!occupied && open) {
          next.occupancySessions = d.occupancySessions.map((s) => (s.id === open.id ? { ...s, endedAt: d.now } : s));
        }
        return next;
      }),
    [patch],
  );

  // The student site runs the clock so hold countdowns tick; admin keeps it frozen.
  useEffect(() => {
    // No feed means no new readings: freeze everything on the last known data.
    if (useLiveData || !clockRunning || !isOnline) return undefined;
    const id = setInterval(() => patch((d) => tickLiveClock(d, 1000)), 1000);
    return () => clearInterval(id);
  }, [clockRunning, isOnline, patch]);

  const advanceClock = useCallback((minutes) => patch((d) => ({ now: new Date(Date.parse(d.now) + minutes * MIN).toISOString() })), [patch]);
  const resetData = useCallback(() => setData(createInitialState()), []);

  // Notifications ----------------------------------------------------------
  const markNotificationsRead = useCallback(() => patch((d) => ({ notifications: d.notifications.map((n) => ({ ...n, read: true })) })), [patch]);

  // Configuration ----------------------------------------------------------
  const updateConfig = useCallback((key, value) => patch(() => ({ [key]: value })), [patch]);
  const updateSettings = useCallback(
    async (group, value) => {
      if (!useLiveData) return patch((d) => ({ settings: { ...d.settings, [group]: value } }));
      try {
        const token = await getFirebaseAuth().currentUser.getIdToken();
        const res = await fetch("/api/settings", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(value) });
        const body = await res.json();
        if (!res.ok) return fail(body.error ?? "Couldn't save the setting.");
        return ok();
      } catch {
        return fail("Can't reach the server. Please try again.");
      }
    },
    [patch],
  );

  /** Kiosk: reserve `seatId` for the student whose ID card barcode (roll number) was scanned. */
  const reserveWithCard = useCallback(
    async (seatId, scanned) => {
      if (useLiveData) {
        try {
          const res = await fetch("/api/reserve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ seatId, roll: scanned }) });
          const body = await res.json();
          return res.ok ? ok({ reservation: body.reservation }) : fail(body.error ?? "We couldn't reserve this seat. Please try again.");
        } catch {
          return fail("Can't reach the library system. Please try again.");
        }
      }
      const clean = (v) => String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const student = data.students.find((s) => clean(s.id) === clean(scanned));
      if (!student) return fail(`We don't recognise this card (scanned: ${String(scanned).trim() || "nothing"}). Please try again or ask the library desk.`);
      const existing = reservations.find((r) => r.studentId === student.id && getReservationStatus(r, now, autoExpire) === RESERVATION_STATUS.ACTIVE);
      if (existing) return fail("You already hold a seat. Only one seat can be reserved at a time.");
      const result = createReservation(seatId, { studentId: student.id, studentName: student.name }, "kiosk");
      if (!result.ok) return result;
      const durationMinutes = settings.reservation.durationMinutes;
      return ok({ reservation: { id: result.id, seatId, studentName: student.name, durationMinutes, expiresAt: new Date(nowMs + durationMinutes * MIN).toISOString() } });
    },
    [data.students, reservations, now, nowMs, autoExpire, settings.reservation.durationMinutes, createReservation],
  );

  const addFloor = useCallback(
    (name) => {
      if (data.floors.some((f) => f.name.toLowerCase() === name.trim().toLowerCase())) return fail("A floor with this name already exists.");
      patch((d) => ({ floors: [...d.floors, { id: nextId("FLR", d.floors, 1), name: name.trim(), level: d.floors.length }] }));
      return ok();
    },
    [data.floors, patch],
  );
  const renameFloor = useCallback((id, name) => patch((d) => ({ floors: d.floors.map((f) => (f.id === id ? { ...f, name: name.trim() } : f)) })), [patch]);
  const deleteFloor = useCallback(
    (id) => {
      if (data.sections.some((s) => s.floorId === id)) return fail("Remove this floor's sections first.");
      if (data.seats.some((s) => s.floorId === id)) return fail("Move or remove this floor's seats first.");
      patch((d) => ({ floors: d.floors.filter((f) => f.id !== id) }));
      return ok();
    },
    [data.sections, data.seats, patch],
  );
  const addSection = useCallback(
    (floorId, name) => {
      if (data.sections.some((s) => s.floorId === floorId && s.name.toLowerCase() === name.trim().toLowerCase())) return fail("This floor already has a section with that name.");
      patch((d) => ({ sections: [...d.sections, { id: `SEC-${floorId.split("-").pop()}${String.fromCharCode(65 + d.sections.filter((s) => s.floorId === floorId).length)}`, floorId, name: name.trim() }] }));
      return ok();
    },
    [data.sections, patch],
  );
  const renameSection = useCallback((id, name) => patch((d) => ({ sections: d.sections.map((s) => (s.id === id ? { ...s, name: name.trim() } : s)) })), [patch]);
  const deleteSection = useCallback(
    (id) => {
      if (data.seats.some((s) => s.sectionId === id)) return fail("Move or remove this section's seats first.");
      patch((d) => ({ sections: d.sections.filter((s) => s.id !== id) }));
      return ok();
    },
    [data.seats, patch],
  );

  const value = {
    // connection to the live feed
    isLive: useLiveData,
    isOnline,
    setForcedOffline,
    feedStatus,
    reloadFeed,
    retryFeed,
    setForcedError,
    // raw state
    now,
    nowMs,
    library: data.library,
    operatingHours: data.operatingHours,
    settings,
    floors,
    sections,
    occupancySessions,
    notifications: data.notifications,
    announcements: data.announcements,
    admin: data.admin,
    students: data.students,
    // derived (status always computed from shared data)
    ...derived,
    // actions
    cancelReservation, createReservation, reserveWithCard,
    heartbeatAll, setDeviceConnectivity, setOccupancy, advanceClock, setClockRunning, resetData,
    markNotificationsRead, updateConfig, updateSettings,
    addFloor, renameFloor, deleteFloor, addSection, renameSection, deleteSection,
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
