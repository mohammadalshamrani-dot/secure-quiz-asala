import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Open CORS (or set CORS_ORIGIN env later)
app.use(cors({ origin: (o, cb) => cb(null, true) }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.get('/api/quiz/:id', (req, res) => {
  const id = req.params.id;
  const filePath = path.join(__dirname, 'data', 'quizzes', `${id}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return res.json({ id, ...data });
    } catch {
      return res.status(500).json({ error: 'Failed to read quiz file' });
    }
  }
  return res.json({
    id,
    title: "Quiz is available",
    active: true,
    message: "Public restore mode (no token/JWT, no Supabase)."
  });
});

app.post('/api/results', (req, res) => {
  const resultsFile = path.join(__dirname, 'data', 'results.json');
  let existing = [];
  if (fs.existsSync(resultsFile)) {
    try { existing = JSON.parse(fs.readFileSync(resultsFile, 'utf-8')); } catch {}
  }
  existing.push({ ...(req.body || {}), receivedAt: new Date().toISOString() });
  fs.writeFileSync(resultsFile, JSON.stringify(existing, null, 2));
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.type('text').send('Secure Quiz Asala API (public mode). Endpoints: /api/health, /api/quiz/:id, POST /api/results');
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log('API listening on', port));
// ✅ دعم /api/quiz?id=ID (توافق مع الروابط الحالية)
app.get('/api/quiz', (req, res) => {
  const id = (req.query.id || '').toString().trim();
  if (!id) return res.status(400).json({ ok:false, error:'missing_id' });
  return res.redirect(302, `/api/quiz/${encodeURIComponent(id)}`);
});
