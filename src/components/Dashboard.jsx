import { useEffect, useState } from "react";
import { fetchAllAttempts, fetchSubjects } from "../lib/api";

function barColor(pct) {
  if (pct >= 70) return "var(--success)";
  if (pct >= 40) return "var(--accent)";
  return "var(--danger)";
}

export default function Dashboard() {
  const [attempts, setAttempts] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [a, s] = await Promise.all([fetchAllAttempts(), fetchSubjects()]);
        setAttempts(a);
        setSubjects(s);
      } catch (e) {
        setErrorMsg(e.message || String(e));
      }
    })();
  }, []);

  if (errorMsg) {
    return (
      <div className="card empty-state">
        <h3>Não consegui carregar o desempenho</h3>
        <p className="muted">{errorMsg}</p>
      </div>
    );
  }

  if (attempts === null) {
    return (
      <div className="card empty-state">
        <p className="muted">Carregando…</p>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="card empty-state">
        <h3>Ainda sem histórico</h3>
        <p>Responda algumas questões na aba Praticar para ver o desempenho por matéria aqui.</p>
      </div>
    );
  }

  const overall = {
    total: attempts.length,
    correct: attempts.filter((a) => a.is_correct).length,
    reviews: attempts.filter((a) => a.is_review).length,
  };
  const overallPct = Math.round((overall.correct / overall.total) * 100);

  const bySubject = {};
  subjects.forEach((s) => (bySubject[s] = { total: 0, correct: 0 }));
  attempts.forEach((a) => {
    if (!bySubject[a.subject]) bySubject[a.subject] = { total: 0, correct: 0 };
    bySubject[a.subject].total += 1;
    if (a.is_correct) bySubject[a.subject].correct += 1;
  });

  const rows = Object.entries(bySubject)
    .map(([subject, st]) => ({
      subject,
      ...st,
      pct: st.total ? Math.round((st.correct / st.total) * 100) : null,
    }))
    .sort((a, b) => {
      if (a.pct === null) return 1;
      if (b.pct === null) return -1;
      return a.pct - b.pct; // matéria mais fraca primeiro
    });

  return (
    <div>
      <div className="dash-overview">
        <div className="stat-card">
          <div className="label">Respondidas</div>
          <div className="value mono">{overall.total}</div>
        </div>
        <div className="stat-card">
          <div className="label">Acertos</div>
          <div className="value success mono">{overall.correct}</div>
        </div>
        <div className="stat-card">
          <div className="label">Aproveitamento</div>
          <div className="value accent mono">{overallPct}%</div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Desempenho por matéria</h3>
        {rows.map((r) => (
          <div className="subject-row" key={r.subject}>
            <div className="subject-row-head">
              <span className="name">{r.subject}</span>
              <span className="pct">{r.pct === null ? "—" : `${r.pct}%`}</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${r.pct ?? 0}%`,
                  background: r.pct === null ? "transparent" : barColor(r.pct),
                }}
              />
            </div>
            <div className="subject-row-foot">
              {r.total ? `${r.correct} certas de ${r.total}` : "ainda não estudada"}
            </div>
          </div>
        ))}
        <p className="count-hint mono" style={{ marginTop: 16 }}>
          {overall.reviews} dessas foram questões de revisão
        </p>
      </div>
    </div>
  );
}
