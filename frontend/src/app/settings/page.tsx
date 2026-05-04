"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { ProtectedRoute, useAuth } from "@/contexts/AuthContext";
import { updatePassword, deleteAccount } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// ──────────────────────────────────────────────────────────
// Change Password section
// ──────────────────────────────────────────────────────────
function ChangePasswordSection({ userId }: { userId: number }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(userId, { current_password: currentPassword, new_password: newPassword });
      setMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>

          {message && (
            <p className="text-[14px]" style={{ color: "#22c55e" }}>{message}</p>
          )}
          {error && (
            <p className="text-[14px]" style={{ color: "#ef4444" }}>{error}</p>
          )}

          <Button type="submit" disabled={loading} size="sm" className="w-fit">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────
// Delete Account section
// ──────────────────────────────────────────────────────────
function DeleteAccountSection({ userId, onDeleted }: { userId: number; onDeleted: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await deleteAccount(userId, { password });
      onDeleted();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to delete account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Delete Account</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[14px] mb-4" style={{ color: "var(--secondary-color)" }}>
          Permanently delete your account and all your data. This cannot be undone.
        </p>

        {!confirm ? (
          <Button
            type="button"
            variant="pink"
            size="sm"
            onClick={() => setConfirm(true)}
            className="w-fit"
          >
            Delete My Account
          </Button>
        ) : (
          <form onSubmit={handleDelete} className="flex flex-col gap-4">
            <p className="text-[14px] font-medium" style={{ color: "#ef4444" }}>
              Enter your password to confirm deletion:
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="delete-password">Password</Label>
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            {error && (
              <p className="text-[14px]" style={{ color: "#ef4444" }}>{error}</p>
            )}
            <div className="flex gap-3">
              <Button type="submit" variant="pink" size="sm" disabled={loading} className="w-fit">
                {loading ? "Deleting..." : "Confirm Delete"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setConfirm(false); setPassword(""); setError(null); }}
                className="w-fit"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────
// Main Settings page
// ──────────────────────────────────────────────────────────
function SettingsContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleDeleted() {
    await signOut();
    router.push("/");
  }

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--bg-color)",
        transition: "background-color 0.3s ease",
      }}
    >
      <AppHeader />
      <main className="px-6 py-8 md:px-[80px] md:py-[48px] max-w-[700px] mx-auto w-full">
        <h1
          className="text-[28px] md:text-[32px] font-bold mb-8"
          style={{ color: "var(--heading-color)" }}
        >
          Account Settings
        </h1>

        {/* User info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p style={{ color: "var(--body-color)" }}>
              <span style={{ color: "var(--secondary-color)" }}>Username: </span>
              {user?.username}
            </p>
            <p style={{ color: "var(--body-color)" }}>
              <span style={{ color: "var(--secondary-color)" }}>Email: </span>
              {user?.email}
            </p>
          </CardContent>
        </Card>

        {user && <ChangePasswordSection userId={user.id} />}
        {user && <DeleteAccountSection userId={user.id} onDeleted={handleDeleted} />}

        {/* Sign out */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sign Out</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[14px] mb-4" style={{ color: "var(--secondary-color)" }}>
              Sign out of your account on this device.
            </p>
            <Button variant="outline" size="sm" onClick={handleLogout} className="w-fit">
              Logout
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}