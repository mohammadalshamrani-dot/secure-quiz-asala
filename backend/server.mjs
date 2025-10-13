import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
// السماح لأصل GitHub Pages باستخدام المنصة
const allowedOrigins = [
  "https://mohammadalshamrani-dot.github.io",
  "https://mohammadalshamrani-dot.github.io/secure-quiz-asala"
];

const corsOptions = {
  origin: function (origin, callback) {
    // السماح للطلبات بدون Origin (مثل Postman أو Render نفسه)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("❌ CORS Blocked Request from:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

// استخدم هذا بدلاً من app.use(cors())
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // السماح بطلبات preflight

app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
// ✅ فحص الصحة السريع
app.get("/api/health", (req, res) => res.json({ ok: true, service: "secure-quiz-asala-1" }));

// هيلبر: جرّب أكثر من اسم جدول لو ما عرفت الاسم الدقيق
async function fetchQuizById(id) {
  const tableList =
    (process.env.QUIZ_TABLE ? process.env.QUIZ_TABLE.split(",") : null)
      || ["quizzes", "exams", "quiz", "tests"]; // عدّلها لاحقًا إذا عرفت الاسم

  for (const table of tableList) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single();

    if (data) return data;               // لقيّنا الاختبار
    if (error && error.code && error.code !== "PGRST116") {
      // PGRST116 غالبًا "Row not found" — كمل على الجدول اللي بعده
      console.warn(`[fetchQuizById] table=${table} error=`, error.message);
    }
  }
  return null; // ما لقينا في أي جدول
}

// ✅ /api/quiz?id=XXXX
app.get("/api/quiz", async (req, res) => {
  try {
    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ ok: false, error: "missing id" });

    const quiz = await fetchQuizById(id);
    if (!quiz) return res.status(404).json({ ok: false, error: "quiz not found" });

    return res.json({ ok: true, quiz });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || "server error" });
  }
});

// ✅ /api/quiz/XXXX
app.get("/api/quiz/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    const quiz = await fetchQuizById(id);
    if (!quiz) return res.status(404).json({ ok: false, error: "quiz not found" });
    return res.json({ ok: true, quiz });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || "server error" });
  }
});

app.get("/", (req,res)=> res.json({ ok:true, service:"asala-results-api" }));

app.post("/webhooks/quiz-result", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== process.env.WEBHOOK_SECRET) return res.status(401).json({ ok:false, error:"unauthorized" });

  const { quizId, studentId, studentName, score, maxScore, startedAt, finishedAt, details } = req.body || {};
  if(!quizId || typeof score !== "number" || typeof maxScore !== "number"){
    return res.status(400).json({ ok:false, error:"missing fields" });
  }
  const { error } = await supabase.from("quiz_results").insert({
    quiz_id: String(quizId),
    student_id: studentId ? String(studentId) : null,
    student_name: studentName ? String(studentName) : null,
    score,
    max_score: maxScore,
    started_at: startedAt ? new Date(startedAt).toISOString() : null,
    finished_at: finishedAt ? new Date(finishedAt).toISOString() : new Date().toISOString(),
    details: details || null
  });
  if(error) return res.status(500).json({ ok:false, error: error.message });
  res.json({ ok:true });
});

app.get("/api/results", async (req, res) => {
  const quizId = req.query.quiz;
  if(!quizId) return res.status(400).json([]);

  const { data, error } = await supabase
    .from("quiz_results")
    .select("student_name, score, max_score, started_at, finished_at")
    .eq("quiz_id", String(quizId))
    .order("finished_at", { ascending: false })
    .limit(1000);

  if(error) return res.status(500).json({ ok:false, error: error.message });
  res.json((data || []).map(r => ({
    student_name: r.student_name,
    score: r.score,
    max_score: r.max_score,
    started_at: r.started_at,
    finished_at: r.finished_at
  })));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log("asala-results-api listening on", PORT));
