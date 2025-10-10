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
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME";

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'public')));

// Users
const USERS_PATH = path.join(__dirname,'users.json');
function readUsers(){ try{ return JSON.parse(fs.readFileSync(USERS_PATH,'utf8')); }catch(e){ return []; } }
function writeUsers(arr){ fs.writeFileSync(USERS_PATH, JSON.stringify(arr,null,2)); }
function sign(u){ return jwt.sign({email:u.email,name:u.name,teacherId:u.teacherId}, JWT_SECRET, {expiresIn:'12h'}); }
function auth(req,res,next){
  const h=req.headers.authorization||''; const t=h.startsWith('Bearer ')?h.slice(7):null;
  if(!t) return res.status(401).json({error:'No token'});
  try{ req.user=jwt.verify(t,JWT_SECRET); next(); }catch{ res.status(401).json({error:'Invalid token'}); }
}
app.post('/api/auth/register', async (req,res)=>{
  const {email,name,password}=req.body||{};
  if(!email||!name||!password) return res.status(400).json({error:'الاسم والبريد وكلمة المرور مطلوبة'});
  const users=readUsers(); if(users.some(u=>u.email===email)) return res.status(409).json({error:'هذا البريد مسجّل مسبقًا'});
  const hash=await bcrypt.hash(String(password),10);
  const teacherId=(email.split('@')[0]||'teacher').replace(/[^a-z0-9]+/gi,'-').slice(0,24);
  const u={email:email.toLowerCase(), name, passwordHash:hash, teacherId};
  users.push(u); writeUsers(users);
  return res.json({token:sign(u), teacherId, name:u.name});
});
app.post('/api/auth/login', async (req,res)=>{
  const {email,password}=req.body||{}; const users=readUsers();
  const u=users.find(x=>x.email===(email||'').toLowerCase()); if(!u) return res.status(401).json({error:'بيانات الدخول غير صحيحة'});
  const ok=await bcrypt.compare(String(password||''),u.passwordHash); if(!ok) return res.status(401).json({error:'بيانات الدخول غير صحيحة'});
  return res.json({token:sign(u), teacherId:u.teacherId, name:u.name});
});

// Create quiz
app.post('/api/quizzes', auth, (req,res)=>{
  const { title, perQuestionSec=60, questions, requireApproval=false, singleAttempt=true, courseName="", courseCode="", instructorName="", examStart=null } = req.body||{};
  if(!title || !Array.isArray(questions) || !questions.length) return res.status(400).json({error:'Invalid payload'});
  for(const q of questions){ if(!q.q || !Array.isArray(q.choices) || typeof q.correct!=='number') return res.status(400).json({error:'Invalid question item'}); }
  const db=readDB(); const id=nanoid(8);
  db.quizzes[id]={ id, title, perQuestionSec, questions, requireApproval:!!requireApproval, singleAttempt:!!singleAttempt, courseName, courseCode, instructorName, examStart, createdAt:Date.now(), owner:req.user.teacherId };
  writeDB(db); res.json({quizId:id, link:'/q/'+id});
});

// List quizzes for catalog
app.get('/api/quizzes',(req,res)=>{
  const db=readDB(); const now=Date.now();
  const items=Object.values(db.quizzes).filter(q=>!q.examStart || now>=q.examStart).map(q=>({
    id:q.id, title:q.title, courseName:q.courseName||'', courseCode:q.courseCode||'', instructorName:q.instructorName||'',
    perQuestionSec:q.perQuestionSec, questionCount:q.questions.length, requireApproval:!!q.requireApproval, singleAttempt:!!q.singleAttempt, examStart:q.examStart||null, createdAt:q.createdAt
  })).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  res.json(items);
});

