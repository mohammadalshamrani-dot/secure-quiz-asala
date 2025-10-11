
(function(){
  const STORAGE_KEY = "asala_quizzes";
  const STUDENTS_PAGE = "/secure-quiz-asala/students.html";
  const ALLOWED_ORIGIN = "https://secure-quiz-asala-1.onrender.com";

  function buildInternalLink(quizId){
    return location.origin + STUDENTS_PAGE + "?quiz=" + encodeURIComponent(quizId);
  }

  function saveQuizMeta(meta){
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if(!saved.find(q => q.quizId === meta.quizId)){
        saved.push(meta);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      }
    } catch(e){ console.warn("localStorage unavailable:", e); }
  }

  function generateQR(text){
    const box = document.getElementById("qrBox");
    if(!box) return;
    box.innerHTML = "";
    new QRCode(box, { text, width: 196, height: 196 });
  }

  window.addEventListener("message", function(e){
    if(!e.data || e.data.type !== "quizCreated") return;
    if(e.origin !== ALLOWED_ORIGIN) { console.warn("Blocked postMessage from origin:", e.origin); return; }

    const { quizId, quizUrl, title } = e.data.payload || {};
    if(!quizId) return;

    const internal = buildInternalLink(quizId);
    const il = document.getElementById("internalLink");
    if(il) il.value = internal;
    const qt = document.getElementById("quizTitle");
    if(qt && title) qt.value = title;

    if(typeof QRCode !== "undefined") generateQR(internal);
    saveQuizMeta({ quizId, quizUrl, internal, title: title || "" });
  });
})();
