"use client";

import { useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function GoogleCallbackInner() {
  const router = useRouter();
  const { signIn } = useAuth();
  const searchParams = useSearchParams();
  const ranRef = useRef(false);
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (token) {
      signIn(token);
      router.replace("/dashboard");
    }
  }, [token, signIn, router]);

  if (errorParam || !token) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-[40px]"
        style={{ backgroundColor: "var(--page-bg)" }}
      >
        <div
          className="w-full max-w-[480px] rounded-[32px] p-[48px] shadow-sm text-center"
          style={{
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--border-light)",
          }}
        >
          <h1 className="font-semibold text-[28px] mb-4" style={{ color: "var(--heading-color)" }}>
            Sign-in failed
          </h1>
          <p className="mb-6" style={{ color: "var(--secondary-color)" }}>
            {errorParam || "We couldn't complete your Google sign-in. Please try again."}
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#b2def9] text-white font-semibold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--page-bg)" }}
    >
      <p className="text-[18px]" style={{ color: "var(--secondary-color)" }}>Signing you in…</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }} />}>
      <GoogleCallbackInner />
    </Suspense>
  );
}
