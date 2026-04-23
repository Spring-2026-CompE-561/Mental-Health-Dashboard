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

// POST /api/create-account
// Backend expects: { username: string, email: string, password: string }
// Returns: { id, username, email, oauth_provider, created_at }
export async function createAccount({ username, email, password }) {
  const response = await api.post('/create-account', {
    username,
    email,
    password,
  });
  return response.data;
}

// POST /api/login
// Backend expects: { email: string, password: string }
// Returns: { access_token: string, token_type: "bearer" }
export async function login({ email, password }) {
  const response = await api.post('/login', {
    email,
    password,
  });
  return response.data;
}

// POST /api/logout
// Returns: { success: boolean, message: string }
export async function logout() {
  const response = await api.post('/logout');
  return response.data;
}

// GET /api/auth/google/login
// Returns: { url: string } — redirect user to this URL
export async function getGoogleAuthUrl() {
  const response = await api.get('/auth/google/login');
  return response.data;
}

export default api;
