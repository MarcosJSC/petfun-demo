"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import ThemeToggle from "@/components/ThemeToggle";

const opciones = [
  {
    nombre: "Dashboard",
    ruta: "/",
    icono: "▦",
  },
  {
    nombre: "Propietarios",
    ruta: "/propietarios",
    icono: "👤",
  },
  {
    nombre: "Perritos",
    ruta: "/perritos",
    icono: "🐾",
  },
  {
    nombre: "Estadías",
    ruta: "/estadias",
    icono: "🏨",
  },
  {
    nombre: "Configuración",
    ruta: "/configuracion",
    icono: "⚙️",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [menuAbierto, setMenuAbierto] =
    useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  return (
    <>
      {/* BARRA SUPERIOR MÓVIL */}
      <div className="mobile-header">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() =>
            setMenuAbierto(true)
          }
          aria-label="Abrir menú"
        >
          ☰
        </button>

        <div className="mobile-logo">
          🐶 PetFunCR
        </div>
      </div>


      {/* FONDO OSCURO EN MÓVIL */}
      {menuAbierto && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() =>
            setMenuAbierto(false)
          }
          aria-label="Cerrar menú"
        />
      )}


      {/* SIDEBAR */}
      <aside
        className={`sidebar ${
          menuAbierto
            ? "sidebar-open"
            : ""
        }`}
      >
        <div className="sidebar-top">
          <h2 className="sidebar-logo">
            🐶 PetFunCR
          </h2>

          <button
            type="button"
            className="sidebar-close"
            onClick={() =>
              setMenuAbierto(false)
            }
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>

        <nav>
          {opciones.map((opcion) => {
            const activo =
              opcion.ruta === "/"
                ? pathname === "/"
                : pathname.startsWith(
                    opcion.ruta
                  );

            return (
              <Link
                key={opcion.ruta}
                href={opcion.ruta}
                className={`sidebar-link ${
                  activo ? "active" : ""
                }`}
              >
                <span
                  style={{
                    marginRight: "10px",
                  }}
                >
                  {opcion.icono}
                </span>

                {opcion.nombre}
              </Link>
            );
          })}
        </nav>

        <ThemeToggle />
      </aside>
    </>
  );
}