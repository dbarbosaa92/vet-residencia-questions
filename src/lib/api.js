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
