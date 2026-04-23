import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is rejected, force a logout so the user isn't stuck on a protected page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────

export async function createAccount({ username, email, password }) {
  const { data } = await api.post('/create-account', { username, email, password });
  return data;
}

export async function login({ email, password }) {
  const { data } = await api.post('/login', { email, password });
  return data;
}

export async function logout() {
  const { data } = await api.post('/logout');
  return data;
}

export async function forgotPassword({ email }) {
  const { data } = await api.post('/forgot-password', { email });
  return data;
}

export async function resetPassword({ token, newPassword }) {
  const { data } = await api.post('/reset-password', { token, new_password: newPassword });
  return data;
}

export async function getGoogleAuthUrl() {
  const { data } = await api.get('/auth/google/login');
  return data;
}

// ──────────────────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────────────────

export async function getMe() {
  const { data } = await api.get('/users/me');
  return data;
}

// ──────────────────────────────────────────────────────────
// Journals
// ──────────────────────────────────────────────────────────

export async function createJournal({ body }) {
  const { data } = await api.post('/journals/create', { body });
  return data;
}

export async function getJournals() {
  const { data } = await api.get('/journals/');
  return data;
}

export async function getJournal(id) {
  const { data } = await api.get(`/journals/${id}`);
  return data;
}

export async function updateJournal(id, { body }) {
  const { data } = await api.put(`/journals/${id}`, { body });
  return data;
}

export async function deleteJournal(id) {
  const { data } = await api.delete(`/journals/${id}`);
  return data;
}

// ──────────────────────────────────────────────────────────
// Questionnaires
// ──────────────────────────────────────────────────────────

export async function createQuestionnaire({ score }) {
  // Backend upserts on the server side: sending twice in a day updates the existing entry.
  const { data } = await api.post('/questionnaires/', { score });
  return data;
}

export async function getQuestionnaires({ fromDate, toDate } = {}) {
  const params = {};
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;
  const { data } = await api.get('/questionnaires/', { params });
  return data;
}

export async function getTodaysQuestionnaire() {
  const { data } = await api.get('/questionnaires/today');
  return data; // may be null
}

export async function getQuestionnaireAverage({ fromDate, toDate } = {}) {
  const params = {};
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;
  const { data } = await api.get('/questionnaires/average', { params });
  return data;
}

export default api;
