
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ENV
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_JWT_SECRET";
const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || ""; // e.g., alasala.edu.sa
const SIGNUP_CODE = process.env.SIGNUP_CODE || ""; // optional

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Users store
const USERS_PATH = path.join(__dirname, 'users.json');
function readUsers(){
  try { return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8')); }
  catch(e){ return []; }
}
function writeUsers(arr){
  fs.writeFileSync(USERS_PATH, JSON.stringify(arr, null, 2));
}
function makeTeacherId(email){
  return email.toLowerCase().replace(/@.*/, '').replace(/[^a-z0-9]+/g,'-').slice(0,24) || 'teacher';
}
function signToken(u){
  return jwt.sign({ email: u.email, name: u.name, teacherId: u.teacherId }, JWT_SECRET, { expiresIn: '12h' });
}
function authMiddleware(req, res, next){
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if(!token) return res.status(401).json({error:"No token"});
  try{ req.user = jwt.verify(token, JWT_SECRET); return next(); }
  catch(e){ return res.status(401).json({error:"Invalid token"}); }
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { email, name, password, signupCode } = req.body || {};
  if(!email || !password || !name) return res.status(400).json({error:"الاسم والبريد وكلمة المرور مطلوبة"});

  const em = String(email).trim().toLowerCase();
  if(ALLOWED_EMAIL_DOMAIN && !em.endsWith('@'+ALLOWED_EMAIL_DOMAIN)){
    return res.status(403).json({error:"التسجيل مسموح لبريد "+ALLOWED_EMAIL_DOMAIN+" فقط"});
  }
  if(SIGNUP_CODE && signupCode !== SIGNUP_CODE){
    return res.status(403).json({error:"رمز التسجيل غير صحيح"});
  }
  const users = readUsers();
  if(users.find(u => u.email.toLowerCase() === em)){
    return res.status(409).json({error:"هذا البريد مسجّل مسبقًا"});
  }
  const hash = await bcrypt.hash(String(password), 10);
  const user = { email: em, name: String(name).trim(), teacherId: makeTeacherId(em), passwordHash: hash };
  users.push(user); writeUsers(users);
  const token = signToken(user);
  res.json({ token, teacherId: user.teacherId, name: user.name });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const em = String(email||'').toLowerCase().trim();
  const users = readUsers();
  const user = users.find(u => u.email === em);
  if(!user) return res.status(401).json({error:"بيانات الدخول غير صحيحة"});
  const ok = await bcrypt.compare(String(password||''), user.passwordHash);
  if(!ok) return res.status(401).json({error:"بيانات الدخول غير صحيحة"});
  const token = signToken(user);
  res.json({ token, teacherId: user.teacherId, name: user.name });
});

// Helpers
function now(){ return Date.now(); }

// Create quiz (teacher auth required)
app.post('/api/quizzes', authMiddleware, (req, res) => {
  const {
    title, perQuestionSec = 60, questions,
    requireApproval = false, singleAttempt = true,
    courseName = "", courseCode = "", instructorName = "",
    examStart = null, examEnd = null
  } = req.body;

  if(!title || !Array.isArray(questions) || questions.length === 0){
    return res.status(400).json({error:"Invalid payload"});
  }
  for(const q of questions){
    if(!q.q || !Array.isArray(q.choices) || typeof q.correct !== 'number'){
      return res.status(400).json({error:"Invalid question format"});
    }
  }

  const db = readDB();
  const quizId = nanoid(8);
  db.quizzes[quizId] = {
    id: quizId, title, perQuestionSec, questions,
    requireApproval: !!requireApproval, singleAttempt: !!singleAttempt,
    courseName, courseCode, instructorName,
    examStart, examEnd, createdAt: now(),
    owner: req.user.teacherId
  };
  writeDB(db);
  res.json({ quizId, link: `/q/${quizId}` });
});

// Get quiz (public for students)
app.get('/api/quizzes/:id', (req, res) => {
  const db = readDB();
  const qz = db.quizzes[req.params.id];
  if(!qz) return res.status(404).json({error:"Not found"});
  const safe = qz.questions.map(q => ({ q: q.q, choices: q.choices }));
  res.json({
    id:qz.id, title:qz.title, perQuestionSec:qz.perQuestionSec, questions:safe,
    requireApproval:qz.requireApproval, singleAttempt:qz.singleAttempt,
    courseName:qz.courseName||"", courseCode:qz.courseCode||"", instructorName:qz.instructorName||"",
    examStart:qz.examStart||null, examEnd:qz.examEnd||null
  });
});

