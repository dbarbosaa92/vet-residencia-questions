import { useState } from "react";
import "./App.css";
import PracticeView from "./components/PracticeView";
import ExamView from "./components/ExamView";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [view, setView] = useState("practice"); // "practice" | "exams" | "dashboard"

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="eyebrow">Residência · Grandes Animais</span>
          <h1>Sala de Estudo</h1>
        </div>
        <nav className="nav">
          <button
            className={view === "practice" ? "active" : ""}
            onClick={() => setView("practice")}
          >
            Praticar
          </button>
          <button
            className={view === "exams" ? "active" : ""}
            onClick={() => setView("exams")}
          >
            Provas
          </button>
          <button
            className={view === "dashboard" ? "active" : ""}
            onClick={() => setView("dashboard")}
          >
            Desempenho
          </button>
        </nav>
      </header>

      <p className="header-message">
        Olá futura residente! Lembre-se sempre:{" "}
        <em>
          "Deus não coloca em nosso coração um sonho ou desejo que Ele mesmo
          não seja capaz de realizar"
        </em>{" "}
         Vai dar tudo certo!!!
      </p>

      <div className="vitals-rule" aria-hidden="true" />

      {view === "practice" && <PracticeView />}
      {view === "exams" && <ExamView />}
      {view === "dashboard" && <Dashboard />}
    </div>
  );
}
