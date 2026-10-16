"use client";

import { useEffect, useState } from "react";

type Tema = "light" | "dark";

const estiloIcono = {
  width: "38px",
  minWidth: "38px",
  height: "38px",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  lineHeight: 1,
  flexShrink: 0,
} as const;

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
    document.documentElement.setAttribute("data-theme", nuevoTema);
    localStorage.setItem("petfun-tema", nuevoTema);
  }

  if (!cargado) {
    return (
      <button
        className="theme-button theme-button-icon"
        type="button"
        disabled
        aria-label="Cargando tema"
        title="Cargando tema"
        style={estiloIcono}
      >
        🌙
      </button>
    );
  }

  const etiqueta = tema === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro";

  return (
    <button
      className="theme-button theme-button-icon"
      onClick={cambiarTema}
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      style={estiloIcono}
    >
      {tema === "light" ? "🌙" : "☀️"}
    </button>
  );
}
