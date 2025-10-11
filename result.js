
(function(){
  function qs(k){return new URLSearchParams(location.search).get(k)||"";}
  function pad(n){return n.toString().padStart(2,'0');}
  const examTitle = qs('exam') || 'اختبار قصير';
  const studentId = qs('student') || 'طالب';
  const score = qs('score') || '--/--';
  const now = new Date();
  const dt = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  // simple verif. code: hash of (exam+student+timestamp) -> 8 chars
  function hash8(s){
    let h=2166136261>>>0;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=(h*16777619)>>>0;}
    return (h>>>0).toString(16).slice(0,8).toUpperCase();
  }
  const seed = examTitle+'|'+studentId+'|'+dt;
  const vcode = hash8(seed);
  document.getElementById('examTitle').textContent = examTitle;
  document.getElementById('studentId').textContent = studentId;
  document.getElementById('score').textContent = score;
  document.getElementById('dt').textContent = dt;
  document.getElementById('vcode').textContent = vcode;
  document.getElementById('copyBtn').addEventListener('click', async ()=>{
    try{await navigator.clipboard.writeText(vcode);}catch(e){}
  });
  document.getElementById('snapTip').addEventListener('click', ()=>{
    const el=document.getElementById('tip'); el.style.display='block';
  });
  // Warn on unload to reduce losing result without screenshot
  window.addEventListener('beforeunload', function (e) {
    e.preventDefault(); e.returnValue=''; // show browser prompt
  });
})();
