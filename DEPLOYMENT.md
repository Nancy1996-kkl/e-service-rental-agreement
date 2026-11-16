# 🚀 Deployment & Setup Guide

Indha guide-la: **admin create pannradhu**, **Google Sheet setup**, **live server-la deploy pannradhu**, **security checklist**.

---

## 1. 👑 First admin create pannradhu

1. Website-la normal-ah **Register** pannunga (admin-ku use panna pora email).
2. Main folder-la (`E:\E-service>`):
   ```bash
   npm run create-admin -- admin@example.com
   ```
3. Logout → Login. Navbar-la **👑 Admin** button varum → `/admin`.

Admin remove panna: `npm run create-admin -- admin@example.com --remove`
Vera admins-ah dashboard-laye add pannalaam: **Admin → Clients → Make admin**.

---

## 2. 📊 Google Sheet + Drive setup (client's Google account)

Client details **Google Sheet**-la, Aadhaar files (encrypted) **Google Drive**-la save aagum.
App-ku **"drive.file"** permission mattum dhaan — indha app create panna files-ah mattum touch pannum,
Drive-la irukka mathha files-ah paakkavum mudiyaadhu.

### Step 1 — Google Cloud project (oru dhadava, ~10 min)
1. https://console.cloud.google.com → client-oda Google account-la login → **New Project** (e.g. "E-Service Agreements").
2. **APIs & Services → Library** → **Google Sheets API** → Enable. Apram **Google Drive API** → Enable.
3. **APIs & Services → OAuth consent screen** (Google Auth Platform):
   - User type: **External** → App name, support email fill pannunga.
   - Scopes: `.../auth/drive.file` add pannunga.
   - **Publishing status → "Publish app" (In production)** pannunga.
     ⚠️ "Testing" status-la vittaa, login token **7 naal-la expire** aagidum.
     (drive.file non-sensitive scope — Google verification theva illa.)
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Desktop app** → Create.
   - **Client ID** & **Client secret** copy pannunga.

### Step 2 — `.env`-la podunga (`server\.env`)
```
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxx
```

### Step 3 — Login & token (main folder-la)
```bash
npm run google:auth
```
Terminal-la oru link varum → browser-la open → **client-oda Google account**-la login → Allow.
Terminal-la varra `GOOGLE_REFRESH_TOKEN=...` line-ah `server\.env`-la podunga.

### Step 4 — Sheet & folder create
```bash
npm run google:setup
```
Varra lines-ah `server\.env`-la podunga:
```
GOOGLE_SHEET_ID=...
GOOGLE_DRIVE_FOLDER_ID=...
STORAGE=google
```

### Step 5 — Pazhaya local data copy (optional)
Already local-la test data / real data irundha:
```bash
npm run google:migrate
```
⚠️ Local-la `data\.dev-file-key` irundha, adhoda value-ah `FILE_ENCRYPTION_KEY=`-la podunga —
illana pazhaya Aadhaar files open aagaadhu.

### Step 6 — Restart
`npm run dev` (illa live server restart). `http://localhost:5000/api/health` → `"storage":"google"` nu varanum.

**Sheet-la enna irukkum:** `users`, `agreements`, `uploads`, `templates`, `documents`, `clauses`, `auditLogs` tabs.
Mudhal columns (name, mobile, rent, dates...) client paakka. **`data_1, data_2...` columns-ah edit pannaadheenga** —
adhu app-oda full data. Sheet & folder-ah **public-ah share pannave koodaadhu.**

---

## 3. 🌐 Live server-la deploy

Production-la **oru server** dhaan: Express server React build-ayum serve pannum (oru URL).

### Option A — Docker (Render / Railway / any VPS) ✅ easiest
`Dockerfile` ready-ah irukku (Chromium + Tamil fonts serthu — PDF-ku).

**Render.com:**
1. Code-ah GitHub-la push pannunga (`.env` push aagaadhu — `.gitignore`-la irukku).
2. Render → **New → Web Service** → repo select → Runtime: **Docker**.
3. **Environment variables** add pannunga:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | `https://your-app.onrender.com` (illa unga domain) |
   | `JWT_SECRET` | long random (generate command `.env.example`-la) |
   | `FILE_ENCRYPTION_KEY` | 64 hex chars (⚠️ backup!) |
   | `STORAGE` | `google` (recommended) + 5 GOOGLE_* values |
4. `STORAGE=local` use pannaa: **Disk** add pannunga → mount path `/app/server/data`, innoru disk `/app/server/storage`
   (illana redeploy-la data pogum). Google storage-na disk theva illa.
5. Deploy → open URL → Register → `create-admin` (Render Shell-la: `npm run create-admin -- you@example.com`).

**Any VPS with Docker:**
```bash
docker build -t e-service .
docker run -d --restart unless-stopped -p 5000:5000 --env-file server/.env \
  -v eservice-data:/app/server/data -v eservice-files:/app/server/storage e-service
```
Munnaadi **Nginx / Caddy** vechu HTTPS (Let's Encrypt) podunga.

### Option B — VPS without Docker (Ubuntu)
```bash
sudo apt install -y chromium fonts-noto-core     # PDF-ku
git clone <repo> e-service && cd e-service
npm install
npm run build
# server/.env: NODE_ENV=production, CLIENT_URL=https://your-domain.com, CHROME_PATH=/usr/bin/chromium ...
npm install -g pm2
pm2 start "npm start" --name e-service && pm2 save
```
Nginx-la `proxy_pass http://localhost:5000;` + HTTPS.

---

## 4. 🔒 Go-live security checklist

- [ ] `NODE_ENV=production` (weak `JWT_SECRET` irundha server start aagaadhu)
- [ ] **HTTPS** mattum (login cookie production-la HTTPS-la mattum dhaan pogum)
- [ ] `CLIENT_URL` = real website URL (vera sites-la irundhu requests block aagum)
- [ ] `FILE_ENCRYPTION_KEY` set panni **safe-ah backup** (password manager)
- [ ] Google Sheet / Drive folder **public share illa**
- [ ] Admin accounts strong password; theva illaadha admins remove
- [ ] Legal templates & standard clauses **client / lawyer approve** pannadhu mattum
- [ ] `npm test` → ellaam pass
- [ ] Backups: Google storage-na Google-e backup; local-na `server/data` + `server/storage` daily backup

**Already built-in security:** bcrypt passwords · httpOnly secure cookies · rate limits (login 10 / 15 min) ·
CSRF origin check · helmet security headers + CSP · input validation (frontend + backend) ·
editor HTML sanitizing (XSS) · real file-type check · AES-256-GCM encrypted Aadhaar files ·
Aadhaar last 4 digits only · owner/admin-only access · disabled accounts blocked instantly ·
admin activity log.

---

## 5. 🧪 Tests
```bash
npm test
```
11 automatic tests: login, templates, agreement flow, encrypted uploads, XSS cleaning, Word download,
admin access, client disable, CSRF block, Google Sheet/Drive storage logic.
