# Secure Quiz Asala (v3.1)
Multi-teacher accounts (self-serve), JWT auth, per-question timer, approval flow, single attempt, time window, dashboard, CSV.

## Environment
- JWT_SECRET (required)
- ALLOWED_EMAIL_DOMAIN (optional, e.g. alasala.edu.sa)
- SIGNUP_CODE (optional)

## Run
npm install
JWT_SECRET=dev node server.js
