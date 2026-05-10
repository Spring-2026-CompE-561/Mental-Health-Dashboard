/** Shared type definitions for the Mental Health Dashboard frontend. */

// ── User ────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  oauth_provider: string | null;
  created_at: string;
}

// ── Journal ─────────────────────────────────────────────────

export interface Journal {
  id: number;
  user_id: number;
  body: string;
  created_at: string;
}

export interface JournalCreateRequest {
  body: string;
}

export interface JournalUpdateRequest {
  body: string;
}

// ── Questionnaire ───────────────────────────────────────────

export interface Questionnaire {
  id: number;
  user_id: number;
  mood: number;
  anxiety: number;
  depression: number;
  score: number | null;
  created_at: string;
}

export interface QuestionnaireCreateRequest {
  mood: number;
  depression: number;
  anxiety: number;
}

export interface QuestionnaireFilters {
  fromDate?: string;
  toDate?: string;
}

export interface QuestionnaireAverage {
  mood: number | null;
  depression: number | null;
  anxiety: number | null;
}

// ── Auth ────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateAccountRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface GoogleAuthUrlResponse {
  url: string;
}

// ── Users ───────────────────────────────────────────────────

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface DeleteAccountRequest {
  password: string;
}

// ── AI Suggestions ─────────────────────────────────────────

export interface MoodSuggestionItem {
  emoji: string;
  title: string;
  body: string;
}

export interface MoodSuggestionsResponse {
  heading: string;
  color: string;
  suggestions: MoodSuggestionItem[];
  source: string;
}

// ── Generic ─────────────────────────────────────────────────

export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  detail: string;
}
