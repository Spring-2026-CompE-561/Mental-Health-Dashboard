"use client";

import { useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { forgotPassword } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: "var(--page-bg)", transition: "background-color 0.3s" }}
    >
      <AppHeader links={[{ label: "Register", href: "/create-account" }]} />

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
              Forgot password?
            </h1>
            <p
              className="font-normal text-[16px] m-0 leading-relaxed max-w-[320px]"
              style={{ color: "var(--secondary-color)" }}
            >
              Enter your email address below and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {submitted ? (
            <div
              className="px-4 py-4 rounded-xl text-sm text-center leading-relaxed"
              style={{ backgroundColor: "var(--success-bg)", color: "var(--success-color)" }}
            >
              If an account exists with that email, a reset link has been sent. Check your inbox
              (and spam folder).
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>
          )}

          <div className="w-full flex justify-center">
            <Link
              href="/login"
              className="font-medium text-[16px] transition-colors hover:text-[#f9b2d7]"
              style={{ color: "var(--secondary-color)" }}
            >
              Back to Login
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
