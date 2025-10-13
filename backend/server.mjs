import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// ──────────────────────────────
// إعداد التطبيق
// ──────────────────────────────
const app = express();

// CORS: السماح لواجهة GitHub Pages فقط
const allowedOrigins = [
  "https://mohammadalshamrani-dot.github.io",
  "https://mohammadalshamrani-dot.github.io/secure-quiz-asala"
];

const corsOptions = {
  origin(origin, callback) {
    // السماح لطلبات بدون Origin (مثل healthchecks/Postman/Render)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn("❌ CORS Blocked Request from:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));         // دعم preflight
app.use(express.json());                     // JSON body parser

// ──────────────────────────────
// Supabase client
// ──────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ──────────────────────────────
// Health & Root
// ──────────────────────────────
app.get("/", (req, res) => res.json({ ok: true, service: "asala-results-api" }));

app.get("/api/health", (req, res) =>
  res.json({ ok: true, service: "secure-quiz-asala-1" })
);

// ──────────────────────────────
// هيلبر: جلب الاختبار من قاعدة البيانات بالـ id
// استخدم env QUIZ_TABLE لاسم الجدول إن كان مختلفًا، وإلا سيجرب عدة أسماء شائعة
// ──────────────────────────────
async function fetchQuizById(id) {
  const tables =
    (process.env.QUIZ_TABLE ? process.env.QUIZ_TABLE.split(",") : null) ||
    ["quizzes", "exams", "quiz", "tests"];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single();

    if (data) return data;
    // PGRST116 = not found. غيره نسجله كتحذير ونكمل
    if (error && error.code && error.code !== "PGRST116") {
      console.warn(`[fetchQuizById] table=${table} error=`, error.message);
    }
  }
  return null;
}

// ──────────────────────────────
// API: جلب بيانات الاختبار
// ──────────────────────────────

// /api/quiz?id=XXXX
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

// /api/quiz/XXXX
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

// ──────────────────────────────
// Webhook حفظ نتيجة (موجود في ملفك الأصلي – أبقيته كما هو مع تنسيق)
// ──────────────────────────────
app.post("/webhooks/quiz-result", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const {
    quizId,
    studentId,
    studentName,
    score,
    maxScore,
    startedAt,
    finishedAt,
    details
  } = req.body || {};

  if (!quizId || typeof score !== "number" || typeof maxScore !== "number") {
    return res.status(400).json({ ok: false, error: "missing fields" });
  }

  const { error } = await supabase.from("quiz_results").insert({
    quiz_id: String(quizId),
    student_id: studentId ? String(studentId) : null,
    student_name: studentName ? String(studentName) : null,
    score,
    max_score: maxScore,
    started_at: startedAt ? new Date(startedAt).toISOString() : null,
    finished_at: finishedAt ? new Date(finishedAt).toISOString() : null,
    details: details ?? null
  });

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true });
});

// ──────────────────────────────
// تشغيل السيرفر
// ──────────────────────────────
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ API running on port ${PORT}`);
});
