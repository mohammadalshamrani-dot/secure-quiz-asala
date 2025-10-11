
(function(){
  const host = document.getElementById('questions');
  const addBtn = document.getElementById('addQ');
  if(!host || !addBtn) return;

  function newQuestion(){
    const wrap = document.createElement('div');
    wrap.className='card';
    wrap.innerHTML = `
      <label>نص السؤال
        <textarea class="q-text" rows="2" required></textarea>
      </label>
      <div class="grid-3">
        <label>نوع السؤال
          <select class="q-type">
            <option value="mcq">اختيارات</option>
            <option value="tf">صح/خطأ</option>
            <option value="essay">مقالي</option>
          </select>
        </label>
        <label>الدرجة
          <input type="number" class="q-score" min="1" value="1">
        </label>
        <label>الوقت (ث)
          <input type="number" class="q-seconds" min="5" value="60">
        </label>
      </div>
      <div class="options"></div>
      <button class="btn outline addOpt">إضافة خيار</button>
      <button class="btn remove">حذف السؤال</button>
    `;
    wrap.querySelector('.remove').onclick = ()=> wrap.remove();
    const opts = wrap.querySelector('.options');
    wrap.querySelector('.addOpt').onclick = ()=> addOption(opts);
    host.appendChild(wrap);
  }

  function addOption(container){
    const row=document.createElement('div');
    row.className='grid-3';
    row.innerHTML=`
      <label>الخيار
        <input class="opt-text">
      </label>
      <label>صحيح؟
        <input type="checkbox" class="opt-correct">
      </label>
      <button class="btn removeOpt">حذف</button>
    `;
    row.querySelector('.removeOpt').onclick = ()=> row.remove();
    container.appendChild(row);
  }

  window.collectQuestions = function(){
    const blocks = host.querySelectorAll('.card');
    const arr = [];
    blocks.forEach(b=>{
      const type = b.querySelector('.q-type').value;
      const score = parseFloat(b.querySelector('.q-score').value||"1");
      const seconds = parseInt(b.querySelector('.q-seconds').value||"60");
      const text = b.querySelector('.q-text').value.trim();
      const options = [];
      b.querySelectorAll('.options .grid-3').forEach(r=>{
        options.push({
          text: r.querySelector('.opt-text').value,
          correct: r.querySelector('.opt-correct').checked
        });
      });
      arr.push({ type, score, seconds, text, options });
    });
    return arr;
  };

  addBtn.onclick = newQuestion;
  newQuestion(); // سؤال أول تلقائي
})();
