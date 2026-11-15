import { ApiError, json, readBody, route, withTimeout } from "@/lib/server/api";
import { dateKeyOf, MIN, normalizeRoll } from "@/lib/utils";
import { libraryStatus, openWindow } from "@/lib/hours";
import { operatingHours as defaultHours } from "@/mockData";
import { CONFIG } from "@/config";
import { adminDb, adminRtdb } from "@/lib/server/firebaseAdmin";
import { parseSensorValue, sensorForSeat, SENSOR_VALUE } from "@/lib/sensorMap";

export const POST = route(async (request) => {
  const { seatId, roll: scanned } = await readBody(request);
  const roll = normalizeRoll(scanned);
  if (typeof seatId !== "string" || !/^[\w-]{1,40}$/.test(seatId) || !roll) throw new ApiError(400, "We couldn't read that card. Please try again.");

  const sensor = sensorForSeat(seatId);
  if (!sensor) throw new ApiError(404, "This seat isn't available for reservation.");
  const value = parseSensorValue((await adminRtdb().ref(`sensors/${sensor.key}`).get()).val());
  if (value === null) throw new ApiError(409, "This seat's sensor isn't reporting, so it can't be reserved right now.");
  if (value === SENSOR_VALUE.OCCUPIED) throw new ApiError(409, "Someone is already sitting here. Please choose another seat.");
  if (value === SENSOR_VALUE.BREAK) throw new ApiError(409, "This seat is held for a student on a break. Please choose another.");

  const db = adminDb();
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();

  const saved = (await withTimeout(db.doc("config/settings").get())).data()?.operatingHours;
  const hours = Array.isArray(saved) && saved.length === 7 ? saved : defaultHours;
  const status = libraryStatus(hours, nowMs);
  if (!status.open) throw new ApiError(409, `The library is closed. ${status.text.replace(/^Closed · o/, "O")}.`);
  const today = openWindow(hours, dateKeyOf(nowMs));
  if (today && today.closeMs - nowMs < CONFIG.reservation.holdMinutes * MIN) throw new ApiError(409, "The library is about to close, so reservations are paused.");

  const reservation = await withTimeout(db.runTransaction(async (tx) => {
    const [student, hold, mine] = await Promise.all([
      tx.get(db.doc(`students/${roll}`)),
      tx.get(db.doc(`holds/${seatId}`)),
      tx.get(db.collection("reservations").where("studentId", "==", roll).where("status", "==", "active")),
    ]);

    if (!student.exists) throw new ApiError(404, "We don't recognise this card. Please try again or ask the library desk.");

    if (hold.exists && hold.data().expiresAt > now) throw new ApiError(409, "This seat was just reserved. Please choose another.");

    const active = mine.docs.filter((d) => d.data().expiresAt > now);
    if (active.length >= CONFIG.reservation.maxActivePerStudent) {
      const until = new Date(active[0].data().expiresAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });
      throw new ApiError(409, `You already hold a seat until ${until}. Please use it or wait for it to expire.`);
    }

    const durationMinutes = CONFIG.reservation.holdMinutes;
    const ref = db.collection("reservations").doc();
    const record = {
      id: ref.id,
      seatId,
      studentId: roll,
      studentName: student.data().name,
      source: "kiosk",
      createdAt: now,
      expiresAt: new Date(nowMs + durationMinutes * 60_000).toISOString(),
      durationMinutes,
      status: "active",
      closedAt: null,
      closeReason: null,
    };
    tx.set(ref, record);
    tx.set(db.doc(`holds/${seatId}`), { id: ref.id, seatId, createdAt: now, expiresAt: record.expiresAt, durationMinutes, status: "active" });
    return record;
  }));

  return json({ ok: true, id: reservation.id, reservation: { id: reservation.id, seatId, studentName: reservation.studentName, durationMinutes: reservation.durationMinutes, expiresAt: reservation.expiresAt } });
});
