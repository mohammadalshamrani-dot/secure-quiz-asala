
// Storage keys
const ADMIN_KEY='asala_admin_auth';
const INBOX_KEY='asala_inbox_messages';

function load(key){ try{ return JSON.parse(localStorage.getItem(key)) || {}; }catch(e){ return {}; } }
function save(key,data){ localStorage.setItem(key, JSON.stringify(data)); }

function uid(){
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

// Admin
function getAdmin(){
  const a = load(ADMIN_KEY);
  if(!a.username){ a.username='admin'; a.password='AaBbCc123'; save(ADMIN_KEY,a); }
  return a;
}
function adminLogin(u,p){ const a = getAdmin(); return (u===a.username && p===a.password); }
function adminChangePassword(np){ const a = getAdmin(); a.password=np; save(ADMIN_KEY,a); }

// Inbox
function submitContact(payload){
  const box = load(INBOX_KEY);
  if(!box.messages) box.messages = [];
  payload.id = uid();
  payload.status = 'new';
  payload.createdAt = new Date().toISOString();
  box.messages.unshift(payload);
  save(INBOX_KEY, box);
  return payload.id;
}
function listInbox(){ const b = load(INBOX_KEY); return b.messages||[]; }
function setMessageStatus(id, status){
  const b = load(INBOX_KEY); b.messages=(b.messages||[]).map(m=>m.id===id?{...m,status}:m); save(INBOX_KEY,b);
}
function addReply(id, reply){
  const b = load(INBOX_KEY); b.messages=(b.messages||[]).map(m=>m.id===id?{...m,reply,status:'replied',repliedAt:new Date().toISOString()}:m); save(INBOX_KEY,b);
}
