
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { nanoid } = require('nanoid');
const { readDB, writeDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "CHANGE_ME_SECRET";

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

function assertAdmin(req, res, next){
  const key = req.headers['x-admin-key'] || req.query.key;
  if(key !== ADMIN_KEY) return res.status(401).json({error:"Unauthorized"});
  next();
}

function now(){ return Date.now(); }

app.post('/api/quizzes', assertAdmin, (req, res) => {
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
    examStart, examEnd, createdAt: now()
  };
  writeDB(db);
  res.json({ quizId, link: `/q/${quizId}` });
});

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

app.get('/api/attempts/:aid', (req, res) => {
  const db = readDB();
  const at = db.attempts[req.params.aid];
  if(!at) return res.status(404).json({error:"Attempt not found"});
  res.json({ approved: at.approved, cheated: at.cheated, finishedAt: at.finishedAt, score: at.score });
});

app.post('/api/attempts/:aid/cheat', (req, res) => {
  const db = readDB();
  const at = db.attempts[req.params.aid];
  if(!at) return res.status(404).json({error:"Attempt not found"});
  at.cheated = true; writeDB(db);
  res.json({ ok:true });
});

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

app.get('/api/quizzes/:id/attempts', assertAdmin, (req,res) => {
  const db = readDB();
  const qz = db.quizzes[req.params.id];
  if(!qz) return res.status(404).json({error:"Not found"});
  res.json(Object.values(db.attempts).filter(a => a.quizId === qz.id));
});

app.post('/api/attempts/:aid/approve', assertAdmin, (req,res) => {
  const db = readDB();
  const at = db.attempts[req.params.aid];
  if(!at) return res.status(404).json({error:"Attempt not found"});
  at.approved = true; writeDB(db);
  res.json({ ok:true });
});

app.get('/api/quizzes/:id/results.csv', assertAdmin, (req,res) => {
  const db = readDB();
  const qz = db.quizzes[req.params.id];
  if(!qz) return res.status(404).send('Not found');
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
  const out = rows.map(r=>r.join(',')).join('\n');
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.send(out);
});

app.get('/q/:id', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'take.html')));
app.get('/admin', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, ()=> console.log(`Asala Secure Quiz v3 on :${PORT}`));
