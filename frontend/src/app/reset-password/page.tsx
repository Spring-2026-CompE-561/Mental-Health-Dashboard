"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { resetPassword } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token: token || "", new_password: password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const detail = ((err as { response?: { data?: { detail?: string } } }).response?.data?.detail);
      setError(
        typeof detail === "string" ? detail : "Could not reset password. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div
        className="flex flex-col relative w-full min-h-screen"
        style={{ backgroundColor: "var(--page-bg)", transition: "background-color 0.3s" }}
      >
        <AppHeader links={[{ label: "Login", href: "/login" }]} />
        <main className="flex-1 w-full flex items-center justify-center p-[40px]">
          <Card className="w-full max-w-[480px] p-[48px] flex flex-col gap-4 items-center text-center">
            <h1 className="font-semibold text-[28px]" style={{ color: "var(--heading-color)" }}>
              Invalid reset link
            </h1>
            <p style={{ color: "var(--secondary-color)" }}>
              This link is missing a reset token. Request a new one from the forgot-password page.
            </p>
            <Button asChild variant="default">
              <Link href="/forgot-password">Request new link</Link>
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: "var(--page-bg)", transition: "background-color 0.3s" }}
    >
      <AppHeader links={[{ label: "Login", href: "/login" }]} />

      <main className="flex-1 w-full flex items-center justify-center p-[40px]">
        <Card className="w-full max-w-[480px] p-[48px] flex flex-col gap-[32px]">
          <div className="absolute top-0 left-0 w-full h-[6px] flex">
            <div className="flex-1 bg-[#f9b2d7]" />
            <div className="flex-1 bg-[#b2def9]" />
            <div className="flex-1 bg-[#b2f9c8]" />
            <div className="flex-1 bg-[#f9f0b2]" />
          </div>

          <div className="flex flex-col gap-[12px] items-center text-center">
            <h1
              className="font-semibold text-[36px] tracking-tight m-0"
              style={{ color: "var(--heading-color)" }}
            >
              Reset password
            </h1>
            <p
              className="font-normal text-[16px] m-0 leading-relaxed max-w-[320px]"
              style={{ color: "var(--secondary-color)" }}
            >
              Choose a new password for your account.
            </p>
          </div>

          {success ? (
            <div
              className="px-4 py-4 rounded-xl text-sm text-center"
              style={{ backgroundColor: "var(--success-bg)", color: "var(--success-color)" }}
            >
              Password reset successfully. Redirecting to login…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[24px] mt-[8px]">
              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-sm text-center"
                  style={{ backgroundColor: "var(--error-bg)", color: "var(--error-color)" }}
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-[8px]">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Must be at least 8 characters"
                  required
                />
              </div>

              <div className="flex flex-col gap-[8px]">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="default"
                size="lg"
                className="w-full mt-[8px]"
              >
                {loading ? "Resetting…" : "Reset Password"}
              </Button>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
