/* src/js/api.js
 * طبقة طلبات موحّدة تضيف Authorization تلقائياً وتلتقط أخطاء Invalid token
 */
(function () {
  const getApiBase = () => {
    // يقرأ من meta أو من نافذة global config
    const meta = document.querySelector('meta[name="api-base"]');
    if (meta && meta.content) return meta.content.trim();
    if (window.__CONFIG__ && window.__CONFIG__.API_BASE) return window.__CONFIG__.API_BASE;
    return ""; // إن تُرك فارغاً سيستخدم المسارات النسبية
  };

  const API_BASE = getApiBase();

  async function request(path, { method = "GET", headers = {}, body = null, auth = true } = {}) {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    const finalHeaders = new Headers(headers);

    if (auth) {
      const token = window.Auth.getToken();
      if (token) {
        finalHeaders.set("Authorization", `Bearer ${token}`);
      }
    }

    if (body && !(body instanceof FormData)) {
      finalHeaders.set("Content-Type", "application/json; charset=utf-8");
      body = JSON.stringify(body);
    }

    const res = await fetch(url, { method, headers: finalHeaders, body, credentials: "include" });
    if (res.status === 401) {
      // احتمال توكن منتهي/غير صالح
      await handleInvalidToken();
      throw new Error("Unauthorized (401)");
    }

    let data = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      // التقط رسائل الخادم
      const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
      if (typeof msg === "string" && msg.toLowerCase().includes("invalid token")) {
        await handleInvalidToken();
      }
      throw new Error(msg);
    }

    // تحقق من رسائل "Invalid token" حتى مع 200 (سلوك بعض السيرفرات)
    if (data && typeof data === "object") {
      const m = (data.message || data.error || "").toString().toLowerCase();
      if (m.includes("invalid token")) {
        await handleInvalidToken();
        throw new Error("Invalid token");
      }
    }

    return data;
  }

  async function handleInvalidToken() {
    window.Auth.clearToken();
    alert("انتهت صلاحية الجلسة. سجّل الدخول مجدداً.");
    // غيّر المسار التالي لصفحة تسجيل الدخول لديك
    window.location.href = "/login.html";
  }

  // نقطة مخصّصة لتحديث التوكن إن كان لديك Refresh Token على الخادم
  async function attemptRefreshToken() {
    // مثال (عطّل/فعّل حسب توفّر المسار على الخادم):
    // try {
    //   const res = await fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" });
    //   if (!res.ok) throw new Error("refresh failed");
    //   const json = await res.json();
    //   if (json && json.token) window.Auth.saveToken(json.token);
    // } catch (e) {
    //   // تجاهل
    // }
  }

  window.API = { request, API_BASE };
})();