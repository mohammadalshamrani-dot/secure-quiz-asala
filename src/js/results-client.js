// واجهة بسيطة لجلب النتائج للمدرس بدون تغيير التصميم
(function(){
  async function load(quizId){
    if(!quizId) throw new Error("quizId required");
    if (!window.Auth.ensureAuthOrRedirect()) throw new Error("auth required");
    const data = await API.request('/api/results?quiz='+encodeURIComponent(quizId), { method:'GET', auth:true });
    // نتوقع: { participants, successRate, average, histogram:[{label,count}], rows:[{studentId, name, score, startedAt, finishedAt}] }
    return data;
  }
  window.SQAResults = { load };
})();