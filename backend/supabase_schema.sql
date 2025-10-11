create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  quiz_id text not null,
  student_id text,
  student_name text,
  score int not null,
  max_score int not null,
  started_at timestamptz,
  finished_at timestamptz default now(),
  details jsonb
);
create index if not exists idx_quiz_results_quiz on public.quiz_results (quiz_id);