# Local Testing Guide — Mental Health Dashboard

Test everything in this exact order before committing.

---

## STEP 1: Run Backend Unit Tests (no Docker needed)

```bash
cd ~/Desktop/Mental-Health-Dashboard/backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python -c "import nltk; nltk.download('vader_lexicon', quiet=True)"
pytest -v
```

**Expected:** 126 passed, 0 failed

If all 126 pass, your backend code is solid. Move to Step 2.

---

## STEP 2: Build and Start Docker Containers

```bash
cd ~/Desktop/Mental-Health-Dashboard
docker compose down -v
docker compose up -d --build
```

Wait about 30 seconds, then check all 3 containers are running:

```bash
docker compose ps
```

**Expected:** 3 services — db (healthy), backend (running), frontend (running)

If any container failed:

```bash
docker compose logs backend
docker compose logs frontend
```

---

## STEP 3: Test Backend API Endpoints

Open a new terminal. Test each endpoint with curl:

### 3a. Health Check

```bash
curl http://localhost:8000/api/health
```

**Expected:** `{"status":"healthy"}`

### 3b. Create Account

```bash
curl -s -X POST http://localhost:8000/api/create-account \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123"}' | python3 -m json.tool
```

**Expected:** JSON with id, username, email

### 3c. Login

```bash
curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}' | python3 -m json.tool
```

**Expected:** JSON with `access_token`. Copy that token for the next steps.

### 3d. Get Current User

```bash
TOKEN="paste-your-token-here"

curl -s http://localhost:8000/api/users/me \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Expected:** Your user info (id, username, email)

### 3e. Submit Questionnaire (mood/depression/anxiety)

```bash
curl -s -X POST http://localhost:8000/api/questionnaires \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"mood":8,"depression":3,"anxiety":4}' | python3 -m json.tool
```

**Expected:** JSON with mood=8, depression=3, anxiety=4, score (auto-calculated), created_at

### 3f. Get Today's Questionnaire

```bash
curl -s http://localhost:8000/api/questionnaires/today \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Expected:** Same entry you just created

### 3g. Get All Questionnaires

```bash
curl -s http://localhost:8000/api/questionnaires \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Expected:** Array with your questionnaire entry

### 3h. Get Average Score

```bash
curl -s http://localhost:8000/api/questionnaires/average \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Expected:** JSON with average_score (number)

### 3i. Create Journal Entry

```bash
curl -s -X POST http://localhost:8000/api/journals/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"body":"Today was a great day, feeling positive and productive!"}' | python3 -m json.tool
```

**Expected:** JSON with id, body, sentiment_score (auto-calculated by VADER), created_at

### 3j. Get All Journals

