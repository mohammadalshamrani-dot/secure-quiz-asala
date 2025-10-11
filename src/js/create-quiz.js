
(function () {
  const btn = document.querySelector('[data-action="create-quiz"]');
  if (!btn) return;

  function siteBase(){
    try{
      return (window.__CONFIG__ && window.__CONFIG__.SITE_BASE) ? window.__CONFIG__.SITE_BASE : (location.origin + location.pathname.replace(/[^/]+$/, ''));
    }catch(e){ return location.origin + '/'; }
  }

  function genQR(text){
    const node = document.getElementById('qrcode');
    node.innerHTML='';
    new QRCode(node, { text, width: 160, height: 160 });
  }

  btn.addEventListener("click", async function (e) {
    e.preventDefault();
    if (!window.Auth.ensureAuthOrRedirect()) return;

    const payload = {
      title: (document.getElementById('quiz-title')||{}).value || 'اختبار بدون عنوان',
      description: (document.getElementById('quiz-desc')||{}).value || '',
      course: (document.getElementById('quiz-course')||{}).value || '',
      total: parseFloat((document.getElementById('quiz-total')||{}).value||"10"),
      durationMinutes: parseInt((document.getElementById('quiz-duration')||{}).value||"10"),
      options: {
        antiCheat: document.getElementById('opt-anti-cheat')?.checked || false,
        noBack: document.getElementById('opt-no-back')?.checked || false,
        shuffle: document.getElementById('opt-shuffle')?.checked || false
      },
      questions: window.collectQuestions ? window.collectQuestions() : []
    };

    btn.disabled = true; const old = btn.innerText; btn.innerText = "جاري الإنشاء...";

    try {
      const data = await window.API.request("/api/quizzes", {
        method: "POST",
        body: payload,
        auth: true
      });
      alert("تم إنشاء الاختبار بنجاح");
      const id = data.quizId || data.id;
      if(id){
        const base = siteBase();
        const internalUrl = `${base}results.html?quiz=${encodeURIComponent(id)}`;
        const externalUrl = data.publicUrl || `${base}t/${encodeURIComponent(id)}`;

        document.getElementById('internal-link').value = internalUrl;
        document.getElementById('public-link').value = externalUrl;
        genQR(externalUrl);
      }
    } catch (err) {
      alert("تعذر إنشاء الاختبار: " + (err && err.message ? err.message : "خطأ غير معروف"));
    } finally {
      btn.disabled = false; btn.innerText = old;
    }
  });
})();
