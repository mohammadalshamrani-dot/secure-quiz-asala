// Proxy ذكي: يدعم /api/quiz?id=ID و /api/quiz/ID معاً
(function () {
  var API_BASE = 'https://secure-quiz-asala-1.onrender.com';
  if (!window.fetch || !API_BASE) return;

  var origFetch = window.fetch;
  window.fetch = async function (input, init) {
    try {
      var url = (typeof input === 'string') ? input : (input && input.url) || '';

      // عالج فقط الطلبات التي تبدأ بـ /api/
      if (url && /^\/api\//.test(url)) {
        var target = url;

        // ✅ تحويل /api/quiz?id=ID إلى /api/quiz/ID
        if (/^\/api\/quiz(?:[/?]|$)/.test(url)) {
          // اصنع URL مؤقت لقراءة باراميترات الاستعلام
          var u = new URL(url, 'http://x');
          var qid = u.searchParams.get('id');
          if (qid) {
            target = '/api/quiz/' + encodeURIComponent(qid);
          } else {
            // إن لم يوجد id في الاستعلام، اتركه كما هو (يدعم /api/quiz/ID)
            target = u.pathname + (u.search || '');
          }
        }

        var full = API_BASE + target;
        if (typeof input === 'string') {
          return origFetch(full, init);
        } else {
          var req = new Request(full, input);
          return origFetch(req, init);
        }
      }
    } catch (e) {
      // في حال أي خطأ نرجع للسلوك الأصلي
    }
    return origFetch(input, init);
  };
})();
