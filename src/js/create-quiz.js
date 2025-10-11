/* src/js/create-quiz.js
 * ربط زر إنشاء الاختبار مع التحقق من التوكن وإرسال الطلب بالترويسة الصحيحة
 */
(function () {
  const btn = document.querySelector('[data-action="create-quiz"]');
  if (!btn) return;

  btn.addEventListener("click", async function (e) {
    e.preventDefault();
    if (!window.Auth.ensureAuthOrRedirect()) return;

    // مثال بسيط لتجميع الحقول؛ عدّل selectors بما يلائم صفحتك
    const titleInput = document.querySelector('#quiz-title');
    const questionsPayload = window.collectQuestions ? window.collectQuestions() : []; // توقع وجود دالة تجمع الأسئلة

    const payload = {
      title: titleInput ? titleInput.value : "اختبار بدون عنوان",
      questions: questionsPayload
    };

    btn.disabled = true;
    btn.innerText = "جاري الإنشاء...";

    try {
      const data = await window.API.request("/api/quizzes", {
        method: "POST",
        body: payload,
        auth: true
      });
      // نجاح
      alert("تم إنشاء الاختبار بنجاح");
      // إذا كان الخادم يرجع رابط داخلي/عام
      if (data && data.quizId) {
        const internalUrl = `/results.html?quiz=${encodeURIComponent(data.quizId)}`;
        const externalUrl = data.publicUrl || data.shareUrl || null;

        const internalField = document.querySelector('#internal-link');
        const externalField = document.querySelector('#public-link');

        if (internalField) internalField.value = internalUrl;
        if (externalField && externalUrl) externalField.value = externalUrl;
      }
    } catch (err) {
      console.error(err);
      alert("تعذر إنشاء الاختبار: " + (err && err.message ? err.message : "خطأ غير معروف"));
    } finally {
      btn.disabled = false;
      btn.innerText = "إنشاء الاختبار";
    }
  });
})();