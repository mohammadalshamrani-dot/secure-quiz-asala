
const ADMIN_EMAIL = "mohammad.alshamrani@alasala.edu.sa";
const EMAILJS_SERVICE_ID = ""; const EMAILJS_TEMPLATE_ID = ""; const EMAILJS_PUBLIC_KEY = "";
window.goBack=function(){ if(history.length>1) history.back(); else location.href='index.html'; };
document.addEventListener('click',(e)=>{const t=e.target.closest('.brand,.logo,.site-title'); if(t && !t.closest('a')) location.href='index.html';});

const UKEY='asala_users', QKEY='asala_quizzes', RKEY='asala_results', REQKEY='asala_requests';
function loadJSON(k,def){ try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(def));}catch(e){return def;} }
function saveJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function uid(){ return Math.random().toString(36).slice(2,10); }

(function seed(){
  const users = loadJSON(UKEY, []);
  if(!users.length){
    users.push({id:'admin', role:'admin', name:'مسؤول المنصة', email:'mohammad.alshamrani@alasala.edu.sa', password:'AaBbCc123', createdAt:new Date().toISOString()});
    users.push({id:'fac1', role:'faculty', name:'عضو هيئة تجريبي', email:'faculty.demo@alasala.edu.sa', dept:'القانون', createdAt:new Date().toISOString()});
    saveJSON(UKEY, users);
  }
})();

function listUsers(){ return loadJSON(UKEY, []); }
function getUserByEmail(e){ return listUsers().find(x=>x.email===e); }
function getUserById(id){ return listUsers().find(x=>x.id===id); }
function upsertUser(u){ const a=listUsers(); const i=a.findIndex(x=>x.id===u.id); if(i>=0)a[i]={...a[i],...u}; else a.push(u); saveJSON(UKEY,a); return u; }
function setUserPassword(id,p){ const a=listUsers(); const i=a.findIndex(x=>x.id===id); if(i>=0){ a[i].password=p; a[i].pwdSetAt=new Date().toISOString(); saveJSON(UKEY,a); return true;} return false; }

function listRequests(){ return loadJSON(REQKEY, []); }
function addRequest(obj){ const a=listRequests(); const rec={...obj,id:'r_'+uid(),createdAt:new Date().toISOString()}; a.unshift(rec); saveJSON(REQKEY,a); return rec; }

function listQuizzes(){ return loadJSON(QKEY, []); }
function saveQuiz(q){ const a=listQuizzes(); const i=a.findIndex(x=>x.id===q.id); if(i>=0)a[i]={...a[i],...q}; else a.push(q); saveJSON(QKEY,a); return q; }
function listResults(){ return loadJSON(RKEY, []); }
function saveResult(r){ const a=listResults(); const i=a.findIndex(x=>x.id===r.id); if(i>=0)a[i]={...a[i],...r}; else a.push(r); saveJSON(RKEY,a); return r; }

async function ensureEmailJS(){ if(!(EMAILJS_SERVICE_ID&&EMAILJS_TEMPLATE_ID&&EMAILJS_PUBLIC_KEY))return false; if(!window.emailjs){await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});} if(window.emailjs&&!window.emailjs.__inited){window.emailjs.init(EMAILJS_PUBLIC_KEY);window.emailjs.__inited=true;} return !!window.emailjs; }
async function sendEmail(to,subject,message){ if(await ensureEmailJS()){ try{await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {to_email:to,email:to,subject,message}); return {ok:true};}catch(e){console.warn(e);} } return {ok:false}; }

// ===== Quiz runtime helpers =====
const ATTKEY='asala_attempts';
function listAttempts(){ return loadJSON(ATTKEY, []); }
function saveAttempt(a){ const arr=listAttempts(); arr.push(a); saveJSON(ATTKEY, arr); return a; }

function scoreSubmission(quiz, answers){
  // returns {score, total, details:[{qid,correct}]}
  let correct=0, total=quiz.questions.length, details=[];
  for(const q of quiz.questions){
    const user = answers[q.id];
    let ok=false;
    if(q.type==='mcq'){
      ok = String(user||'').trim() === String(q.answer||'').trim();
    }else if(q.type==='tf'){
      ok = String(user||'').toLowerCase() === String(q.answer||'').toLowerCase();
    }else if(q.type==='short'){
      ok = (String(user||'').trim().toLowerCase() === String(q.answer||'').trim().toLowerCase());
    }
    if(ok) correct++;
    details.push({qid:q.id, correct:ok});
  }
  return {score:correct, total, details};
}

// Unified back button injection
document.addEventListener('DOMContentLoaded', function(){
  if(!document.querySelector('.btn-back-fixed')){
    const btn = document.createElement('button');
    btn.className='btn-back-fixed';
    btn.textContent='↩︎ رجوع';
    btn.onclick = ()=>{ if(history.length>1) history.back(); else location.href='index.html'; };
    document.body.appendChild(btn);
  }
});
