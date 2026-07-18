import { useEffect, useRef, useState } from "react";
import {
  fetchExams,
  fetchExamHistory,
  fetchExamQuestions,
  insertExamResult,
} from "../lib/api";

const LETTERS = ["A", "B", "C", "D", "E"];

export default function ExamView() {
  const [stage, setStage] = useState("list"); // "list" | "running" | "summary"
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [activeExam, setActiveExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]); // { subject, isCorrect }

  const bootRef = useRef(false);

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadList() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [ex, hist] = await Promise.all([fetchExams(), fetchExamHistory()]);
      setExams(ex);
      setHistory(hist);
    } catch (e) {
      setErrorMsg(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function bestFor(examSource) {
    const rows = history.filter((h) => h.exam_source === examSource);
    if (rows.length === 0) return null;
    return rows.reduce((best, r) =>
      r.correct / r.total > best.correct / best.total ? r : best
    );
  }

  async function startExam(examSource) {
    setLoading(true);
    setErrorMsg(null);
    try {
      const qs = await fetchExamQuestions(examSource);
      setActiveExam(examSource);
      setQuestions(qs);
      setIndex(0);
      setSelected(null);
      setAnswers([]);
      setStage("running");
    } catch (e) {
      setErrorMsg(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(optIndex) {
    if (selected !== null) return;
    setSelected(optIndex);
  }

  async function handleNext() {
    const q = questions[index];
    const isCorrect = selected === q.correct;
    const nextAnswers = [...answers, { subject: q.subject, isCorrect }];
    setAnswers(nextAnswers);

    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelected(null);
    } else {
      await finishExam(nextAnswers);
    }
  }

  async function finishExam(finalAnswers) {
    const total = finalAnswers.length;
    const correct = finalAnswers.filter((a) => a.isCorrect).length;
    const bySubject = {};
    finalAnswers.forEach((a) => {
      if (!bySubject[a.subject]) bySubject[a.subject] = { total: 0, correct: 0 };
      bySubject[a.subject].total += 1;
      if (a.isCorrect) bySubject[a.subject].correct += 1;
    });

    try {
      await insertExamResult({ examSource: activeExam, total, correct, bySubject });
    } catch (e) {
      setErrorMsg(e.message || String(e));
    }
    setStage("summary");
    loadList();
  }

  function backToList() {
    setStage("list");
    setActiveExam(null);
  }

  if (errorMsg) {
    return (
      <div className="card empty-state">
        <h3>Não consegui falar com o banco de questões</h3>
        <p className="muted">{errorMsg}</p>
      </div>
    );
  }

  if (stage === "running") {
    if (loading || questions.length === 0) {
      return (
        <div className="card empty-state">
          <p className="muted">Carregando prova…</p>
        </div>
      );
    }

    const q = questions[index];
    const pct = Math.round((index / questions.length) * 100);

    return (
      <div className="card">
        <div className="quiz-progress">
          <span className="counter mono">
            Questão {index + 1} de {questions.length}
          </span>
          <span className="subject-tag">{q.subject}</span>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>

        {q.exam_source && <p className="exam-source-hint mono">{q.exam_source}</p>}

        <p className="question-text">{q.text}</p>

        <div className="options">
          {q.options.map((opt, i) => {
            let cls = "option";
            if (selected !== null) {
              if (i === q.correct) cls += " correct";
              else if (i === selected) cls += " wrong";
            }
            return (
              <button
                key={i}
                className={cls}
                disabled={selected !== null}
                onClick={() => handleSelect(i)}
              >
                <span className="letter">{LETTERS[i]}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className="feedback-bar">
            <span className={`feedback-msg ${selected === q.correct ? "correct" : "wrong"}`}>
              {selected === q.correct
                ? "Certinho! ✓"
                : `Não foi dessa vez — a correta é a ${LETTERS[q.correct]}.`}
            </span>
            <button className="btn btn-primary" onClick={handleNext}>
              {index + 1 < questions.length ? "Próxima" : "Ver resultado"}
            </button>
          </div>
        )}

        <button className="reset-link" onClick={backToList}>
          Sair da prova sem terminar
        </button>
      </div>
    );
  }

  if (stage === "summary") {
    const total = answers.length;
    const correct = answers.filter((a) => a.isCorrect).length;
    const pct = total ? Math.round((correct / total) * 100) : 0;

    const bySubject = {};
    answers.forEach((a) => {
      if (!bySubject[a.subject]) bySubject[a.subject] = { total: 0, correct: 0 };
      bySubject[a.subject].total += 1;
      if (a.isCorrect) bySubject[a.subject].correct += 1;
    });
    const rows = Object.entries(bySubject).map(([subject, st]) => ({
      subject,
      ...st,
      pct: Math.round((st.correct / st.total) * 100),
    }));

    return (
      <div className="card">
        <h3 className="section-title">{activeExam} — resultado</h3>
        <p className="summary-score">
          {correct}/{total} <span>({pct}%)</span>
        </p>
        <div className="summary-grid">
          {rows.map((r) => (
            <div className="summary-row" key={r.subject}>
              <span>{r.subject}</span>
              <span className="mono">
                {r.correct}/{r.total} ({r.pct}%)
              </span>
            </div>
          ))}
        </div>
        <div className="summary-actions">
          <button className="btn btn-primary" onClick={() => startExam(activeExam)}>
            Refazer essa prova
          </button>
          <button className="btn btn-ghost" onClick={backToList}>
            Voltar para provas
          </button>
        </div>
      </div>
    );
  }

  // stage === "list"
  return (
    <div>
      {loading && exams.length === 0 && (
        <div className="card empty-state">
          <p className="muted">Carregando provas…</p>
        </div>
      )}

      {!loading && exams.length === 0 && (
        <div className="card empty-state">
          <h3>Nenhuma prova completa cadastrada ainda</h3>
          <p className="muted">
            Marque questões com <code>exam_source</code> (e <code>exam_order</code>)
            na tabela <code>questions</code> do Supabase pra elas aparecerem aqui
            como uma prova completa.
          </p>
        </div>
      )}

      <div className="exam-list">
        {exams.map((ex) => {
          const best = bestFor(ex.name);
          return (
            <div className="card exam-card" key={ex.name}>
              <div className="exam-card-head">
                <h3>{ex.name}</h3>
                <span className="count-hint mono">{ex.total} questões</span>
              </div>
              <p className="muted exam-best">
                {best
                  ? `Melhor resultado: ${best.correct}/${best.total} (${Math.round(
                      (best.correct / best.total) * 100
                    )}%)`
                  : "Ainda não tentada"}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => startExam(ex.name)}
                disabled={loading}
              >
                Começar prova
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
