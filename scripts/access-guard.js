
// Secure Quiz Asala – Exam Access Guard (feature-flagged; default OFF)
window.__examGuard = (function(){
  function pad(n){ return n<10 ? '0'+n : ''+n; }
  function minuteKey(date){
    const d = date || new Date();
    return d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate())+pad(d.getUTCHours())+pad(d.getUTCMinutes());
  }
  function hashCode(s){
    let h=0; for(let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h|=0; }
    return Math.abs(h);
  }
  function codeFor(quizId, offsetMin){
    const d = new Date(Date.now() + (offsetMin||0)*60000);
    const bucket = minuteKey(d);
    const h = (hashCode(quizId + '::' + bucket) + '').padStart(8,'0');
    return h.slice(-6);
  }
  function validToken(quizId, token){
    if(!token) return false;
    const candidates=[codeFor(quizId,0), codeFor(quizId,-1), codeFor(quizId,1)];
    return candidates.includes(token);
  }
  function checkEntry({quizId, token}){ return validToken(quizId, token); }
  return { codeFor, checkEntry };
})();
