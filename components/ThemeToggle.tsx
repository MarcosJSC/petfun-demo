"use client";

import { useEffect, useState } from "react";

type Tema = "light" | "dark";

export default function ThemeToggle() {
  const [tema, setTema] = useState<Tema>("light");
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    const temaGuardado = localStorage.getItem("petfun-tema") as Tema | null;

    const temaSistema = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
      ? "dark"
      : "light";

    const temaInicial = temaGuardado || temaSistema;

    setTema(temaInicial);
    document.documentElement.setAttribute("data-theme", temaInicial);

    setCargado(true);
  }, []);

  function cambiarTema() {
    const nuevoTema: Tema = tema === "light" ? "dark" : "light";

    setTema(nuevoTema);

    document.documentElement.setAttribute(
      "data-theme",
      nuevoTema
    );

    localStorage.setItem("petfun-tema", nuevoTema);
  }

  if (!cargado) {
    return (
      <button className="theme-button" disabled>
        Apariencia
      </button>
    );
  }

  return (
    <button
      className="theme-button"
      onClick={cambiarTema}
      type="button"
    >
      {tema === "light"
        ? "🌙 Modo oscuro"
        : "☀️ Modo claro"}
    </button>
  );
}