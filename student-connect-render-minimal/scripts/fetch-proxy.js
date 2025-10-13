// يوجّه استدعاءات /api/* تلقائيًا إلى باكند Render بدون تعديل بقية الأكواد
(function () {
  var API_BASE = 'https://secure-quiz-asala-1.onrender.com';
  if (!window.fetch || !API_BASE) return;
  try {
    var origFetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        var url = (typeof input === 'string') ? input : (input && input.url);
        if (url && /^\\/api\\//.test(url)) {
          var newUrl = API_BASE + url;
          if (typeof input === 'string') {
            return origFetch(newUrl, init);
          } else {
            var req = new Request(newUrl, input);
            return origFetch(req, init);
          }
        }
      } catch (e) { /* ignore and fall back */ }
      return origFetch(input, init);
    };
  } catch (e) {}
})();
