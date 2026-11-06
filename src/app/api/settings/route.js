import { ApiError, json, readBody, requireAdmin, route } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebaseAdmin";

/**
 * Admin-only: saves the sensor timeout.
 *   POST /api/settings   header: Authorization: Bearer <Firebase ID token>   body: { timeoutSeconds }
 */
export const POST = route(async (request) => {
  await requireAdmin(request);
  const { timeoutSeconds } = await readBody(request);
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 30 || timeoutSeconds > 600) throw new ApiError(400, "Enter a whole number from 30 to 600.");
  await adminDb().doc("config/settings").set({ sensors: { timeoutSeconds } }, { merge: true });
  return json({ ok: true });
});
