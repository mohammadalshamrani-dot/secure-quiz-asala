(function () {
  const KEY = "SQA_AUTH_TOKEN";
  function saveToken(token){ try{ localStorage.setItem(KEY, token); }catch(e){} }
  function getToken(){ try{ return localStorage.getItem(KEY) || ""; }catch(e){ return ""; } }
  function clearToken(){ try{ localStorage.removeItem(KEY);}catch(e){} }
  function ensureAuthOrRedirect(loginHref){
    const t = getToken();
    if(!t){
      alert("هذه العملية تتطلب تسجيل دخول.");
      if (loginHref) window.location.href = loginHref;
      return false;
    }
    return true;
  }
  window.Auth = { saveToken, getToken, clearToken, ensureAuthOrRedirect };
})();