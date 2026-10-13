
"use client";

import { useEffect, useState } from "react";

type PreferenciaTema = "system" | "light" | "dark";
type TemaAplicado = "light" | "dark";

function obtenerTemaSistema(): TemaAplicado {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [preferencia, setPreferencia] =
    useState<PreferenciaTema>("system");
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem("petfun-tema");

    const inicial: PreferenciaTema =
      guardado === "light" || guardado === "dark" || guardado === "system"
        ? guardado
        : "system";

    setPreferencia(inicial);
    setCargado(true);

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function aplicarTema() {
      const tema: TemaAplicado =
        inicial === "system"
          ? obtenerTemaSistema()
          : inicial;

      document.documentElement.setAttribute("data-theme", tema);
      document.documentElement.style.colorScheme = tema;
    }

    function sincronizarTema() {
      const preferenciaActual =
        localStorage.getItem("petfun-tema") || "system";

      if (preferenciaActual === "system") {
        const tema = obtenerTemaSistema();
        document.documentElement.setAttribute("data-theme", tema);
        document.documentElement.style.colorScheme = tema;
      }
    }

    aplicarTema();
    media.addEventListener("change", sincronizarTema);

    return () => {
      media.removeEventListener("change", sincronizarTema);
    };
  }, []);

  function cambiarPreferencia(nueva: PreferenciaTema) {
    setPreferencia(nueva);
    localStorage.setItem("petfun-tema", nueva);

    const tema: TemaAplicado =
      nueva === "system" ? obtenerTemaSistema() : nueva;

    document.documentElement.setAttribute("data-theme", tema);
    document.documentElement.style.colorScheme = tema;
  }

  if (!cargado) {
    return (
      <button
        className="theme-button"
        type="button"
        disabled
        aria-label="Cargando preferencias de apariencia"
      >
        Apariencia
      </button>
    );
  }

  return (
    <label className="theme-control">
      <span className="theme-control-icon" aria-hidden="true">
        {preferencia === "system"
          ? "💡"
          : preferencia === "dark"
            ? "🌙"
            : "☀️"}
      </span>

      <select
        className="theme-select"
        aria-label="Preferencia de apariencia"
        value={preferencia}
        onChange={(evento) =>
          cambiarPreferencia(evento.target.value as PreferenciaTema)
        }
      >
        <option value="system">Tema</option>
        <option value="light">Claro</option>
        <option value="dark">Oscuro</option>
      </select>
    </label>
  );
}