```bash
curl -s http://localhost:8000/api/journals \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Expected:** Array with your journal entry including sentiment_score

### 3k. Validate Questionnaire Rejects Bad Input

```bash
curl -s -X POST http://localhost:8000/api/questionnaires \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"mood":15,"depression":3,"anxiety":4}'
```

**Expected:** 422 error (mood must be between 0 and 10)

### 3l. Validate Auth Required

```bash
curl -s http://localhost:8000/api/questionnaires
```

**Expected:** 401 error (Not authenticated)

---

## STEP 4: Test Frontend in Browser

### 4a. Landing Page

Open http://localhost:3000

**Check:**
- Page loads with "Track Your Mental Health Journey" heading
- Dark/light mode toggle works in header
- "Get Started" button goes to /login
- Gradient strip at top (pink, blue, green, yellow)

### 4b. Create Account

Click "Create Account" or go to http://localhost:3000/create-account

**Check:**
- Fill in username, email, password, confirm password
- Submit creates account and redirects to dashboard
- Try submitting with mismatched passwords — should show error
- Try submitting with short password — should show error

### 4c. Login

Go to http://localhost:3000/login

**Check:**
- Login with the account you just created
- Redirects to dashboard after successful login
- Try wrong password — should show error message

### 4d. Dashboard

After login, you should be at http://localhost:3000/dashboard

**Check:**
- "Welcome back, [username]!" heading shows your name
- "Log your mood" button is visible
- Mood Analytics section shows "Mental Health Metrics" heading
- Three chart cards visible: Mood (green), Depression (pink), Anxiety (yellow)
- Week/Month/Year toggle works on metric charts
- "Recent Entries" section visible (empty if no journals yet)
- Journal Positivity Score chart visible with its own period toggle
- Dark mode toggle works — all cards, charts, text adapt correctly

### 4e. Questionnaire

Click "Log your mood" or go to http://localhost:3000/questionnaire

**Check:**
- "How have you been feeling today?" heading
- THREE sliders visible: Mood, Depression, Anxiety
- Each slider has its own color (green, pink, yellow)
- Each slider goes from 1-10 with labels
- Low/high labels show for each (e.g., "Very Low" / "Excellent" for Mood)
- Submit button says "Submit" on first visit
- After submitting, redirects to dashboard
- Go back to questionnaire — sliders should show your previous values
- Button now says "Update today's entry"
- Update the values and submit — should update (upsert)

### 4f. Journals

Go to http://localhost:3000/journals

**Check:**
- Create a new journal entry with positive text
- Entry appears in the list with sentiment score
- Edit the entry — updates correctly
- Delete the entry — removed from list
- Create a few entries with different tones:
  - Positive: "I had an amazing day, everything went perfectly!"
  - Negative: "I feel terrible today, nothing is going right."
  - Neutral: "Went to the store and bought groceries."
- Check that sentiment_score varies for each

### 4g. Dashboard Charts with Data

Go back to http://localhost:3000/dashboard

**Check:**
- Mood/Depression/Anxiety charts now show data points for today
- Journal Positivity Score chart shows data points from your journal entries
- Each chart has proper color-coded dots and gradient area fill
- Week view shows today's data point on the rightmost position

### 4h. Dark Mode

Toggle dark mode on every page:

**Check:**
- Landing page — background, text, buttons all switch
- Login/Create Account — form fields, borders, backgrounds switch
- Dashboard — all chart cards, text, period toggles switch
- Questionnaire — sliders, labels, card background switch
- Journals — entry cards, search box, buttons switch
- No white flashes or unstyled elements in dark mode

### 4i. Logout

Click logout in the header.

**Check:**
- Redirects to landing page
- Going to /dashboard directly redirects to /login
- Going to /questionnaire directly redirects to /login

### 4j. Google OAuth (only if configured)

If you set up GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:

- Go to login page
- Click "Sign in with Google" button
- Should redirect to Google's consent screen
- After authorizing, should redirect back and log you in

---

## STEP 5: Check Security Headers

```bash
curl -s -I http://localhost:8000/ | grep -E "X-Content|X-Frame|X-XSS|Strict-Transport|Referrer-Policy|Permissions-Policy"
```

**Expected:** All 6 security headers present:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## STEP 6: Test Rate Limiting

```bash
for i in $(seq 1 65); do curl -s -o /dev/null -w "%{http_code} " http://localhost:8000/api/health; done
echo ""
```

**Expected:** First 60 requests return 200, then you start seeing 429 (Too Many Requests)

---

## STEP 7: Check API Docs

Open http://localhost:8000/docs

**Check:**
- Swagger UI loads with all endpoints
- Endpoints grouped by: Authentication, Users, Journals, Questionnaires
- Questionnaire POST shows mood/depression/anxiety fields (not single score)

---

## STEP 8: Stop and Clean Up

```bash
docker compose down -v
deactivate  # if you activated the venv earlier
```

---

## If Everything Passes, Commit

```bash
cd ~/Desktop/Mental-Health-Dashboard
git add backend/src/app/models/questionnaire.py \
        backend/src/app/schemas/questionnaire.py \
        backend/src/app/repository/questionnaire.py \
        backend/src/app/services/questionnaire_service.py \
        backend/src/app/routes/questionnaires.py \
        backend/tests/test_questionnaire_crud.py \
        backend/tests/test_questionnaire_endpoints.py \
        backend/tests/test_integration.py \
        backend/tests/test_models.py \
        frontend/src/app/questionnaire/page.js \
        frontend/src/app/dashboard/page.js \
        frontend/src/services/api.js

git commit -m "Add mood, depression, anxiety fields with multi-chart dashboard"

git push origin feature/nextjs-docker-frontendfix
```

If push is rejected (because remote has new commits):

```bash
git pull origin feature/nextjs-docker-frontendfix --rebase
git push origin feature/nextjs-docker-frontendfix
```
