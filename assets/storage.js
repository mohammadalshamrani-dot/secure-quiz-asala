
// A tiny storage layer using localStorage for a static site.
// Messages key: 'sq_messages'  (array of {id, name, role, email, subject, body, createdAt, status, reply})
// Admin key:    'sq_admin'     ({username:'admin', passHash: <sha256 hex>})
(function(){
  const LS = window.localStorage;
  function load(key, d){ try { return JSON.parse(LS.getItem(key) || JSON.stringify(d)); } catch { return d; } }
  function save(key, v){ LS.setItem(key, JSON.stringify(v)); }
  function sha256Hex(str) {
    // Lightweight SHA-256 using SubtleCrypto if available; otherwise fallback to simple (insecure) hash.
    if (window.crypto && window.crypto.subtle) {
      return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(buf => {
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
      });
    } else {
      // Fallback (NOT cryptographically secure; only to keep the code working offline)
      let h = 0x811c9dc5;
      for (let i=0;i<str.length;i++) { h ^= str.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); }
      return Promise.resolve((h>>>0).toString(16));
    }
  }

  async function ensureAdmin(){
    const admin = load('sq_admin', null);
    if (!admin) {
      const passHash = await sha256Hex('AaBbCc123');
      save('sq_admin', { username: 'admin', passHash });
    }
  }

  function getMessages(){ return load('sq_messages', []); }
  function setMessages(arr){ save('sq_messages', arr); }

  function addMessage(m){
    const arr = getMessages();
    m.id = 'msg_'+Date.now()+'_'+Math.floor(Math.random()*1e6);
    m.createdAt = new Date().toISOString();
    m.status = 'new';
    arr.unshift(m);
    setMessages(arr);
    return m;
  }

  async function login(username, password){
    const admin = load('sq_admin', null);
    if (!admin || username !== admin.username) return false;
    const hash = await sha256Hex(password);
    return hash === admin.passHash;
  }

  async function changePassword(oldPass, newPass){
    const admin = load('sq_admin', null);
    if (!admin) return false;
    const ok = await login(admin.username, oldPass);
    if (!ok) return false;
    const newHash = await sha256Hex(newPass);
    save('sq_admin', { username: 'admin', passHash: newHash });
    return true;
  }

  function updateMessage(id, patch){
    const arr = getMessages();
    const ix = arr.findIndex(x => x.id === id);
    if (ix >= 0) {
      arr[ix] = { ...arr[ix], ...patch };
      setMessages(arr);
      return arr[ix];
    }
    return null;
  }

  function deleteMessage(id){
    const arr = getMessages().filter(x => x.id !== id);
    setMessages(arr);
    return true;
  }

  // Expose globally
  window.SQStore = { ensureAdmin, addMessage, getMessages, updateMessage, deleteMessage, login, changePassword };
})();
