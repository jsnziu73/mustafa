# مِعيار | اختبار القدرات العقلية

An Arabic, right-to-left mental-ability assessment for gifted schools. The assessment works without external AI or email accounts; those integrations are optional.

## Requirements

- Node.js 20.6 or newer
- npm

## Run locally

```sh
npm install
npm start
```

Open the Vite address printed in the terminal (normally http://localhost:5173). The Node API runs on port 3001, and Vite proxies `/api` requests to it. SQLite creates its database at `backend/data/results.sqlite` on first run.

To run either process separately, use `npm run server` and `npm run dev` in two terminals.

## Optional integrations

Copy `backend/.env.example` to `backend/.env` and fill in the credentials:

- `GEMINI_API_KEY` enables personalized Arabic feedback through Gemini. If unset or unavailable, the app generates a local feedback summary from the skill scores.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optionally `SMTP_SECURE` and `MAIL_FROM` enable result email. Until configured, results remain available on the result page and the app clearly indicates that email was not sent.

Keep `.env` private and do not commit real credentials. The assessment score is computed by the server; the answer key is not returned by the questions endpoint. This sample test is for learning and self-exploration, not an official IQ test or diagnosis.