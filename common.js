
/*! common.js — Patch v2.3
 * يحافظ على نفس API العام للمنصة القديمة، ويضيف:
 *  - TTL للنتائج (24 ساعة) مع تنظيف تلقائي.
 *  - دعم اختياري للربط مع خادم (POST /api/submit, GET /api/results).
*/

// ========= إعدادات قابلة للتفعيل لاحقًا =========
const USE_BACKEND = false; // اجعلها true إذا أردت التخاطب مع الخادم
function API_BASE() {
  const meta = document.querySelector('meta[name="api-base"]');
  return (meta && meta.content) ? meta.content.trim().replace(/\/+$/, '') : "";
}

// ========= أدوات عامّة =========
const ADMIN_EMAIL = "mohammad.alshamrani@alasala.edu.sa";
const EMAILJS_SERVICE_ID = ""; const EMAILJS_TEMPLATE_ID = ""; const EMAILJS_PUBLIC_KEY = "";
window.goBack=function(){ if(history.length>1) history.back(); else location.href='index.html'; };
document.addEventListener('click',(e)=>{const t=e.target.closest('.brand,.logo,.site-title'); if(t && !t.closest('a')) location.href='index.html';});

const UKEY='asala_users', QKEY='asala_quizzes', RKEY='asala_results', REQKEY='asala_requests';
function loadJSON(k,def){ try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(def));}catch(e){return def;} }
function saveJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function uid(){ return Math.random().toString(36).slice(2,10); }
function now(){ return Date.now(); }
const DAY_MS = 24*60*60*1000;

// ========= Seed مبدئي للمستخدمين =========
(function seed(){
  const users = loadJSON(UKEY, []);
  if(!users.length){
    users.push({id:'admin', role:'admin', name:'مسؤول المنصة', email:'mohammad.alshamrani@alasala.edu.sa', password:'AaBbCc123', createdAt:new Date().toISOString()});
    users.push({id:'fac1', role:'faculty', name:'عضو هيئة تجريبي', email:'faculty.demo@alasala.edu.sa', dept:'القانون', createdAt:new Date().toISOString()});
    saveJSON(UKEY, users);
  }
})();

// ========= إدارة المستخدمين =========
function listUsers(){ return loadJSON(UKEY, []); }
function getUserByEmail(e){ return listUsers().find(x=>x.email===e); }
function getUserById(id){ return listUsers().find(x=>x.id===id); }
function upsertUser(u){ const a=listUsers(); const i=a.findIndex(x=>x.id===u.id); if(i>=0)a[i]={...a[i],...u}; else a.push(u); saveJSON(UKEY,a); return u; }
function setUserPassword(id,p){ const a=listUsers(); const i=a.findIndex(x=>x.id===id); if(i>=0){ a[i].password=p; a[i].pwdSetAt=new Date().toISOString(); saveJSON(UKEY,a); return true;} return false; }

// ========= الطلبات =========
function listRequests(){ return loadJSON(REQKEY, []); }
function addRequest(obj){ const a=listRequests(); const rec={...obj,id:'r_'+uid(),createdAt:new Date().toISOString()}; a.unshift(rec); saveJSON(REQKEY,a); return rec; }

// ========= الاختبارات =========
function listQuizzes(){ return loadJSON(QKEY, []); }
function saveQuiz(q){ const a=listQuizzes(); const i=a.findIndex(x=>x.id===q.id); if(i>=0)a[i]={...a[i],...q}; else a.push(q); saveJSON(QKEY,a); return q; }

// ========= النتائج — TTL 24 ساعة =========
function purgeExpiredResults(records){
  const fresh = (records||[]).filter(r => !r.expiresAt || r.expiresAt > now());
  if (fresh.length !== (records||[]).length) saveJSON(RKEY, fresh);
  return fresh;
}
function listResults(){
  const arr = loadJSON(RKEY, []);
  return purgeExpiredResults(arr);
}
function saveResult(r){
  const rec = { ...r };
  if (!rec.expiresAt) rec.expiresAt = now() + DAY_MS; // TTL يوم واحد
  const a = loadJSON(RKEY, []);
  const i = a.findIndex(x=>x.id===rec.id);
  if(i>=0) a[i] = { ...a[i], ...rec };
  else a.push(rec);
  // تنظيف قبل الحفظ وبعده
  const fresh = purgeExpiredResults(a);
  saveJSON(RKEY, fresh);
  return rec;
}

// ========= إرسال واسترجاع النتائج (اختياري عبر خادم) =========
async function apiRequest(path, opts={}){
  const base = API_BASE(); if(!base) throw new Error("API base not set");
  const url = base + path;
  const res = await fetch(url, {
    method: opts.method||'GET',
    headers: Object.assign({'Content-Type':'application/json'}, opts.headers||{}),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include'
  });
  const ct = res.headers.get('content-type')||'';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if(!res.ok) throw new Error((data && (data.message||data.error)) || 'HTTP '+res.status);
  return data;
}

// يُستدعى عند تسليم الطالب
async function submitResultBackend(payload){
  if(!USE_BACKEND) return { ok:false };
  try{
    const data = await apiRequest('/api/submit', { method:'POST', body: payload });
    return { ok:true, data };
  }catch(e){ console.warn('submit backend failed', e); return { ok:false }; }
}

// يُستدعى عند عرض النتائج للمدرّس
async function fetchResultsBackend(quizId){
  if(!USE_BACKEND) return null;
  try{
    const data = await apiRequest('/api/results?quiz='+encodeURIComponent(quizId), { method:'GET' });
    return data || null;
  }catch(e){ console.warn('fetch backend failed', e); return null; }
}

// ========= التقييم =========
function scoreSubmission(quiz, answers){
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

// ========= زر الرجوع الثابت =========
document.addEventListener('DOMContentLoaded', function(){
  if(!document.querySelector('.btn-back-fixed')){
    const btn = document.createElement('button');
    btn.className='btn-back-fixed';
    btn.textContent='↩︎ رجوع';
    btn.onclick = ()=>{ if(history.length>1) history.back(); else location.href='index.html'; };
    document.body.appendChild(btn);
  }
});

// ========= Export to window =========
window.listUsers = listUsers;
window.getUserByEmail = getUserByEmail;
window.getUserById = getUserById;
window.upsertUser = upsertUser;
window.setUserPassword = setUserPassword;
window.listRequests = listRequests;
window.addRequest = addRequest;
window.listQuizzes = listQuizzes;
window.saveQuiz = saveQuiz;
window.listResults = listResults;
window.saveResult = saveResult;
window.scoreSubmission = scoreSubmission;
window.submitResultBackend = submitResultBackend;
window.fetchResultsBackend = fetchResultsBackend;
