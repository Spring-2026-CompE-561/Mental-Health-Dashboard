"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { ProtectedRoute, useAuth } from "@/contexts/AuthContext";
import { updatePassword, deleteAccount } from "@/services/api";

// ──────────────────────────────────────────────────────────
// Section card wrapper
// ──────────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <div
      className="rounded-2xl p-6 md:p-8 mb-6"
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-light)",
        transition: "background-color 0.3s ease, border-color 0.3s ease",
      }}
    >
      <h2
        className="text-[18px] font-semibold mb-6"
        style={{ color: "var(--heading-color)" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Reusable input field
// ──────────────────────────────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      <label
        className="block text-[14px] font-medium mb-1"
        style={{ color: "var(--secondary-color)" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg px-4 py-2 text-[15px] outline-none transition-colors"
        style={{
          backgroundColor: "var(--input-bg, #f3f4f6)",
          border: "1px solid var(--border-light)",
          color: "var(--body-color)",
        }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Change Password section
// ──────────────────────────────────────────────────────────
function ChangePasswordSection({ userId }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
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
      await updatePassword(userId, { currentPassword, newPassword });
      setMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard title="Change Password">
      <form onSubmit={handleSubmit}>
        <Field
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder="Enter current password"
        />
        <Field
          label="New Password"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="At least 8 characters"
        />
        <Field
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repeat new password"
        />

        {message && (
          <p className="text-[14px] mb-4" style={{ color: "#22c55e" }}>
            {message}
          </p>
        )}
        {error && (
          <p className="text-[14px] mb-4" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg px-6 py-2 text-[15px] font-medium transition-opacity"
          style={{
            backgroundColor: "var(--heading-color)",
            color: "var(--card-bg)",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </SectionCard>
  );
}

// ──────────────────────────────────────────────────────────
// Delete Account section
// ──────────────────────────────────────────────────────────
function DeleteAccountSection({ userId, onDeleted }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await deleteAccount(userId, { password });
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard title="Delete Account">
      <p
        className="text-[14px] mb-4"
        style={{ color: "var(--secondary-color)" }}
      >
        Permanently delete your account and all your data. This cannot be undone.
      </p>

      {!confirm ? (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="rounded-lg px-6 py-2 text-[15px] font-medium"
          style={{
            backgroundColor: "#ef4444",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Delete My Account
        </button>
      ) : (
        <form onSubmit={handleDelete}>
          <p
            className="text-[14px] font-medium mb-3"
            style={{ color: "#ef4444" }}
          >
            Enter your password to confirm deletion:
          </p>
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
          />
          {error && (
            <p className="text-[14px] mb-4" style={{ color: "#ef4444" }}>
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg px-6 py-2 text-[15px] font-medium"
              style={{
                backgroundColor: "#ef4444",
                color: "#fff",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Deleting..." : "Confirm Delete"}
            </button>
            <button
              type="button"
              onClick={() => { setConfirm(false); setPassword(""); setError(null); }}
              className="rounded-lg px-6 py-2 text-[15px] font-medium"
              style={{
                backgroundColor: "var(--border-light)",
                color: "var(--body-color)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </SectionCard>
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

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--bg-color)",
        transition: "background-color 0.3s ease",
      }}
    >
      <AppHeader />
      <main className="px-6 py-8 md:px-[80px] md:py-[48px] max-w-[700px]">
        <h1
          className="text-[28px] md:text-[32px] font-bold mb-8"
          style={{ color: "var(--heading-color)" }}
        >
          Account Settings
        </h1>

        {/* User info */}
        <SectionCard title="Your Account">
          <p style={{ color: "var(--body-color)" }}>
            <span style={{ color: "var(--secondary-color)" }}>Username: </span>
            {user?.username}
          </p>
          <p className="mt-2" style={{ color: "var(--body-color)" }}>
            <span style={{ color: "var(--secondary-color)" }}>Email: </span>
            {user?.email}
          </p>
        </SectionCard>

        {user && <ChangePasswordSection userId={user.id} />}
        {user && <DeleteAccountSection userId={user.id} onDeleted={handleDeleted} />}
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