
/*
  nav-strip.js — يزيل أزرار الهيدر الثلاثة (التعليمات السريعة/تواصل مع الإدارة/لوحة التحكم)
  على جميع الصفحات، ويُبقي زر "الرئيسية" كما هو وفي موضعه.
  لا يغير أي شيء آخر.
*/
(function(){
  function removeByText(txt){
    const nodes = Array.from(document.querySelectorAll('a,button'));
    for(const el of nodes){
      const t = (el.textContent || '').trim();
      if(t === txt){
        if(el.parentElement){ el.parentElement.removeChild(el); }
        else{ el.remove(); }
      }
    }
  }
  function run(){
    removeByText('التعليمات السريعة');
    removeByText('تواصل مع الإدارة');
    removeByText('لوحة التحكم');
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run);
  }else{
    run();
  }
})();
