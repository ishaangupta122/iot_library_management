"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/** Sends visitors who are not signed in to the login page. */
export function AdminGuard({ children }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div role="status" aria-label="Checking sign-in" className="flex min-h-screen items-center justify-center text-sm text-muted">
        Checking sign-in…
      </div>
    );
  }
  return children;
}
