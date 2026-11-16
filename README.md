# E-Service Rental Agreement Builder

Online platform to create, customize and download rental agreements (Word / PDF).

## Structure

```
E-service/
├── client/           → React frontend (Vite + Tailwind + TipTap editor)
├── server/           → Node.js + Express backend
│   ├── templates-docx/   → Word templates (.docx) — client templates inga podalaam
│   └── test/             → Automatic tests
├── shared/           → Client & server rendum use pannura code (placeholders, terms, document design CSS)
├── Dockerfile        → Live server deploy
├── DEPLOYMENT.md     → Admin, Google Sheet, deploy, security — step by step
└── package.json      → Main folder commands
```

## ▶️ Daily use — main folder (E:\E-service) la irundhe

```bash
npm install     # pudhu packages vandhaa (server + client rendukkum)
npm run dev     # backend (5000) + frontend (5173) — ORE terminal
```

Open: http://localhost:5173 · Stop: **Ctrl + C** (keyboard-la press)

| Command | Enna pannum |
|---|---|
| `npm run dev` | Development start |
| `npm test` | Automatic tests (11) |
| `npm run create-admin -- you@example.com` | Registered user-ah admin aakkum |
| `npm run import-templates` | `server/templates-docx/` Word files-ah thirumba import |
| `npm run google:auth` / `google:setup` / `google:migrate` | Google Sheet setup (DEPLOYMENT.md) |
| `npm run build` + `npm start` | Production (live) mode |

## Features

- Register / Login (secure cookies), client dashboard with saved agreements
- 7-step wizard: Template → Details → Documents → Terms → Customize → Preview → Download
- 4 designed templates (Classic, Modern, Corporate, Elegant) + admin can add more Word templates
- Encrypted Aadhaar uploads (AES-256), last-4-digits only
- Word-like editor with locked auto-filled details
- PDF & Word download matching the preview exactly
- Admin dashboard: stats, clients (enable/disable/admin), agreements, documents, templates, standard clauses, activity log
- Storage: local files **or** Google Sheet + Google Drive (`STORAGE=google`)

## Progress

- [x] Phase 1–12 — Architecture → Word & PDF download
- [x] Phase 13 — Backend APIs
- [x] Phase 14 — Database: Google Sheet + Drive (or local)
- [x] Phase 15 — Admin dashboard
- [x] Phase 16 — Security & validation
- [x] Phase 17 — Tests & deployment (see DEPLOYMENT.md)
