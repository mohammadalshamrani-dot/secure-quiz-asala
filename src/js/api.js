
(function () {
  const getConfig = () => (window.__CONFIG__||{API_BASE:"",SITE_BASE:""});
  async function request(path, { method="GET", headers={}, body=null, auth=true } = {}) {
    const { API_BASE } = getConfig();
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    const finalHeaders = new Headers(headers);
    if (auth) {
      const token = window.Auth.getToken();
      if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
    }
    if (body && !(body instanceof FormData)) {
      finalHeaders.set("Content-Type", "application/json; charset=utf-8");
      body = JSON.stringify(body);
    }
    const res = await fetch(url, { method, headers: finalHeaders, body, credentials: "include" });
    let data=null; const ct = res.headers.get("content-type")||"";
    if (ct.includes("application/json")) data = await res.json(); else data = await res.text();
    if (!res.ok) {
      const msg = (data && (data.message||data.error)) || `HTTP ${res.status}`;
      if(String(msg).toLowerCase().includes("invalid token")) handleInvalidToken();
      throw new Error(typeof msg==="string"?msg:JSON.stringify(msg));
    }
    if (data && typeof data === "object") {
      const m = (data.message||data.error||"").toString().toLowerCase();
      if (m.includes("invalid token")) handleInvalidToken();
    }
    return data;
  }
  function handleInvalidToken(){
    window.Auth.clearToken();
    alert("انتهت صلاحية الجلسة، سجّل الدخول مجدداً.");
    window.location.href = "login.html";
  }
  window.API = { request, getConfig };
})();
