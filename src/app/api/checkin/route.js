import { ApiError, json, readBody, route, withTimeout } from "@/lib/server/api";
import { adminDb, adminRtdb } from "@/lib/server/firebaseAdmin";
import { parseSensorValue, sensorForSeat, SENSOR_VALUE } from "@/lib/sensorMap";

export const POST = route(async (request) => {
  const { seatId } = await readBody(request);
  const sensor = typeof seatId === "string" ? sensorForSeat(seatId) : null;
  if (!sensor) throw new ApiError(400, "Unknown seat.");

  const value = parseSensorValue((await adminRtdb().ref(`sensors/${sensor.key}`).get()).val());
  if (value !== SENSOR_VALUE.OCCUPIED) return json({ ok: true, checkedIn: false });

  const db = adminDb();
  const now = new Date().toISOString();
  const holdRef = db.doc(`holds/${seatId}`);
  const checkedIn = await withTimeout(db.runTransaction(async (tx) => {
    const hold = await tx.get(holdRef);
    if (!hold.exists || hold.data().expiresAt <= now) return false;
    tx.update(db.doc(`reservations/${hold.data().id}`), { status: "completed", closedAt: now, closeReason: "checked-in" });
    tx.delete(holdRef);
    return true;
  }));
  return json({ ok: true, checkedIn });
});
