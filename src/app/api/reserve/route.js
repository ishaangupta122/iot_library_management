import { ApiError, json, readBody, route } from "@/lib/server/api";
import { DEFAULT_SETTINGS, normalizeRoll } from "@/lib/server/constants";
import { adminDb } from "@/lib/server/firebaseAdmin";

/**
 * Kiosk reservation. The student's ID card barcode (roll number) is checked here, on the server,
 * so the student list never reaches the browser.
 *   POST /api/reserve   body: { seatId, roll }
 */
export const POST = route(async (request) => {
  const { seatId, roll: scanned } = await readBody(request);
  const roll = normalizeRoll(scanned);
  if (typeof seatId !== "string" || !/^[\w-]{1,40}$/.test(seatId) || !roll) throw new ApiError(400, "We couldn't read that card. Please try again.");

  const db = adminDb();
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();

  const reservation = await db.runTransaction(async (tx) => {
    const [student, settingsDoc, sensors, hold, mine] = await Promise.all([
      tx.get(db.doc(`students/${roll}`)),
      tx.get(db.doc("config/settings")),
      tx.get(db.collection("sensors").where("seatId", "==", seatId).limit(1)),
      tx.get(db.doc(`holds/${seatId}`)),
      tx.get(db.collection("reservations").where("studentId", "==", roll).where("status", "==", "active")),
    ]);

    if (!student.exists) throw new ApiError(404, "We don't recognise this card. Please try again or ask the library desk.");
    if (sensors.empty) throw new ApiError(404, "This seat isn't available for reservation.");

    const settings = { ...DEFAULT_SETTINGS, ...settingsDoc.data() };
    const sensor = sensors.docs[0].data();
    const sensorFresh = nowMs - Date.parse(sensor.updatedAt) <= settings.sensors.timeoutSeconds * 1000;
    if (!sensorFresh) throw new ApiError(409, "This seat's sensor isn't reporting, so it can't be reserved right now.");
    if (sensor.occupied) throw new ApiError(409, "Someone is already sitting here. Please choose another seat.");
    if (hold.exists && hold.data().expiresAt > now) throw new ApiError(409, "This seat was just reserved. Please choose another.");

    const open = mine.docs.find((d) => d.data().expiresAt > now);
    if (open) {
      throw new ApiError(409, `You already hold a seat until ${new Date(open.data().expiresAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" })}. Only one seat can be reserved at a time.`);
    }

    const durationMinutes = settings.reservation.durationMinutes;
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
    // Public, anonymous copy: tells every screen the seat is held, without saying by whom.
    tx.set(db.doc(`holds/${seatId}`), { id: ref.id, seatId, createdAt: now, expiresAt: record.expiresAt, durationMinutes, status: "active" });
    return record;
  });

  return json({ ok: true, id: reservation.id, reservation: { id: reservation.id, seatId, studentName: reservation.studentName, durationMinutes: reservation.durationMinutes, expiresAt: reservation.expiresAt } });
});
