
// إعداد بريد الأدمن
const ADMIN_EMAIL = "mohammad.alshamrani@alasala.edu.sa"; // ← ضع بريد الأدمن هنا

// زر الرجوع
window.goBack = function(){
  if (history.length > 1) history.back();
  else window.location.href = 'index.html';
};

// جعل الشعار/العنوان يعيدان للصفحة الرئيسية إذا لم يكونا <a>
document.addEventListener('click', (e)=>{
  const t = e.target.closest('.brand, .logo, .site-title');
  if(t && !t.closest('a')) window.location.href = 'index.html';
});

// Splash
document.addEventListener('DOMContentLoaded', function(){
  document.body.classList.add('splash-active');
  const splash = document.getElementById('splash');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DURATION = 4000;
  const timeout = prefersReduced ? 10 : DURATION;
  setTimeout(()=>{
    splash.classList.add('hide');
    setTimeout(()=>{ splash.remove(); document.body.classList.remove('splash-active'); }, prefersReduced?0:650);
  }, timeout);
});

// EmailJS Integration (اختياري)
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
function canUseEmailJS(){return EMAILJS_SERVICE_ID!=='YOUR_SERVICE_ID'&&EMAILJS_TEMPLATE_ID!=='YOUR_TEMPLATE_ID'&&EMAILJS_PUBLIC_KEY!=='YOUR_PUBLIC_KEY';}
async function ensureEmailJS(){
  if(!canUseEmailJS()) return false;
  if(!window.emailjs){
    await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});
  }
  if(window.emailjs && !window.emailjs.__inited){window.emailjs.init(EMAILJS_PUBLIC_KEY);window.emailjs.__inited=true;}
  return !!window.emailjs;
}
async function sendEmail(to, subject, message){
  if(await ensureEmailJS()){
    try{ await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {to_email:to,subject,message}); return {ok:true, via:'emailjs'}; }
    catch(e){ console.warn('EmailJS failed', e); }
  }
  try{ window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`; return {ok:true, via:'mailto'}; }
  catch(e){ return {ok:false}; }
}

// Complaints local store (بديل مؤقت)
function saveComplaintLocally(obj){
  try{ const key='asala_complaints'; const arr=JSON.parse(localStorage.getItem(key)||'[]'); arr.unshift({...obj,savedAt:new Date().toISOString()}); localStorage.setItem(key, JSON.stringify(arr)); }catch(e){}
}
function loadComplaintsLocally(){ try{return JSON.parse(localStorage.getItem('asala_complaints')||'[]');}catch(e){return [];} }
