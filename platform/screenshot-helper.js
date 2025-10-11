
(function(){
  const ORIGIN = new URL(document.currentScript.src).origin;
  const LOGO = new URL('../assets/logo-alasala.png', document.currentScript.src).href;
  const BTN_ID='asala-shot-btn', INFO_ID='asala-shot-info', DEV_ID='asala-dev-foot';
  const RESULT_SELECTORS=['#resultCard','.result-card','#result','.result','[data-result]'];

  function loadScript(src){
    return new Promise((res, rej)=>{
      const s=document.createElement('script'); s.src=src; s.async=true; s.onload=res; s.onerror=rej; document.head.appendChild(s);
    });
  }

  function ensureHeader(){
    if(document.querySelector('.asala-header')) return;
    const h=document.createElement('div');
    h.className='asala-header';
    h.innerHTML=`<style>
    .asala-header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid #eee;background:#fff9f7;position:sticky;top:0;z-index:999}
    .asala-brand{display:flex;align-items:center;gap:10px;font-weight:800;color:#8B0B1A}
    .asala-brand img{height:28px}
    .asala-sub{color:#667085;font-size:13px}
    </style>
    <div class="asala-brand"><img src="${LOGO}" alt="ALASALA"><div>كليات الأصالة – كلية القانون</div></div>
    <div class="asala-sub">منصة الاختبارات القصيرة</div>`;
    document.body.prepend(h);
  }

  function findResult(){
    for(const s of RESULT_SELECTORS){ const n=document.querySelector(s); if(n) return n; }
    return null;
  }

  function infoBlock(){
    const ts=new Date().toLocaleString();
    const ua=navigator.userAgent;
    return `<div class="asala-info small" style="margin-top:6px;color:#555">
      <b>تعليمات:</b> اضغط الزر لالتقاط صورة النتيجة ثم أرسلها إلى عضو هيئة التدريس. <br>
      <b>ختم الوقت:</b> ${ts} — <b>المتصفح:</b> ${ua.slice(0,100)}
    </div>`;
  }

  async function attach(){
    ensureHeader();
    const node=findResult();
    if(!node) return;
    // Developer footer
    if(!document.getElementById(DEV_ID)){
      const foot=document.createElement('div');
      foot.id=DEV_ID; foot.className='small';
      foot.style.cssText='margin-top:10px;color:#999;text-align:center';
      foot.textContent='تم تطوير المنصة بواسطة: د. محمد الشمراني – 2025';
      node.insertAdjacentElement('afterend', foot);
    }
    // Screenshot UI
    if(!document.getElementById(BTN_ID)){
      const wrap=document.createElement('div');
      wrap.innerHTML=`<style>
        .asala-shot{margin-top:10px;display:flex;flex-direction:column;gap:8px}
        .asala-btn{appearance:none;border:0;background:#8B0B1A;color:#fff;padding:12px 16px;border-radius:12px;font-weight:800;display:inline-flex;gap:8px;align-items:center;justify-content:center}
        .asala-btn:active{transform:scale(.99)}
      </style>
      <div class="asala-shot">
        <button id="${BTN_ID}" class="asala-btn">📷 أخذ صورة للشاشة</button>
        ${infoBlock()}
        <div id="${INFO_ID}" class="small" style="color:#667085">يتم حفظ الصورة بصيغة PNG وتعمل على جميع الأجهزة.</div>
      </div>`;
      node.insertAdjacentElement('afterend', wrap.firstElementChild);
      document.getElementById(BTN_ID).addEventListener('click', async ()=>{
        if(!window.html2canvas){ await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'); }
        const canvas=await window.html2canvas(node, {scale:Math.max(2,window.devicePixelRatio||2)});
        const a=document.createElement('a'); a.download='result.png'; a.href=canvas.toDataURL('image/png'); a.click();
        const info=document.getElementById(INFO_ID); if(info) info.textContent='✔️ تم حفظ الصورة.';
      });
    }
  }

  const mo=new MutationObserver(attach);
  mo.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded', attach);} else { attach(); }
})();
