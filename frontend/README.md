# Frontend

Next.js 16 (App Router) frontend for the Mental Health Dashboard.

## Pages

| Route | File | Description |
|---|---|---|
| `/` | `app/page.js` | Landing page |
| `/login` | `app/login/page.js` | Email/password login |
| `/create-account` | `app/create-account/page.js` | Registration |
| `/forgot-password` | `app/forgot-password/page.js` | Request password reset email |
| `/reset-password` | `app/reset-password/page.js` | Reset password via token |
| `/dashboard` | `app/dashboard/page.js` | Mood analytics and journal previews |
| `/journals` | `app/journals/page.js` | Journal entry CRUD |
| `/questionnaire` | `app/questionnaire/page.js` | Daily mood, depression, and anxiety logging |
| `/settings` | `app/settings/page.js` | Account settings |
| `/auth/google/callback` | `app/auth/google/callback/page.js` | Google OAuth callback |

## Key Files

| File | Description |
|---|---|
| `components/AppHeader.js` | Navigation bar used on every page |
| `components/GoogleButton.js` | Google OAuth sign-in button |
| `contexts/AuthContext.js` | JWT auth state, `signIn`, `signOut`, protected route wrapper |
| `contexts/ThemeContext.js` | Light/dark mode toggle, persists preference |
| `services/api.js` | Axios client — attaches Bearer token, clears token on 401 |
