import { supabase } from "./supabaseClient";

/** Lista de matérias distintas presentes no banco de questões. */
export async function fetchSubjects() {
  const { data, error } = await supabase.from("questions").select("subject");
  if (error) throw error;
  return [...new Set(data.map((r) => r.subject))].sort();
}

/** Conta quantas questões existem (opcionalmente filtradas por matéria). */
async function countQuestions(subject) {
  let q = supabase.from("questions").select("*", { count: "exact", head: true });
  if (subject && subject !== "todas") q = q.eq("subject", subject);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

/** Busca uma questão aleatória (opcionalmente filtrada por matéria). */
export async function fetchRandomQuestion(subject) {
  const total = await countQuestions(subject);
  if (total === 0) return null;
  const offset = Math.floor(Math.random() * total);

  let q = supabase.from("questions").select("*").range(offset, offset);
  if (subject && subject !== "todas") q = q.eq("subject", subject);
  const { data, error } = await q;
  if (error) throw error;
  return data?.[0] ?? null;
}

/**
 * Busca uma questão já respondida antes, para revisão.
 * Prioriza questões que ela errou; se nunca errou nada ainda,
 * pega qualquer uma já respondida.
 */
export async function fetchReviewQuestion() {
  let { data: wrong, error } = await supabase
    .from("attempts")
    .select("question_id, created_at")
    .eq("is_correct", false)
    .order("created_at", { ascending: true })
    .limit(30);
  if (error) throw error;

  let candidateIds = [...new Set((wrong ?? []).map((r) => r.question_id))];

  if (candidateIds.length === 0) {
    const { data: any, error: err2 } = await supabase
      .from("attempts")
      .select("question_id, created_at")
      .order("created_at", { ascending: true })
      .limit(30);
    if (err2) throw err2;
    candidateIds = [...new Set((any ?? []).map((r) => r.question_id))];
  }

  if (candidateIds.length === 0) return null;

  const pickId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
  const { data: question, error: err3 } = await supabase
    .from("questions")
    .select("*")
    .eq("id", pickId)
    .single();
  if (err3) throw err3;
  return question;
}

export async function insertAttempt({ questionId, subject, isCorrect, isReview }) {
  const { error } = await supabase.from("attempts").insert({
    question_id: questionId,
    subject,
    is_correct: isCorrect,
    is_review: isReview,
  });
  if (error) throw error;
}

export async function getAttemptsCount() {
  const { count, error } = await supabase
    .from("attempts")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

/** Traz todas as tentativas (uso pessoal — volume baixo, agrega no cliente). */
export async function fetchAllAttempts() {
  const { data, error } = await supabase
    .from("attempts")
    .select("subject, is_correct, is_review, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Lista de provas completas disponíveis, com a contagem de questões de cada uma. */
export async function fetchExams() {
  const { data, error } = await supabase
    .from("questions")
    .select("exam_source")
    .not("exam_source", "is", null);
  if (error) throw error;

  const counts = {};
  data.forEach((r) => {
    counts[r.exam_source] = (counts[r.exam_source] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/** Todas as questões de uma prova completa, na ordem original dela. */
export async function fetchExamQuestions(examSource) {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("exam_source", examSource)
    .order("exam_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Registra o resultado de um simulado completo. */
export async function insertExamResult({ examSource, total, correct, bySubject }) {
  const { error } = await supabase.from("exam_results").insert({
    exam_source: examSource,
    total,
    correct,
    by_subject: bySubject,
  });
  if (error) throw error;
}

/** Histórico de simulados já feitos (uso pessoal — volume baixo, agrega no cliente). */
export async function fetchExamHistory() {
  const { data, error } = await supabase
    .from("exam_results")
    .select("exam_source, total, correct, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
