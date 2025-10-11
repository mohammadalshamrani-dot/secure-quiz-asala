# قصاصات خادم: تخزين نتائج لمدة يوم واحد فقط (TTL=86400)

> اختر أحد الخيارين:

## الخيار A (مستحسن): Redis
```js
import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL); // ضع URL
const RESULTS_TTL = 60 * 60 * 24; // 24 ساعة

// عند تسليم الطالب للاختبار:
app.post("/api/submit", auth, async (req, res) => {
  const { quizId, student, answers, score } = req.body;
  const key = `quiz:${quizId}:results`;
  const record = { student, score, finishedAt: Date.now() };
  await redis.rpush(key, JSON.stringify(record));
  await redis.expire(key, RESULTS_TTL); // يضبط/يجدّد TTL لليوم الواحد
  return res.json({ ok: true });
});

// عند طلب المدرّس للنتائج:
app.get("/api/results", auth, async (req, res) => {
  const quizId = req.query.quiz;
  const key = `quiz:${quizId}:results`;
  const list = await redis.lrange(key, 0, -1);
  const rows = list.map(x => JSON.parse(x));
  // ابنِ تلخيصًا سريعًا:
  const participants = rows.length;
  const average = participants ? rows.reduce((a,b)=>a+b.score,0)/participants : 0;
  const successRate = participants ? rows.filter(r=>r.score>= (req.query.pass||0)).length/participants : 0;
  const histogram = [0,1,2,3,4,5,6,7,8,9,10].map(g=>({label:`${g*10}-${g*10+9}`,count:rows.filter(r=>Math.floor(r.score/10)===g).length}));
  res.json({ participants, average, successRate, histogram, rows });
});
```

## الخيار B: تخزين بالذاكرة (إن لم يتوفر Redis)
> ملاحظة: يمسح عند إعادة تشغيل السيرفر.
```js
const RESULTS_TTL = 60 * 60 * 24; // 24 ساعة
const store = new Map(); // key => {expires, rows:[]}

function ensureBucket(key){
  const now = Date.now();
  let b = store.get(key);
  if(!b || b.expires < now){
    b = { expires: now + RESULTS_TTL*1000, rows: [] };
    store.set(key, b);
  }
  return b;
}

app.post("/api/submit", auth, (req, res) => {
  const { quizId, student, score } = req.body;
  const key = `quiz:${quizId}:results`;
  const bucket = ensureBucket(key);
  bucket.rows.push({ student, score, finishedAt: Date.now() });
  return res.json({ ok: true });
});

app.get("/api/results", auth, (req, res) => {
  const quizId = req.query.quiz;
  const key = `quiz:${quizId}:results`;
  const b = store.get(key);
  if(!b) return res.json({ participants:0, average:0, successRate:0, histogram:[], rows:[] });
  if(b.expires < Date.now()){ store.delete(key); return res.json({ participants:0, average:0, successRate:0, histogram:[], rows:[] }); }
  const rows = b.rows;
  const participants = rows.length;
  const average = participants ? rows.reduce((a,b)=>a+b.score,0)/participants : 0;
  const successRate = participants ? rows.filter(r=>r.score>= (req.query.pass||0)).length/participants : 0;
  const histogram = [0,1,2,3,4,5,6,7,8,9,10].map(g=>({label:`${g*10}-${g*10+9}`,count:rows.filter(r=>Math.floor(r.score/10)===g).length}));
  res.json({ participants, average, successRate, histogram, rows });
});
```