import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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