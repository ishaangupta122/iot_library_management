import "server-only";
import { NextResponse } from "next/server";
import { CONFIG } from "@/config";
import { adminAuth } from "./firebaseAdmin";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const json = (body, status = 200) => NextResponse.json(body, { status });

export function route(handler) {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof ApiError) return json({ ok: false, error: error.message }, error.status);
      if (error?.code === 8 || error?.code === "resource-exhausted") {
        console.warn("Firestore daily quota reached");
        return json({ ok: false, error: "Reservations are paused for today because the library system has reached its daily limit. Please ask the library desk." }, 503);
      }
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

async function verifyToken(token) {
  try {
    return await (await adminAuth()).verifyIdToken(token);
  } catch (error) {
    console.error("verifyIdToken failed, checking with Google instead:", error?.code ?? error?.message);
  }
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    });
    if (!res.ok) {
      console.error("Token rejected by Google:", res.status, await res.text());
      return null;
    }
    const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return claims.aud === process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? claims : null;
  } catch (error) {
    console.error("Token check failed:", error?.message);
    return null;
  }
}

export async function requireAdmin(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new ApiError(401, "Please sign in again.");
  const decoded = await verifyToken(token);
  if (!decoded) throw new ApiError(401, "Please sign in again.");
  if (!adminEmails().includes((decoded.email ?? "").toLowerCase())) throw new ApiError(403, "This account does not have admin access.");
  if (Date.now() / 1000 - decoded.auth_time > CONFIG.admin.sessionDays * 86_400) throw new ApiError(401, "Your session has expired. Please sign in again.");
  return decoded;
}

/** Firebase retries for a long time when it is overloaded or over quota; give up after `ms` with a clear message. */
export function withTimeout(promise, ms = 10_000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new ApiError(503, "The library system is busy right now. Please try again in a few minutes or ask the library desk.")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