// Get quiz (safe for students)
app.get('/api/quizzes/:id',(req,res)=>{
  const db=readDB(); const q=db.quizzes[req.params.id]; if(!q) return res.status(404).json({error:'Not found'});
  res.json({ id:q.id, title:q.title, perQuestionSec:q.perQuestionSec, questions:q.questions.map(x=>({q:x.q, choices:x.choices})), requireApproval:q.requireApproval, singleAttempt:q.singleAttempt, courseName:q.courseName||"", courseCode:q.courseCode||"", instructorName:q.instructorName||"", examStart:q.examStart||null });
});

// Attempts
app.post('/api/quizzes/:id/attempts',(req,res)=>{
  const {name}=req.body||{}; if(!name || String(name).trim().length<3) return res.status(400).json({error:'Name required'});
  const db=readDB(); const q=db.quizzes[req.params.id]; if(!q) return res.status(404).json({error:'Not found'});
  const id=nanoid(10);
  db.attempts[id]={ id, quizId:q.id, name:String(name).trim(), startedAt:Date.now(), approved:q.requireApproval?false:true, cheated:false, finishedAt:null, score:null, answers:[] };
  writeDB(db); res.json({attemptId:id, approved:db.attempts[id].approved});
});
app.get('/api/attempts/:aid',(req,res)=>{
  const db=readDB(); const a=db.attempts[req.params.aid]; if(!a) return res.status(404).json({error:'Attempt not found'});
  res.json({approved:a.approved, cheated:a.cheated, finishedAt:a.finishedAt, score:a.score});
});
app.post('/api/attempts/:aid/cheat',(req,res)=>{ const db=readDB(); const a=db.attempts[req.params.aid]; if(!a) return res.status(404).json({error:'Attempt not found'}); a.cheated=true; writeDB(db); res.json({ok:true}); });
app.post('/api/attempts/:aid/submit',(req,res)=>{
  const {answers}=req.body||{}; const db=readDB(); const a=db.attempts[req.params.aid]; if(!a) return res.status(404).json({error:'Attempt not found'});
  if(a.finishedAt) return res.status(400).json({error:'Already submitted'}); const q=db.quizzes[a.quizId]; if(!q) return res.status(404).json({error:'Quiz not found'});
  let score=0; (answers||[]).forEach((sel,i)=>{ const qq=q.questions[i]; if(qq && Number.isInteger(sel) && sel===qq.correct) score++; });
  a.finishedAt=Date.now(); a.answers=Array.isArray(answers)?answers:[]; a.score=score; writeDB(db);
  if(a.cheated) return res.json({status:'cancelled', message:'تم إلغاء المحاولة بسبب الخروج/الغش.', score:0, total:q.questions.length});
  res.json({status:'ok', score, total:q.questions.length});
});

// Simple CSV (owner auth omitted in compact build)
app.get('/api/quizzes/:id/results.csv',(req,res)=>{
  const db=readDB(); const q=db.quizzes[req.params.id]; if(!q) return res.status(404).send('Not found');
  const rows=[['name','score','total','startedAt','finishedAt','cheated','approved','attemptId']];
  Object.values(db.attempts).forEach(a=>{ if(a.quizId!==q.id) return; rows.push([a.name,a.score==null?'':a.score,q.questions.length,new Date(a.startedAt).toISOString(),a.finishedAt?new Date(a.finishedAt).toISOString():'',a.cheated?'yes':'no',a.approved?'yes':'no',a.id]); });
  res.set('Content-Type','text/csv; charset=utf-8'); res.send(rows.map(r=>r.join(',')).join('\\n'));
});

// Pages
app.get('/',(_,res)=>res.sendFile(path.join(__dirname,'public','home.html')));
app.get('/catalog',(_,res)=>res.sendFile(path.join(__dirname,'public','catalog.html')));
app.get('/q/:id',(_,res)=>res.sendFile(path.join(__dirname,'public','take.html')));
app.get('/admin',(_,res)=>res.sendFile(path.join(__dirname,'public','index.html')));

app.listen(PORT,()=>console.log('Asala v3.3 listening on',PORT));