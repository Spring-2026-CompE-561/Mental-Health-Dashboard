import axios from "axios";
import type {
  AuthResponse,
  CreateAccountRequest,
  DeleteAccountRequest,
  ForgotPasswordRequest,
  GoogleAuthUrlResponse,
  Journal,
  JournalCreateRequest,
  JournalUpdateRequest,
  Questionnaire,
  QuestionnaireAverage,
  QuestionnaireCreateRequest,
  QuestionnaireFilters,
  ResetPasswordRequest,
  SuccessResponse,
  UpdatePasswordRequest,
  User,
} from "@/types";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// attach JWT token to every request if it exists
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// if the token is rejected, force a logout so the user is not stuck on a protected page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────

export async function createAccount(payload: CreateAccountRequest): Promise<User> {
  const { data } = await api.post<User>("/create-account", payload);
  return data;
}

export async function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/login", payload);
  return data;
}

export async function logout(): Promise<SuccessResponse> {
  const { data } = await api.post<SuccessResponse>("/logout");
  return data;
}

export async function forgotPassword(payload: ForgotPasswordRequest): Promise<SuccessResponse> {
  const { data } = await api.post<SuccessResponse>("/forgot-password", payload);
  return data;
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<SuccessResponse> {
  const { data } = await api.post<SuccessResponse>("/reset-password", {
    token: payload.token,
    new_password: payload.new_password,
  });
  return data;
}

export async function getGoogleAuthUrl(): Promise<GoogleAuthUrlResponse> {
  const { data } = await api.get<GoogleAuthUrlResponse>("/auth/google/login");
  return data;
}

// ──────────────────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────────────────

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/users/me");
  return data;
}

// ──────────────────────────────────────────────────────────
// Journals
// ──────────────────────────────────────────────────────────

export async function createJournal(payload: JournalCreateRequest): Promise<Journal> {
  const { data } = await api.post<Journal>("/journals/create", payload);
  return data;
}

export async function getJournals(): Promise<Journal[]> {
  const { data } = await api.get<Journal[]>("/journals");
  return data;
}

export async function getJournal(id: number): Promise<Journal> {
  const { data } = await api.get<Journal>(`/journals/${id}`);
  return data;
}

export async function updateJournal(id: number, payload: JournalUpdateRequest): Promise<Journal> {
  const { data } = await api.put<Journal>(`/journals/${id}`, payload);
  return data;
}

export async function deleteJournal(id: number): Promise<SuccessResponse> {
  const { data } = await api.delete<SuccessResponse>(`/journals/${id}`);
  return data;
}

export interface AiPromptResponse {
  prompt: string;
  source: "ai" | "fallback";
}

export async function getAiPrompt(): Promise<AiPromptResponse> {
  const { data } = await api.get<AiPromptResponse>("/journals/ai-prompt");
  return data;
}

// ──────────────────────────────────────────────────────────
// Questionnaires
// ──────────────────────────────────────────────────────────

export async function createQuestionnaire(payload: QuestionnaireCreateRequest): Promise<Questionnaire> {
  const { data } = await api.post<Questionnaire>("/questionnaires", payload);
  return data;
}

export async function getQuestionnaires(filters: QuestionnaireFilters = {}): Promise<Questionnaire[]> {
  const params: Record<string, string> = {};
  if (filters.fromDate) params.from_date = filters.fromDate;
  if (filters.toDate) params.to_date = filters.toDate;
  const { data } = await api.get<Questionnaire[]>("/questionnaires", { params });
  return data;
}

export async function getTodaysQuestionnaire(): Promise<Questionnaire> {
  const { data } = await api.get<Questionnaire>("/questionnaires/today");
  return data;
}

export async function getQuestionnaireAverage(filters: QuestionnaireFilters = {}): Promise<QuestionnaireAverage> {
  const params: Record<string, string> = {};
  if (filters.fromDate) params.from_date = filters.fromDate;
  if (filters.toDate) params.to_date = filters.toDate;
  const { data } = await api.get<QuestionnaireAverage>("/questionnaires/average", { params });
  return data;
}

export async function updatePassword(userId: number, payload: UpdatePasswordRequest): Promise<SuccessResponse> {
  const { data } = await api.put<SuccessResponse>(`/users/${userId}`, {
    current_password: payload.current_password,
    new_password: payload.new_password,
  });
  return data;
}

export async function deleteAccount(userId: number, payload: DeleteAccountRequest): Promise<SuccessResponse> {
  const { data } = await api.delete<SuccessResponse>(`/users/${userId}`, {
    data: payload,
  });
  return data;
}

export default api;
