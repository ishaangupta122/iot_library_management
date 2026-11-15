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
  if (Date.now() / 1000 - decoded.auth_time > CONFIG.admin.sessionDays * 86_400) throw new ApiError(401, "Your session has expired. Please sign in again.");
  return decoded;
}
