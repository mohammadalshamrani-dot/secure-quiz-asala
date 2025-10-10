
// ======== إعدادات عامة ========
const ADMIN_EMAIL = "YOUR_EMAIL@domain.com"; // ← عدّل هذا إلى بريدك الجامعي

// زر الرجوع
window.goBack = function(){
  if (history.length > 1) history.back();
  else window.location.href = 'index.html';
};

// جعل الشعار/العنوان يعيدان للصفحة الرئيسية إذا لم يكونا <a>
document.addEventListener('click', (e)=>{
  const t = e.target.closest('.brand, .logo, .site-title');
  if(t && !t.closest('a')) window.location.href = 'index.html';
});

// شاشة الترحيب
window.addEventListener('load', ()=>{
  setTimeout(()=>{ document.getElementById('splash')?.classList.add('fadeout'); }, 5000);
});

// إرسال mailto من صفحة التواصل
window.sendMailto = function(e){
  e.preventDefault();
  const f = e.target;
  const subject = encodeURIComponent(`[منصة الاختبارات القصيرة] ${f.type.value} من ${f.name.value}`);
  const body = encodeURIComponent(
    `الاسم: ${f.name.value}\nالبريد: ${f.email.value}\nالنوع: ${f.type.value}\n\nالرسالة:\n${f.message.value}`
  );
  if(!ADMIN_EMAIL || ADMIN_EMAIL === "YOUR_EMAIL@domain.com"){
    alert("رجاءً عيّن بريدك في assets/common.js (المتغير ADMIN_EMAIL).");
    return;
  }
  window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
};
