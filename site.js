
(function(){
  const LS_PASS_KEY = 'adminPassword';
  const LS_TICKETS = 'tickets';
  const LS_SESSION = 'adminSession';

  function getPass(){ return localStorage.getItem(LS_PASS_KEY) || 'AaBbCc123'; }
  function setPass(p){ localStorage.setItem(LS_PASS_KEY, p); }
  function tickets(){ return JSON.parse(localStorage.getItem(LS_TICKETS) || '[]'); }
  function saveTickets(arr){ localStorage.setItem(LS_TICKETS, JSON.stringify(arr)); }
  function addTicket(t){ const arr=tickets(); arr.unshift(t); saveTickets(arr); }

  // Feedback form
  const feedbackForm = document.getElementById('feedbackForm');
  if (feedbackForm){
    feedbackForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(feedbackForm);
      const t = {
        id: 'T' + Date.now(),
        date: new Date().toISOString(),
        name: fd.get('name'),
        role: fd.get('role'),
        email: fd.get('email') || '',
        category: fd.get('category'),
        subject: fd.get('subject'),
        message: fd.get('message'),
        status: 'جديد',
        replies: []
      };
      addTicket(t);
      feedbackForm.reset();
      const ok = document.getElementById('success'); if (ok) { ok.style.display='block'; setTimeout(()=>ok.style.display='none', 3500); }
    });
  }

  // Admin login/panel
  const loginForm = document.getElementById('loginForm');
  const panel = document.getElementById('panel');
  const loginCard = document.getElementById('loginCard');
  const loginErr = document.getElementById('loginErr');

  function isLogged(){ return localStorage.getItem(LS_SESSION) === '1'; }
  function showPanel(){
    if(panel){ panel.style.display='block'; }
    if(loginCard){ loginCard.style.display='none'; }
    renderInbox();
    fillTicketSelect();
  }

  if (loginForm){
    if (isLogged()) showPanel();
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(loginForm);
      const u = fd.get('username');
      const p = fd.get('password');
      if (u==='admin' && p===getPass()){
        localStorage.setItem(LS_SESSION,'1'); showPanel();
      } else {
        if(loginErr){ loginErr.style.display='block'; setTimeout(()=>loginErr.style.display='none', 2500); }
      }
    });
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn){
      logoutBtn.addEventListener('click', ()=>{
        localStorage.removeItem(LS_SESSION); location.reload();
      });
    }
  }

  // Tabs
  const tabbar = document.querySelectorAll('.tabbar button');
  function activateTab(name){
    tabbar.forEach(b=>b.classList.toggle('active', b.dataset.tab===name));
    ['inbox','compose','password'].forEach(n=>{
      const el = document.getElementById('tab-'+n);
      if(el) el.style.display = (n===name)?'block':'none';
    });
  }
  tabbar.forEach(b=>b.addEventListener('click', ()=>activateTab(b.dataset.tab)));

  // Render inbox
  function renderInbox(){
    const rows = document.getElementById('rows'); if (!rows) return;
    rows.innerHTML = '';
    tickets().forEach(t=>{
      const tr = document.createElement('tr'); tr.className='row';
      const date = new Date(t.date).toLocaleString('ar-EG');
      const status = t.status;
      tr.innerHTML = `<td>${date}</td><td>${status}</td><td>${t.name} – ${t.role}</td><td>${t.category}</td><td><b>${t.subject}</b><div class="small-muted">${t.message}</div></td>`;
      rows.appendChild(tr);
    });
  }

  function fillTicketSelect(){
    const sel = document.getElementById('ticketSelect'); if(!sel) return;
    const arr = tickets();
    sel.innerHTML = arr.map(t=>`<option value="${t.id}">${t.id} — ${t.subject} (${t.status})</option>`).join('');
  }

  // Reply form
  const replyForm = document.getElementById('replyForm');
  if (replyForm){
    replyForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(replyForm);
      const id = fd.get('ticketId');
      const txt = fd.get('reply');
      const arr = tickets();
      const t = arr.find(x=>x.id===id);
      if (t){
        t.replies.push({at:new Date().toISOString(), text:txt});
        t.status = 'مجاب';
        saveTickets(arr);
        renderInbox(); fillTicketSelect();
        const ok = document.getElementById('replyOk'); if (ok){ ok.style.display='block'; setTimeout(()=>ok.style.display='none', 2500); }
        replyForm.reset();
      }
    });
  }

  // Change password
  const passForm = document.getElementById('passForm');
  if (passForm){
    passForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(passForm);
      const old = fd.get('old');
      const newp = fd.get('new');
      if (old === getPass()){
        setPass(newp);
        const ok = document.getElementById('passOk'); if (ok){ ok.style.display='block'; setTimeout(()=>ok.style.display='none', 2500); }
        passForm.reset();
      } else {
        const er = document.getElementById('passErr'); if (er){ er.style.display='block'; setTimeout(()=>er.style.display='none', 2500); }
      }
    });
  }
})(); 
