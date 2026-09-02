"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import ThemeToggle from "@/components/ThemeToggle";

import {
  useSucursalActiva,
} from "@/contexts/SucursalContext";

import {
  usePermisos,
} from "@/hooks/usePermisos";


const opciones = [
  {
    nombre: "Dashboard",
    ruta: "/",
    icono: "▦",
    permiso: null,
  },
  {
    nombre: "Propietarios",
    ruta: "/propietarios",
    icono: "👤",
    permiso: "propietarios.ver",
  },
  {
    nombre: "Perritos",
    ruta: "/perritos",
    icono: "🐾",
    permiso: "perritos.ver",
  },
  {
    nombre: "Estadías",
    ruta: "/estadias/calendario",
    icono: "🏨",
    permiso: "estadias.ver",
  },
  {
    nombre: "Reportes",
    ruta: "/reportes",
    icono: "📊",
    permiso: "reportes.ver",
  },
  {
    nombre: "Configuración",
    ruta: "/configuracion",
    icono: "⚙️",
    permiso: "configuracion.ver",
  },
] as const;



export default function Sidebar() {



 const {
  sucursalActivaId,
  setSucursalActivaId,
} = useSucursalActiva();

const {
  esSuperadmin,
} = usePermisos();

const [
  sucursalesDisponibles,
  setSucursalesDisponibles,
] = useState<
  {
    id: number;
    nombre: string;
  }[]
>([]); 

useEffect(() => {
  if (!esSuperadmin) {
    return;
  }

  async function cargarSucursales() {
    const { data, error } =
      await supabase
        .from("sucursales")
        .select(`
          id,
          nombre
        `)
        .eq("activa", true)
        .order("nombre", {
          ascending: true,
        });

    if (error) {
      console.error(
        "Error cargando sucursales:",
        error
      );

      return;
    }

    setSucursalesDisponibles(
      data ?? []
    );
  }

  cargarSucursales();
}, [esSuperadmin]);

const [
  mostrarConfirmacionCerrarSesion,
  setMostrarConfirmacionCerrarSesion,
] = useState(false);

const [
  mostrarCambiarPassword,
  setMostrarCambiarPassword,
] = useState(false);

const [
  nuevaPassword,
  setNuevaPassword,
] = useState("");

const [
  confirmarPassword,
  setConfirmarPassword,
] = useState("");

const [
  guardandoPassword,
  setGuardandoPassword,
] = useState(false);

const [
  mensajePassword,
  setMensajePassword,
] = useState("");

  const pathname = usePathname();

  const router = useRouter();

  const {
  puede,
  cargandoRol,
} = usePermisos();

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

function abrirCambiarPassword() {
  setMenuAbierto(false);

  setNuevaPassword("");
  setConfirmarPassword("");
  setMensajePassword("");

  setMostrarCambiarPassword(true);
}


function cerrarCambiarPassword() {
  if (guardandoPassword) {
    return;
  }

  setMostrarCambiarPassword(false);

  setNuevaPassword("");
  setConfirmarPassword("");
  setMensajePassword("");
}


async function cambiarPassword() {
  if (nuevaPassword.length < 8) {
    setMensajePassword(
      "La contraseña debe tener al menos 8 caracteres."
    );

    return;
  }

  if (
    nuevaPassword !==
    confirmarPassword
  ) {
    setMensajePassword(
      "Las contraseñas no coinciden."
    );

    return;
  }

  setGuardandoPassword(true);
  setMensajePassword("");

  try {
    const {
      error,
    } =
      await supabase.auth.updateUser({
        password: nuevaPassword,
      });

    if (error) {
      console.error(
        "Error cambiando contraseña:",
        error
      );

      setMensajePassword(
        error.message ||
          "No se pudo cambiar la contraseña."
      );

      return;
    }

    setNuevaPassword("");
    setConfirmarPassword("");

    setMensajePassword(
      "Contraseña actualizada correctamente."
    );

  } catch (error) {
    console.error(
      "Error inesperado cambiando contraseña:",
      error
    );

    setMensajePassword(
      "Ocurrió un error al cambiar la contraseña."
    );

  } finally {
    setGuardandoPassword(false);
  }
}

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
  {!cargandoRol &&
    opciones
      .filter((opcion) => {
        /*
         * Las opciones sin permiso,
         * como Dashboard,
         * siempre se muestran.
         */
        if (!opcion.permiso) {
          return true;
        }

        /*
         * Las demás solo se muestran
         * si el usuario tiene permiso.
         */
        return puede(
          opcion.permiso
        );
      })
      .map((opcion) => {
        const activo =
          opcion.nombre === "Dashboard"
            ? pathname === "/"
            : opcion.nombre === "Estadías"
              ? pathname.startsWith(
                  "/estadias"
                )
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

{esSuperadmin && (
  <div
    style={{
      marginTop: "14px",
      marginBottom: "14px",
    }}
  >
    <label
      style={{
        display: "block",
        marginBottom: "6px",
        fontSize: "12px",
        fontWeight: 600,
        color:
          "var(--color-text-secondary)",
      }}
    >
      Sucursal activa
    </label>

    <select
      className="form-select"
      value={
        sucursalActivaId === null
          ? "global"
          : String(sucursalActivaId)
      }
      onChange={(e) => {
        const valor =
          e.target.value;

        if (valor === "global") {
          setSucursalActivaId(null);
          return;
        }

        setSucursalActivaId(
          Number(valor)
        );
      }}
    >
      <option value="global">
        Todas las sucursales
      </option>

      {sucursalesDisponibles.map(
        (sucursal) => (
          <option
            key={sucursal.id}
            value={sucursal.id}
          >
            {sucursal.nombre}
          </option>
        )
      )}
    </select>
  </div>
)}

<button
  type="button"
  className="secondary-button sidebar-logout"
  onClick={
    abrirCambiarPassword
  }
  style={{
    marginBottom: "8px",
  }}
>
  🔐 Cambio Clave
</button>

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

{mostrarCambiarPassword && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (
        e.target ===
        e.currentTarget
      ) {
        cerrarCambiarPassword();
      }
    }}
  >
    <div className="modal">

      <div className="modal-header">
        <h2>
          Cambiar contraseña
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={
            cerrarCambiarPassword
          }
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>


      <div className="modal-body">

        <p
          style={{
            marginTop: 0,
            color:
              "var(--color-text-secondary)",
          }}
        >
          Ingresa tu nueva contraseña.
        </p>


        <form
          onSubmit={(e) => {
            e.preventDefault();

            cambiarPassword();
          }}
        >
          <div className="form-grid">

            <div className="form-group full">
              <label className="form-label">
                Nueva contraseña *
              </label>

              <input
                type="password"
                className="form-input"
                value={nuevaPassword}
                onChange={(e) =>
                  setNuevaPassword(
                    e.target.value
                  )
                }
                minLength={8}
                required
                autoFocus
              />

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "12px",
                  color:
                    "var(--color-text-secondary)",
                }}
              >
                Mínimo 8 caracteres.
              </div>
            </div>


            <div className="form-group full">
              <label className="form-label">
                Confirmar contraseña *
              </label>

              <input
                type="password"
                className="form-input"
                value={
                  confirmarPassword
                }
                onChange={(e) =>
                  setConfirmarPassword(
                    e.target.value
                  )
                }
                minLength={8}
                required
              />
            </div>

          </div>


          {mensajePassword && (
            <div
              className="status-message"
              style={{
                marginTop: "14px",
              }}
            >
              {mensajePassword}
            </div>
          )}


          <div className="modal-footer">

            <button
              type="button"
              className="secondary-button"
              onClick={
                cerrarCambiarPassword
              }
              disabled={
                guardandoPassword
              }
            >
              Cerrar
            </button>


            <button
              type="submit"
              className="primary-button"
              disabled={
                guardandoPassword
              }
            >
              {guardandoPassword
                ? "Guardando..."
                : "Cambiar contraseña"}
            </button>

          </div>

        </form>

      </div>
    </div>
  </div>
)}


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