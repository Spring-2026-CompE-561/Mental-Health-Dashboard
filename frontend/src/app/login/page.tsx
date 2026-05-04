"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import GoogleButton from "@/components/GoogleButton";
import { login as loginApi } from "@/services/api";
import { useAuth, PublicOnlyRoute } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginApi({ email, password });
      signIn(data.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const detail = ((err as { response?: { data?: { detail?: string } } }).response?.data?.detail);
      setError(typeof detail === "string" ? detail : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: "var(--page-bg)", transition: "background-color 0.3s" }}
    >
      <AppHeader links={[{ label: "Create Account", href: "/create-account" }]} />

      <main className="flex-1 w-full flex items-center justify-center p-[24px] md:p-[40px]">
        <Card className="w-full max-w-[520px] md:rounded-[40px] p-[32px] md:p-[56px] flex flex-col gap-[28px] md:gap-[40px]">
          <div className="absolute top-0 left-0 w-full h-[8px] flex">
            <div className="flex-1 bg-[#f9b2d7]" />
            <div className="flex-1 bg-[#b2def9]" />
            <div className="flex-1 bg-[#b2f9c8]" />
            <div className="flex-1 bg-[#f9f0b2]" />
          </div>

          <h1
            className="font-bold text-[36px] md:text-[48px] tracking-tight m-0 text-center"
            style={{ color: "var(--heading-color)" }}
          >
            Login
          </h1>

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm text-center"
              style={{ backgroundColor: "var(--error-bg)", color: "var(--error-color)" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-[24px] md:gap-[28px]">
            <div className="flex flex-col gap-[10px]">
              <Label htmlFor="email" className="text-[16px]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="flex flex-col gap-[10px]">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className="text-[16px] ml-0">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-[14px] font-medium text-[#b2def9] hover:text-[#f9b2d7]"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Must have at least 8 characters"
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="pink"
              size="lg"
              className="w-full mt-[4px] hover:-translate-y-0.5 hover:shadow-[0px_12px_30px_rgba(249,178,215,0.5)] disabled:transform-none"
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="flex items-center gap-[20px] w-full px-4">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-light)" }} />
            <span
              className="font-bold text-[14px] tracking-widest uppercase"
              style={{ color: "var(--placeholder-color)" }}
            >
              OR
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-light)" }} />
          </div>

          <GoogleButton label="Continue with Google" />

          <p
            className="text-center font-medium text-[16px] m-0"
            style={{ color: "var(--muted-color)" }}
          >
            Don&apos;t have an account yet?{" "}
            <Link
              href="/create-account"
              className="font-bold text-[#b2def9] hover:text-[#f9b2d7] transition-colors"
            >
              Create Account
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PublicOnlyRoute>
      <LoginContent />
    </PublicOnlyRoute>
  );
}
