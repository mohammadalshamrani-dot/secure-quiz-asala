
// ===== Configuration (embedded) =====
const ADMIN_EMAIL = "mhd-1407@hotmail.com";
const EMAILJS_SERVICE_ID = "service_74mxmoa";
const EMAILJS_TEMPLATE_ID = "template_xv8x4ju";
const EMAILJS_PUBLIC_KEY = "MUdZZODORkGM7TCd7";

// ===== Navigation helpers =====
window.goBack = function(){ if(history.length>1) history.back(); else location.href='index.html'; };

document.addEventListener('click',(e)=>{
  const t = e.target.closest('.brand, .logo, .site-title');
  if(t && !t.closest('a')) location.href = 'index.html';
});

// ===== Splash =====
document.addEventListener('DOMContentLoaded', function(){
  const splash = document.getElementById('splash');
  if(!splash) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(()=>{
    splash.classList.add('hide');
    setTimeout(()=> splash.remove(), prefersReduced?0:650);
  }, prefersReduced?10:4000);
});

// ===== EmailJS Integration =====
function canUseEmailJS(){
  return EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY &&
         EMAILJS_SERVICE_ID.startsWith('service_') && EMAILJS_TEMPLATE_ID.startsWith('template_');
}

async function ensureEmailJS(){
  if(!canUseEmailJS()) return false;
  if(!window.emailjs){
    await new Promise((res,rej)=>{
      const s = document.createElement('script');
      s.src = "https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js";
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  if(window.emailjs && !window.emailjs.__inited){
    window.emailjs.init(EMAILJS_PUBLIC_KEY);
    window.emailjs.__inited = true;
  }
  return !!window.emailjs;
}

async function sendEmail(to, subject, message, extras={}){
  if(await ensureEmailJS()){
    try{
      const resp = await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: to,
        email: to,
        user_email: to,
        reply_to: to,
        subject: subject,
        message: message
      });
      return {ok:true, via:"emailjs", resp};
    }catch(e){ console.warn("EmailJS failed", e); return {ok:false, via:"emailjs", error: e?.text || e?.message || String(e)}; }
  }
  try{
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    return {ok:true, via:"mailto"}; // fallback mailto
  }catch(e){ return {ok:false, error: String(e)}; }
}

// Complaints local store
function saveComplaintLocally(obj){
  try{ const k='asala_complaints'; const a=JSON.parse(localStorage.getItem(k)||'[]'); a.unshift({...obj,savedAt:new Date().toISOString()}); localStorage.setItem(k, JSON.stringify(a)); }catch(e){}
}
function loadComplaintsLocally(){ try{return JSON.parse(localStorage.getItem('asala_complaints')||'[]');}catch(e){return [];} }

// Status for settings page
window.getEmailConfigStatus = function(){ return {admin:ADMIN_EMAIL, service:EMAILJS_SERVICE_ID, template:EMAILJS_TEMPLATE_ID, publicKey:EMAILJS_PUBLIC_KEY, ready:canUseEmailJS()}; };

// ===== Local Admin Auth (fallback for static hosting) =====
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD_DEFAULT = "AaBbCc123";

function getAdminPassword() {
  try { return localStorage.getItem('asala_admin_pwd') || ADMIN_PASSWORD_DEFAULT; } catch(e) { return ADMIN_PASSWORD_DEFAULT; }
}
function setAdminPassword(p) {
  try { localStorage.setItem('asala_admin_pwd', p); } catch(e) { /*ignore*/ }
}
window.__asala_auth = {
  adminUser: ADMIN_USERNAME,
  getAdminPassword,
  setAdminPassword,
  adminEmail: ADMIN_EMAIL
};
