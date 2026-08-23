"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <aside className="sidebar">
      <h2 className="sidebar-logo">
        🐶 PetFunCR
      </h2>

      <nav>
        {opciones.map((opcion) => {
          const activo =
            opcion.ruta === "/"
              ? pathname === "/"
              : pathname.startsWith(opcion.ruta);

          return (
            <Link
              key={opcion.ruta}
              href={opcion.ruta}
              className={`sidebar-link ${
                activo ? "active" : ""
              }`}
            >
              <span style={{ marginRight: "10px" }}>
                {opcion.icono}
              </span>

              {opcion.nombre}
            </Link>
          );
        })}
      </nav>

      <ThemeToggle />
    </aside>
  );
}