# Secure Quiz Asala (v3)

Secure online quiz platform for Alasala University — developed by Dr. Mohammed Al‑Shamrani.

## Features
- Per-question timer
- Single attempt per student
- Instructor approval before start (optional)
- Anti-cheat (auto-cancel on tab/app switch)
- Time window (start/end)
- Admin dashboard + CSV export
- Branding: Alasala logo + signature

## Run locally
```bash
npm install
ADMIN_KEY=asala2025 node server.js
# open http://localhost:3000/admin
```

## Deploy on Render
This repo contains `render.yaml`. Use:
https://render.com/deploy?repo=<your_repo_url>