// Start attempt (public)
app.post('/api/quizzes/:id/attempts', (req, res) => {
  const { name } = req.body || {};
  if(!name || String(name).trim().length < 3) return res.status(400).json({error:"Name required"});

  const db = readDB();
  const qz = db.quizzes[req.params.id];
  if(!qz) return res.status(404).json({error:"Not found"});

  const nowTs = now();
  if(qz.examStart && nowTs < qz.examStart) return res.status(403).json({error:"Quiz not open yet"});
  if(qz.examEnd && nowTs > qz.examEnd) return res.status(403).json({error:"Quiz window has ended"});

  const nm = String(name).trim();
  if(qz.singleAttempt){
    for(const aid in db.attempts){
      const at = db.attempts[aid];
      if(at.quizId === qz.id && at.name.toLowerCase() === nm.toLowerCase() && at.finishedAt){
        return res.status(403).json({error:"You have already completed this quiz."});
      }
    }
  }
  const attemptId = nanoid(10);
  db.attempts[attemptId] = {
    id: attemptId, quizId: qz.id, name: nm,
    startedAt: nowTs, approved: qz.requireApproval ? false : true,
    cheated: false, finishedAt: null, score: null, answers: []
  };
  writeDB(db);
  res.json({ attemptId, approved: db.attempts[attemptId].approved });
});

// Poll attempt (public)
app.get('/api/attempts/:aid', (req, res) => {
  const db = readDB();
  const at = db.attempts[req.params.aid];
  if(!at) return res.status(404).json({error:"Attempt not found"});
  res.json({ approved: at.approved, cheated: at.cheated, finishedAt: at.finishedAt, score: at.score });
});

// Mark cheat (public)
app.post('/api/attempts/:aid/cheat', (req, res) => {
  const db = readDB();
  const at = db.attempts[req.params.aid];
  if(!at) return res.status(404).json({error:"Attempt not found"});
  at.cheated = true; writeDB(db);
  res.json({ ok:true });
});

// Submit attempt (public)
app.post('/api/attempts/:aid/submit', (req, res) => {
  const { answers } = req.body || {};
  const db = readDB();
  const at = db.attempts[req.params.aid];
  if(!at) return res.status(404).json({error:"Attempt not found"});
  if(at.finishedAt) return res.status(400).json({error:"Already submitted"});
  const qz = db.quizzes[at.quizId];
  if(!qz) return res.status(404).json({error:"Quiz not found"});
  const nowTs = now();
  if(qz.examStart && nowTs < qz.examStart) return res.status(403).json({error:"Quiz not open yet"});
  if(qz.examEnd && nowTs > qz.examEnd) return res.status(403).json({error:"Quiz window has ended"});
  if(qz.requireApproval && !at.approved) return res.status(403).json({error:"Attempt not approved"});

  let score = 0;
  (answers || []).forEach((sel, i) => {
    const q = qz.questions[i];
    if(q && Number.isInteger(sel) && sel === q.correct) score++;
  });
  at.finishedAt = nowTs; at.answers = Array.isArray(answers) ? answers : []; at.score = score;
  writeDB(db);
  if(at.cheated){
    return res.json({ status:"cancelled", message:"تم إلغاء المحاولة بسبب محاولات الغش/الخروج.", score:0, total:qz.questions.length });
  }
  res.json({ status:"ok", score, total:qz.questions.length });
});

// Admin: list attempts (owned)
app.get('/api/quizzes/:id/attempts', authMiddleware, (req,res) => {
  const db = readDB();
  const qz = db.quizzes[req.params.id];
  if(!qz) return res.status(404).json({error:"Not found"});
  if(qz.owner !== req.user.teacherId) return res.status(403).json({error:"Forbidden"});
  res.json(Object.values(db.attempts).filter(a => a.quizId === qz.id));
});

// Admin: approve attempt (owned)
app.post('/api/attempts/:aid/approve', authMiddleware, (req,res) => {
  const db = readDB();
  const at = db.attempts[req.params.aid];
  if(!at) return res.status(404).json({error:"Attempt not found"});
  const qz = db.quizzes[at.quizId];
  if(!qz || qz.owner !== req.user.teacherId) return res.status(403).json({error:"Forbidden"});
  at.approved = true; writeDB(db);
  res.json({ ok:true });
});

// Admin: CSV (owned)
app.get('/api/quizzes/:id/results.csv', authMiddleware, (req,res) => {
  const db = readDB();
  const qz = db.quizzes[req.params.id];
  if(!qz) return res.status(404).send('Not found');
  if(qz.owner !== req.user.teacherId) return res.status(403).send('Forbidden');
  const rows = [['name','score','total','startedAt','finishedAt','cheated','approved','attemptId']];
  Object.values(db.attempts).forEach(at => {
    if(at.quizId !== qz.id) return;
    rows.push([
      at.name,
      at.score==null?'':at.score,
      qz.questions.length,
      new Date(at.startedAt).toISOString(),
      at.finishedAt?new Date(at.finishedAt).toISOString():'',
      at.cheated?'yes':'no',
      at.approved?'yes':'no',
      at.id
    ]);
  });
  const out = rows.map(r=>r.join(',')).join('\\n');
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.send(out);
});

// Pages
app.get('/', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'home.html')));
app.get('/q/:id', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'take.html')));
app.get('/admin', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, ()=> console.log(`Asala Secure Quiz v3.1 on :${PORT}`));
