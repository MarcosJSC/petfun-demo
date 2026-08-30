"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
    ruta: "/estadias/calendario",
    icono: "🏨",
  },
  {
  nombre: "Reportes",
  ruta: "/reportes",
  icono: "📊",
},
  {
    nombre: "Configuración",
    ruta: "/configuracion",
    icono: "⚙️",
  },
];



export default function Sidebar() {

const [
  mostrarConfirmacionCerrarSesion,
  setMostrarConfirmacionCerrarSesion,
] = useState(false);

  const pathname = usePathname();

  const router = useRouter();

const [nombreUsuario, setNombreUsuario] =
  useState("");

const [rolUsuario, setRolUsuario] =
  useState("");

  const [menuAbierto, setMenuAbierto] =
    useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

useEffect(() => {
  async function cargarPerfil() {
    const {
      data: { user },
    } = await supabase.auth.getUser();



    if (!user) {
      return;
    }

    const { data, error } =
      await supabase
        .from("perfiles_usuario")
        .select(`
          nombre,
          rol
        `)
        .eq(
          "usuario_id",
          user.id
        )
        .single();



if (error) {
  console.error(
    "Error cargando perfil:",
    {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    }
  );

  return;
}

    setNombreUsuario(
      data?.nombre || ""
    );

    setRolUsuario(
      data?.rol || ""
    );
  }

  cargarPerfil();
}, []);

async function cerrarSesion() {
  await supabase.auth.signOut();

  router.replace("/login");
  router.refresh();
}



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
  opcion.nombre === "Dashboard"
    ? pathname === "/"
    : opcion.nombre === "Estadías"
      ? pathname.startsWith("/estadias")
      : pathname.startsWith(opcion.ruta);

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

        <div className="sidebar-user">
  <div className="sidebar-user-name">
    👤 {nombreUsuario || "Usuario"}
  </div>

  <div className="sidebar-user-role">
    {rolUsuario === "superadmin"
      ? "Superadministrador"
      : rolUsuario === "administrador"
        ? "Administrador"
        : rolUsuario === "operador"
          ? "Operador"
          : rolUsuario === "consulta"
            ? "Consulta"
            : ""}
  </div>
</div>

<button
  type="button"
  className="secondary-button sidebar-logout"
  onClick={() => {
    setMenuAbierto(false);
    setMostrarConfirmacionCerrarSesion(true);
  }}
>
  Cerrar sesión
</button>

<ThemeToggle />

      </aside>

{mostrarConfirmacionCerrarSesion && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setMostrarConfirmacionCerrarSesion(false);
      }
    }}
  >
    <div className="modal">
      <div className="modal-header">
        <h2>
          Cerrar sesión
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            setMostrarConfirmacionCerrarSesion(false)
          }
        >
          ×
        </button>
      </div>

      <div className="modal-body">
        <p>
          ¿Seguro que deseas cerrar sesión?
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              setMostrarConfirmacionCerrarSesion(false)
            }
          >
            Cancelar
          </button>

          <button
            type="button"
            className="danger-button"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </>
  );
}