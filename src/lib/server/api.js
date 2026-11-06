import "server-only";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { adminAuth } from "./firebaseAdmin";

/** Thrown inside a route to answer with a clear message and status. */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const json = (body, status = 200) => NextResponse.json(body, { status });

/** Wraps a route handler so ApiErrors become friendly JSON and anything else becomes a generic 500. */
export function route(handler) {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof ApiError) return json({ ok: false, error: error.message }, error.status);
      console.error(error);
      return json({ ok: false, error: "Something went wrong on the server. Please try again." }, 500);
    }
  };
}

export async function readBody(request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Invalid request.");
  }
}

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

/** Requires a signed-in admin: a valid Firebase ID token whose email is on the admin list. */
export async function requireAdmin(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new ApiError(401, "Please sign in again.");
  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(token);
  } catch {
    throw new ApiError(401, "Please sign in again.");
  }
  if (!adminEmails().includes((decoded.email ?? "").toLowerCase())) throw new ApiError(403, "This account does not have admin access.");
  return decoded;
}

/** Compares the secret the ESP32 sends against SENSOR_API_KEY without leaking timing. */
export function requireSensorKey(request) {
  const expected = process.env.SENSOR_API_KEY;
  const given = request.headers.get("x-device-key") ?? "";
  if (!expected) throw new ApiError(500, "Sensor key is not configured on the server.");
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new ApiError(401, "Invalid device key.");
}
