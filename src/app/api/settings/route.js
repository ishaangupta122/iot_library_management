import { ApiError, json, readBody, requireAdmin, route, withTimeout } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebaseAdmin";
import { normalizeHours, validateHours } from "@/lib/hours";

export const POST = route(async (request) => {
  await requireAdmin(request);
  const { operatingHours } = await readBody(request);
  const errors = validateHours(operatingHours);
  if (errors) throw new ApiError(400, Object.values(errors)[0]);
  await withTimeout(adminDb().doc("config/settings").set({ operatingHours: normalizeHours(operatingHours) }, { merge: true }));
  return json({ ok: true });
});
