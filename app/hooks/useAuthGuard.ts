"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";

/**
 * Redirects to /login once the session finishes loading, if no user is signed in.
 * Only re-checks when `isLoading` settles (not on every `user` change) so an explicit
 * logout — which also sets user to null while this page is still mounted — can send
 * the visitor wherever the logout handler chooses instead of racing this redirect.
 */
export function useAuthGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return { user, isLoading };
}
