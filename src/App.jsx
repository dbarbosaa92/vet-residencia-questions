import { useState } from "react";
import "./App.css";
import PracticeView from "./components/PracticeView";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [view, setView] = useState("practice"); // "practice" | "dashboard"

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
            className={view === "dashboard" ? "active" : ""}
            onClick={() => setView("dashboard")}
          >
            Desempenho
          </button>
        </nav>
      </header>

      <div className="vitals-rule" aria-hidden="true" />

      {view === "practice" && <PracticeView />}
      {view === "dashboard" && <Dashboard />}
    </div>
  );
}
