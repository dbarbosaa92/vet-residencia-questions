import { useEffect, useRef, useState } from "react";
import {
  fetchSubjects,
  fetchRandomQuestion,
  fetchReviewQuestion,
  insertAttempt,
  getAttemptsCount,
} from "../lib/api";

const LETTERS = ["A", "B", "C", "D", "E"];
const REVIEW_EVERY = 15;
const FILTER_KEY = "vetres_subject_filter";

export default function PracticeView() {
  const [subjects, setSubjects] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState(
    () => localStorage.getItem(FILTER_KEY) || "todas"
  );
  const [current, setCurrent] = useState(null); // { ...question, isReview }
  const [selected, setSelected] = useState(null);
  const [position, setPosition] = useState(0); // total já respondidas
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const bootRef = useRef(false);

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    (async () => {
      try {
        const [subs, count] = await Promise.all([fetchSubjects(), getAttemptsCount()]);
        setSubjects(subs);
        setPosition(count);
        await loadNext(count, subjectFilter);
      } catch (e) {
        setErrorMsg(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadNext(pos, filter) {
    setLoading(true);
    setErrorMsg(null);
    try {
      const dueForReview = pos > 0 && pos % REVIEW_EVERY === 0;
      let q = null;
      let isReview = false;

      if (dueForReview) {
        q = await fetchReviewQuestion();
        isReview = !!q;
      }
      if (!q) {
        q = await fetchRandomQuestion(filter);
      }

      if (!q) {
        setCurrent(null);
      } else {
        setCurrent({ ...q, isReview });
      }
      setSelected(null);
    } catch (e) {
      setErrorMsg(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function changeFilter(f) {
    setSubjectFilter(f);
    localStorage.setItem(FILTER_KEY, f);
    loadNext(position, f);
  }

  async function handleSelect(optIndex) {
    if (selected !== null || !current) return;
    setSelected(optIndex);
    const isCorrect = optIndex === current.correct;
    try {
      await insertAttempt({
        questionId: current.id,
        subject: current.subject,
        isCorrect,
        isReview: current.isReview,
      });
    } catch (e) {
      setErrorMsg(e.message || String(e));
    }
    setPosition((p) => p + 1);
  }

  function handleNext() {
    loadNext(position, subjectFilter);
  }

  if (errorMsg) {
    return (
      <div className="card empty-state">
        <h3>Não consegui falar com o banco de questões</h3>
        <p className="muted">{errorMsg}</p>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
          Confira se <code>VITE_SUPABASE_URL</code> e{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> estão configuradas (veja o README).
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="tab-grid" style={{ marginBottom: 18 }}>
        <button
          className={`tab-chip ${subjectFilter === "todas" ? "selected" : ""}`}
          onClick={() => changeFilter("todas")}
        >
          Todas as matérias
        </button>
        {subjects.map((s) => (
          <button
            key={s}
            className={`tab-chip ${subjectFilter === s ? "selected" : ""}`}
            onClick={() => changeFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && !current && (
        <div className="card empty-state">
          <p className="muted">Carregando questão…</p>
        </div>
      )}

      {!loading && !current && (
        <div className="card empty-state">
          <h3>Sem questões por aqui ainda</h3>
          <p className="muted">
            Adicione questões na tabela <code>questions</code> do Supabase para essa matéria.
          </p>
        </div>
      )}

      {current && (
        <div className="card">
          <div className="quiz-progress">
            <span className="counter mono">Questão nº {position + 1}</span>
            {current.isReview ? (
              <span className="subject-tag review-tag">🔁 Revisão</span>
            ) : (
              <span className="subject-tag">{current.subject}</span>
            )}
          </div>

          <p className="question-text">{current.text}</p>

          <div className="options">
            {current.options.map((opt, i) => {
              let cls = "option";
              if (selected !== null) {
                if (i === current.correct) cls += " correct";
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
              <span className={`feedback-msg ${selected === current.correct ? "correct" : "wrong"}`}>
                {selected === current.correct
                  ? "Certinho! ✓"
                  : `Não foi dessa vez — a correta é a ${LETTERS[current.correct]}.`}
              </span>
              <button className="btn btn-primary" onClick={handleNext} disabled={loading}>
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
