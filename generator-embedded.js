
/*! generator-embedded.js — يضيف حفظ+توليد رابط يعمل عبر تنزيل ملف JSON بنفس المعرّف */
(function(){
  function randomId(len){const c="abcdefghijklmnopqrstuvwxyz0123456789";let o="";for(let i=0;i<len;i++)o+=c[Math.floor(Math.random()*c.length)];return o;}
  function downloadJSON(filename, text){
    const blob = new Blob([text], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=filename;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function buildFromHidden(){
    const ta = document.querySelector("#quiz-json-source");
    if(ta && ta.value.trim()){
      try{ return JSON.parse(ta.value); }catch(e){ console.warn("quiz-json-source parse error", e); }
    }
    return null;
  }
  function buildFromDom(){
    // محاولـة مرنة لاستخراج الحقول الشائعة بدون فرض بنية محددة
    const title = (document.querySelector("#quiz-title, input[name='title']") || {}).value || "Quiz";
    const durEl = document.querySelector("#quiz-duration, select[name='duration'], input[name='duration']");
    let duration = 10; if(durEl){ const v = parseInt(durEl.value||"10",10); duration = isNaN(v)?10:Math.max(1,v); }
    const questions = [];
    // ابحث عن عناصر أسئلة متكررة
    const blocks = document.querySelectorAll(".question, .question-item, [data-question], .q-block");
    if(blocks.length){
      blocks.forEach(function(b){
        const q = (b.querySelector("textarea, input[type='text']")||{}).value || "";
        // اجمع الخيارات
        const opts = []; b.querySelectorAll("input[type='text'].choice, .choice input[type='text'], [data-choice]").forEach(function(c){
          if(c.value) opts.push(c.value);
        });
        // حدد الإجابة الصحيحة (أول خيار مؤشر)
        let ans = 0;
        const radios = b.querySelectorAll("input[type='radio']");
        radios.forEach(function(r,i){ if(r.checked) ans = i; });
        if(q.trim()){
          questions.push({q:q.trim(), choices: (opts.length?opts:["A","B","C","D"]), answer: ans});
        }
      });
    }
    return { title, duration, questions };
  }
  function computeBasePath(){
    // يعيد أصل الموقع + المسار حتى جذر الموقع (حيث توجد student.html)
    var base = location.origin + location.pathname;
    // حاول إزالة اسم الملف الحالي إذا وُجد
    base = base.replace(/[^\/]*$/, "");
    return base;
  }
  function setLink(link){
    // جرّب إيجاد حاوية الرابط الحالية وإلا أنشئ واحدة بنفس الطابع
    var box = document.querySelector("#studentLinkBox, #student-link, .student-link-box");
    if(!box){
      box = document.createElement("div");
      box.style.background = "#ecfdf5"; box.style.border="1px solid #10b981"; box.style.padding="10px 12px";
      box.style.borderRadius="10px"; box.style.direction="ltr"; box.style.wordBreak="break-all"; box.style.marginTop="8px";
      // ضعها بعد الزر
      var btn = document.querySelector("#save-generate-btn") || document.querySelector("button");
      btn && btn.parentNode && btn.parentNode.insertBefore(box, btn.nextSibling);
    }
    box.textContent = link;
  }
  function copyToClipboard(text){
    try{navigator.clipboard.writeText(text);}catch(e){const ta=document.createElement("textarea"); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();}
  }

  function handle(){
    // 1) ابنِ بيانات الكويز
    var data = buildFromHidden() || buildFromDom();
    if(!data || !Array.isArray(data.questions) || data.questions.length===0){
      alert("تعذّر قراءة الأسئلة من الصفحة. يمكنك إضافة textarea مخفية id="quiz-json-source" لتمرير JSON جاهز."); return;
    }
    // 2) أنشئ معرف ثابت للرابط/الملف
    var id = (data.id && /^[a-z0-9]{6,}$/i.test(data.id)) ? data.id : randomId(8);
    data.id = id; data.created_at = new Date().toISOString();
    // 3) نزّل الملف المطلوب رفعه إلى data/quizzes
    var filename = id + ".json";
    downloadJSON(filename, JSON.stringify(data, null, 2));
    // 4) اعرض الرابط الجاهز
    var base = computeBasePath();
    var link = base + "student.html?id=" + id;
    setLink(link);
    // 5) انسخ تلقائياً للحافظة (اختياري)
    copyToClipboard(link);
  }

  // اربط على الزر الموجود: يكفي إعطاء الزر الحالي id="save-generate-btn"
  function attach(){
    var btn = document.querySelector("#save-generate-btn");
    if(!btn){
      // كحل احتياطي: ابحث عن زر يحتوي نص "حفظ وتوليد رابط الطالب"
      var buttons = Array.from(document.querySelectorAll("button"));
      btn = buttons.find(b => /حفظ\s*وتوليد\s*رابط\s*الطالب/.test(b.textContent||""));
    }
    if(btn){
      btn.addEventListener("click", function(e){ e.preventDefault(); handle(); }, {capture:false});
    } else {
      console.warn("generator-embedded: لم أجد الزر. امنح الزر id="save-generate-btn".");
    }
  }
  document.addEventListener("DOMContentLoaded", attach);
})();
