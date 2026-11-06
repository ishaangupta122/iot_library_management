import { ApiError, json, readBody, requireSensorKey, route } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebaseAdmin";

/**
 * Called by the ESP32 whenever its seat state changes, and as a heartbeat every minute or two.
 *   POST /api/sensor   header: x-device-key   body: { deviceId, occupied }
 * Records the reading, opens/closes the occupancy session, and checks in a held seat.
 */
export const POST = route(async (request) => {
  requireSensorKey(request);
  const { deviceId, occupied } = await readBody(request);
  if (typeof deviceId !== "string" || !/^[\w-]{1,40}$/.test(deviceId) || typeof occupied !== "boolean") {
    throw new ApiError(400, "Send { deviceId, occupied } with occupied as true or false.");
  }

  const db = adminDb();
  const now = new Date().toISOString();
  const sensorRef = db.doc(`sensors/${deviceId}`);

  await db.runTransaction(async (tx) => {
    const sensor = await tx.get(sensorRef);
    if (!sensor.exists) throw new ApiError(404, "Unknown device.");
    const { seatId } = sensor.data();

    const openSessions = await tx.get(db.collection("sessions").where("seatId", "==", seatId).where("endedAt", "==", null).limit(1));
    const holdRef = db.doc(`holds/${seatId}`);
    const hold = occupied ? await tx.get(holdRef) : null;

    tx.update(sensorRef, { occupied, updatedAt: now, lastSeenAt: now });

    if (occupied && openSessions.empty) {
      const sessionRef = db.collection("sessions").doc();
      tx.set(sessionRef, { id: sessionRef.id, seatId, startedAt: now, endedAt: null });
      // Someone sat down on a held seat: that hold is used (checked in), whoever it was.
      if (hold?.exists) {
        const { id, expiresAt } = hold.data();
        if (expiresAt > now) tx.update(db.doc(`reservations/${id}`), { status: "completed", closedAt: now, closeReason: "checked-in" });
        tx.delete(holdRef);
      }
    } else if (!occupied && !openSessions.empty) {
      tx.update(openSessions.docs[0].ref, { endedAt: now });
    }
  });

  return json({ ok: true });
});
