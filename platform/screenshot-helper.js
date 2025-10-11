
/*! Asala: screenshot helper for Render platform — adds logo, tips, and a cross-device screenshot button under the result */
(function(){
  const LOGO_URL = (new URL('../assets/logo-alasala.png', document.currentScript.src)).href;
  const CANDIDATES = ['#resultCard', '.result-card', '#result', '.result', '[data-result]'];
  const BTN_ID = 'asala-shot-btn';
  const INFO_ID = 'asala-shot-info';

  function loadScript(src){
    return new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ensureHeader(){
    if(document.querySelector('.asala-header')) return;
    const bar = document.createElement('div');
    bar.className = 'asala-header';
    bar.innerHTML = `
      <style>
        .asala-header{display:flex;align-items:center;justify-content:space-between;gap:10px;
          padding:12px 14px;border-bottom:1px solid #eee;background:#fff9f7;position:sticky;top:0;z-index:999}
        .asala-brand{display:flex;align-items:center;gap:10px;font-weight:800;color:#8B0B1A}
        .asala-brand img{height:28px;width:auto}
        .asala-sub{color:#667085;font-size:13px}
      </style>
      <div class="asala-brand"><img src="${LOGO_URL}" alt="ALASALA"><div>كليات الأصالة – كلية القانون</div></div>
      <div class="asala-sub">منصة الاختبارات القصيرة</div>`;
    document.body.prepend(bar);
  }

  function getResultNode(){
    for(const sel of CANDIDATES){
      const n = document.querySelector(sel);
      if(n) return n;
    }
    return null;
  }

  function addShotUI(resultNode){
    if(document.getElementById(BTN_ID)) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <style>
        .asala-shot-wrap{margin-top:12px;display:flex;flex-direction:column;gap:8px}
        .asala-shot-btn{appearance:none;border:0;background:#8B0B1A;color:#fff;
          padding:12px 16px;border-radius:12px;font-weight:800;display:inline-flex;gap:8px;align-items:center;justify-content:center}
        .asala-shot-btn:active{transform:scale(.99)}
        .asala-shot-info{font-size:13px;color:#667085}
      </style>
      <div class="asala-shot-wrap">
        <button id="${BTN_ID}" class="asala-shot-btn">📷 أخذ صورة للشاشة</button>
        <div id="${INFO_ID}" class="asala-shot-info">اضغط الزر ثم أرسل الصورة إلى عضو هيئة التدريس. لإعادة الالتقاط أعد الضغط.</div>
      </div>`;
    resultNode.insertAdjacentElement('afterend', wrap.firstElementChild);
  }

  function attach(){
    const resultNode = getResultNode();
    if(!resultNode) return;
    ensureHeader();
    addShotUI(resultNode);
    const btn = document.getElementById(BTN_ID);
    btn.addEventListener('click', async ()=>{
      if(!window.html2canvas){
        await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
      }
      const canvas = await window.html2canvas(resultNode, {scale: Math.max(2, window.devicePixelRatio || 2)});
      const a = document.createElement('a');
      a.download = 'result.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      const info = document.getElementById(INFO_ID);
      if(info) info.textContent = '✔️ تم حفظ الصورة. لإعادة الالتقاط اضغط الزر مرة أخرى.';
    });
  }

  // Wait for DOM and dynamic content
  const start = ()=>{
    const tryAttach = ()=>{
      const n = getResultNode();
      if(n){ attach(); return; }
    };
    tryAttach();
    const mo = new MutationObserver(tryAttach);
    mo.observe(document.documentElement, {childList:true, subtree:true});
  };

  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', start); }
  else{ start(); }
})();
