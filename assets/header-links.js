
/*
  This script avoids changing the site's design.
  It finds the three header buttons by common Arabic labels and rewires them:
  - التعليمات السريعة  -> instructions.html
  - التواصل مع الإدارة -> contact.html
  - لوحة التحكم        -> admin.html
  If your site uses different text, add your exact text variants in LABELS below.
*/
(function() {
  const LABELS = {
    instructions: ["التعليمات السريعة","التعليمات","الدليل","دليل المنصة"],
    contact: ["التواصل مع الإدارة","تواصل مع الإدارة","اتصل بالإدارة","التواصل"],
    admin: ["لوحة التحكم","الإدارة","لوحة الادمن","التحكم"]
  };

  function normalize(s){ return (s||"").replace(/\s+/g,"").trim(); }

  function rewire(link, target){
    if (!link) return;
    // Make sure it is an anchor
    if (link.tagName !== 'A') {
      // If it's a button, wrap/replace it safely
      const a = document.createElement('a');
      a.className = link.className || '';
      a.innerHTML = link.innerHTML;
      a.href = target;
      link.replaceWith(a);
      return;
    }
    link.setAttribute('href', target);
  }

  function findByText(variants) {
    const all = document.querySelectorAll('a, button, .nav a, header a, nav a, .navbar a, .menu a, li a, .btn, .button');
    const normVariants = variants.map(normalize);
    for (const el of all) {
      const txt = normalize(el.textContent || el.innerText || "");
      if (!txt) continue;
      if (normVariants.includes(txt)) return el;
      // partial match as a fallback (strict but helpful)
      for (const v of normVariants) {
        if (txt.includes(v)) return el;
      }
    }
    return null;
  }

  function ensureNavWorks(){
    try{
      const helpEl = findByText(LABELS.instructions);
      const contactEl = findByText(LABELS.contact);
      const adminEl = findByText(LABELS.admin);

      rewire(helpEl, 'instructions.html');
      rewire(contactEl, 'contact.html');
      rewire(adminEl, 'admin.html');
    }catch(e){
      console.warn('Header links activator error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureNavWorks);
  } else {
    ensureNavWorks();
  }
})();
