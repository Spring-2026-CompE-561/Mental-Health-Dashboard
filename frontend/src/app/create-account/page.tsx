"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import GoogleButton from "@/components/GoogleButton";
import { createAccount, login as loginApi } from "@/services/api";
import { useAuth, PublicOnlyRoute } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

function Field({ id, label, type = "text", value, onChange, placeholder, required = true }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="font-bold text-[13px] md:text-[14px]">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function CreateAccountContent() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
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
      await createAccount({ username: username.trim(), email, password });
      const data = await loginApi({ email, password });
      signIn(data.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string | { msg: string }[] } } };
      const detail = axiosErr.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: { msg: string }) => d.msg).join(". "));
      } else {
        setError(typeof detail === "string" ? detail : "Registration failed. Try again.");
      }
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: "var(--page-bg)", transition: "background-color 0.3s" }}
    >
      <AppHeader links={[{ label: "Login", href: "/login" }]} />

      <main className="flex-1 w-full flex items-start md:items-center justify-center px-4 md:px-0 pt-6 pb-10">
        <Card className="w-full max-w-[400px] md:max-w-[480px] md:rounded-[32px] p-6 md:p-12 flex flex-col gap-6 md:gap-[28px]">
          <div className="absolute top-0 left-0 w-full h-[6px] flex">
            <div className="flex-1 bg-[#f9b2d7]" />
            <div className="flex-1 bg-[#b2def9]" />
            <div className="flex-1 bg-[#b2f9c8]" />
            <div className="flex-1 bg-[#f9f0b2]" />
          </div>

          <h1
            className="font-bold text-[32px] md:text-[40px] tracking-tight m-0 text-center pt-2"
            style={{ color: "var(--heading-color)" }}
          >
            Create Account
          </h1>

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm text-center"
              style={{ backgroundColor: "var(--error-bg)", color: "var(--error-color)" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
            <Field id="username" label="Username" value={username} onChange={setUsername} placeholder="Choose a username" />
            <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="Enter your email" />
            <Field id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="Must have at least 8 characters" />
            <Field id="confirm-password" label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter your password" />

            <Button
              type="submit"
              disabled={loading}
              variant="default"
              size="lg"
              className="w-full mt-2 active:scale-[0.98]"
            >
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-light)" }} />
            <span className="font-bold text-[12px]" style={{ color: "var(--placeholder-color)" }}>OR</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-light)" }} />
          </div>

          <GoogleButton label="Sign up with Google" />

          <p className="text-center font-medium text-[14px] md:text-[16px] m-0" style={{ color: "var(--muted-color)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#b2def9] hover:underline">
              Login
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}

export default function CreateAccountPage() {
  return (
    <PublicOnlyRoute>
      <CreateAccountContent />
    </PublicOnlyRoute>
  );
}
