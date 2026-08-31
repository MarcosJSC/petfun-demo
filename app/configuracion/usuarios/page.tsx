"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type SucursalAsignada = {
  sucursal_id: number;

  sucursales: {
    id: number;
    nombre: string;
    activa: boolean;
  } | null;
};

type Sucursal = {
  id: number;
  nombre: string;
  activa: boolean;
};


type PerfilUsuario = {
  usuario_id: string;
  nombre: string;
  rol:
    | "superadmin"
    | "administrador"
    | "operador"
    | "consulta";

  activo: boolean;

  usuario_sucursales: SucursalAsignada[];
};

function nombreRol(
  rol: PerfilUsuario["rol"]
) {
  switch (rol) {
    case "superadmin":
      return "Superadministrador";

    case "administrador":
      return "Administrador";

    case "operador":
      return "Operador";

    case "consulta":
      return "Consulta";

    default:
      return rol;
  }
}

export default function UsuariosPage() {
  const router = useRouter();

  const [usuarios, setUsuarios] =
    useState<PerfilUsuario[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [autorizado, setAutorizado] =
    useState<boolean | null>(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

const [sucursales, setSucursales] =
  useState<Sucursal[]>([]);

const [modalNuevo, setModalNuevo] =
  useState(false);

const [nombreNuevo, setNombreNuevo] =
  useState("");

const [correoNuevo, setCorreoNuevo] =
  useState("");

const [passwordNuevo, setPasswordNuevo] =
  useState("");

  const [modalEditar, setModalEditar] =
  useState(false);

const [
  usuarioEditando,
  setUsuarioEditando,
] = useState<PerfilUsuario | null>(null);

const [nombreEditar, setNombreEditar] =
  useState("");

const [rolEditar, setRolEditar] =
  useState<PerfilUsuario["rol"]>(
    "operador"
  );

const [
  sucursalesEditar,
  setSucursalesEditar,
] = useState<number[]>([]);

const [activoEditar, setActivoEditar] =
  useState(true);

const [
  guardandoEditar,
  setGuardandoEditar,
] = useState(false);

const [rolNuevo, setRolNuevo] =
  useState<
    | "administrador"
    | "operador"
    | "consulta"
    | "superadmin"
  >("operador");

const [
  sucursalesSeleccionadas,
  setSucursalesSeleccionadas,
] = useState<number[]>([]);

const [activoNuevo, setActivoNuevo] =
  useState(true);

const [guardandoNuevo, setGuardandoNuevo] =
  useState(false);

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAutorizado(false);
        setCargando(false);
        return;
      }

      const { data: perfil, error } =
        await supabase
          .from("perfiles_usuario")
          .select(`
            rol,
            activo
          `)
          .eq(
            "usuario_id",
            user.id
          )
          .single();

      if (
        error ||
        !perfil ||
        !perfil.activo ||
        perfil.rol !== "superadmin"
      ) {
        setAutorizado(false);
        setCargando(false);
        return;
      }

      setAutorizado(true);

      await cargarUsuarios();

      await cargarSucursales();
    }

    iniciar();
  }, []);

  function abrirEditarUsuario(
  usuario: PerfilUsuario
) {
  setUsuarioEditando(usuario);

  setNombreEditar(
    usuario.nombre
  );

  setRolEditar(
    usuario.rol
  );

  setActivoEditar(
    usuario.activo
  );

  setSucursalesEditar(
    usuario.usuario_sucursales.map(
      (relacion) =>
        relacion.sucursal_id
    )
  );

  setMensaje("");

  setModalEditar(true);

  console.log(
  "EDITAR USUARIO",
  usuario
);
}

function cerrarEditarUsuario() {
  if (guardandoEditar) {
    return;
  }

  setModalEditar(false);
  setUsuarioEditando(null);
}

function cambiarSucursalEditar(
  sucursalId: number
) {
  setSucursalesEditar(
    (actuales) =>
      actuales.includes(sucursalId)
        ? actuales.filter(
            (id) =>
              id !== sucursalId
          )
        : [
            ...actuales,
            sucursalId,
          ]
  );
}

async function guardarUsuarioEditado() {
  if (!usuarioEditando) {
    return;
  }

  const nombreLimpio =
    nombreEditar.trim();

  if (!nombreLimpio) {
    setMensaje(
      "El nombre es obligatorio."
    );
    return;
  }

  if (
    rolEditar !== "superadmin" &&
    sucursalesEditar.length === 0
  ) {
    setMensaje(
      "Debes asignar al menos una sucursal."
    );
    return;
  }

  setGuardandoEditar(true);
  setMensaje("");

  const {
    data: { session },
  } =
    await supabase.auth.getSession();

  if (!session) {
    setMensaje(
      "La sesión ha expirado. Inicia sesión nuevamente."
    );

    setGuardandoEditar(false);
    return;
  }

  try {
    const respuesta =
      await fetch(
        "/api/admin/usuarios",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            usuarioId:
              usuarioEditando.usuario_id,

            nombre:
              nombreLimpio,

            rol:
              rolEditar,

            activo:
              activoEditar,

            sucursalIds:
              rolEditar ===
              "superadmin"
                ? []
                : sucursalesEditar,
          }),
        }
      );

    const resultado =
      await respuesta.json();

    if (!respuesta.ok) {
      setMensaje(
        resultado.error ||
          "No se pudo actualizar el usuario."
      );

      return;
    }

    setMensaje(
      "Usuario actualizado correctamente."
    );

    setModalEditar(false);
    setUsuarioEditando(null);

    await cargarUsuarios();

  } catch (error) {
    console.error(
      "Error actualizando usuario:",
      error
    );

    setMensaje(
      "Ocurrió un error al actualizar el usuario."
    );

  } finally {
    setGuardandoEditar(false);
  }
}

  async function cargarUsuarios() {
    setCargando(true);
    setMensaje("");

    const { data, error } =
      await supabase
        .from("perfiles_usuario")
        .select(`
          usuario_id,
          nombre,
          rol,
          activo,

          usuario_sucursales (
            sucursal_id,

            sucursales (
              id,
              nombre,
              activa
            )
          )
        `)
        .order(
          "nombre",
          {
            ascending: true,
          }
        );

    if (error) {
      console.error(
        "Error cargando usuarios:",
        error
      );

      setMensaje(
        "No se pudieron cargar los usuarios."
      );

      setCargando(false);
      return;
    }

    setUsuarios(
      (data ?? []) as unknown as
        PerfilUsuario[]
    );

    setCargando(false);
  }

  const usuariosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return usuarios;
      }

      return usuarios.filter(
        (usuario) => {
          const sucursales =
            usuario.usuario_sucursales
              .map(
                (relacion) =>
                  relacion.sucursales
                    ?.nombre || ""
              )
              .join(" ")
              .toLowerCase();

          return (
            usuario.nombre
              .toLowerCase()
              .includes(texto) ||
            nombreRol(
              usuario.rol
            )
              .toLowerCase()
              .includes(texto) ||
            sucursales.includes(
              texto
            )
          );
        }
      );
    }, [
      usuarios,
      busqueda,
    ]);

  const usuariosActivos =
    usuarios.filter(
      (usuario) =>
        usuario.activo
    ).length;

  if (
    cargando &&
    autorizado === null
  ) {
    return (
      <div className="empty-state">
        Cargando usuarios...
      </div>
    );
  }

  if (autorizado === false) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">
              Usuarios
            </h1>

            <p className="page-description">
              Administración de usuarios de PetFunCR.
            </p>
          </div>
        </div>

        <section className="card">
          <h2
            style={{
              marginTop: 0,
            }}
          >
            🔐 Acceso restringido
          </h2>

          <p
            style={{
              color:
                "var(--color-text-secondary)",
            }}
          >
            Solo un superadministrador puede
            administrar usuarios.
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              router.push(
                "/configuracion"
              )
            }
          >
            ← Volver a Configuración
          </button>
        </section>
      </div>
    );
  }

/*FUNCIONES*/

  async function cargarSucursales() {
  const { data, error } =
    await supabase
      .from("sucursales")
      .select(`
        id,
        nombre,
        activa
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

  setSucursales(
    (data ?? []) as Sucursal[]
  );
}

function abrirNuevoUsuario() {
  setNombreNuevo("");
  setCorreoNuevo("");
  setPasswordNuevo("");
  setRolNuevo("operador");
  setSucursalesSeleccionadas([]);
  setActivoNuevo(true);
  setMensaje("");

  setModalNuevo(true);
}

function cerrarNuevoUsuario() {
  if (guardandoNuevo) {
    return;
  }

  setModalNuevo(false);
}

function cambiarSucursal(
  sucursalId: number
) {
  setSucursalesSeleccionadas(
    (actuales) =>
      actuales.includes(sucursalId)
        ? actuales.filter(
            (id) =>
              id !== sucursalId
          )
        : [
            ...actuales,
            sucursalId,
          ]
  );
}

async function crearNuevoUsuario() {
  const nombreLimpio =
    nombreNuevo.trim();

  const correoLimpio =
    correoNuevo.trim().toLowerCase();

  if (!nombreLimpio) {
    setMensaje(
      "El nombre es obligatorio."
    );
    return;
  }

  if (!correoLimpio) {
    setMensaje(
      "El correo es obligatorio."
    );
    return;
  }

  if (passwordNuevo.length < 8) {
    setMensaje(
      "La contraseña debe tener al menos 8 caracteres."
    );
    return;
  }

  if (
    rolNuevo !== "superadmin" &&
    sucursalesSeleccionadas.length === 0
  ) {
    setMensaje(
      "Debes asignar al menos una sucursal."
    );
    return;
  }

  setGuardandoNuevo(true);
  setMensaje("");

  const {
    data: { session },
  } =
    await supabase.auth.getSession();

  if (!session) {
    setMensaje(
      "La sesión ha expirado. Inicia sesión nuevamente."
    );

    setGuardandoNuevo(false);
    return;
  }

  try {
    const respuesta =
      await fetch(
        "/api/admin/usuarios",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            nombre:
              nombreLimpio,

            email:
              correoLimpio,

            password:
              passwordNuevo,

            rol:
              rolNuevo,

            activo:
              activoNuevo,

            sucursalIds:
              rolNuevo ===
              "superadmin"
                ? []
                : sucursalesSeleccionadas,
          }),
        }
      );

    const resultado =
      await respuesta.json();

    if (!respuesta.ok) {
      setMensaje(
        resultado.error ||
          "No se pudo crear el usuario."
      );

      setGuardandoNuevo(false);
      return;
    }

    setMensaje(
      "Usuario creado correctamente."
    );

    setModalNuevo(false);

    setNombreNuevo("");
    setCorreoNuevo("");
    setPasswordNuevo("");
    setRolNuevo("operador");
    setSucursalesSeleccionadas([]);
    setActivoNuevo(true);

    await cargarUsuarios();

  } catch (error) {
    console.error(
      "Error creando usuario:",
      error
    );

    setMensaje(
      "Ocurrió un error al crear el usuario."
    );
  } finally {
    setGuardandoNuevo(false);
  }
}

/*RETURN PRINCIPAL*/
  return (
    <div>
      <div className="page-header">
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              router.push(
                "/configuracion"
              )
            }
            style={{
              marginBottom: "18px",
            }}
          >
            ← Configuración
          </button>

          <h1 className="page-title">
            👥 Usuarios
          </h1>

          <p className="page-description">
            Administra usuarios, roles y sucursales asignadas.
          </p>
        </div>

        <div className="page-header-actions">
 <button
  type="button"
  className="primary-button"
  onClick={abrirNuevoUsuario}
>
  + Nuevo usuario
</button>
        </div>
      </div>

      {mensaje && (
        <div className="status-message">
          {mensaje}
        </div>
      )}

      <div
        className="dashboard-grid user-summary-grid"
        style={{
          marginBottom: "24px",
        }}
      >
        <div className="card">
          <div className="card-label">
            Total de usuarios
          </div>

          <div className="card-value">
            {usuarios.length}
          </div>
        </div>

        <div className="card">
          <div className="card-label">
            Usuarios activos
          </div>

          <div className="card-value">
            {usuariosActivos}
          </div>
        </div>
      </div>

      <section className="list-card">
        <div className="list-toolbar">
          <div>
            <strong>
              Usuarios registrados
            </strong>

            <div
              style={{
                color:
                  "var(--color-text-secondary)",
                fontSize: "14px",
                marginTop: "3px",
              }}
            >
              Total: {usuariosFiltrados.length}
            </div>
          </div>

          <input
            className="search-input"
            placeholder="Buscar por nombre, rol o sucursal..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
          />
        </div>

        {cargando ? (
          <div className="empty-state">
            Cargando usuarios...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="empty-state">
            No se encontraron usuarios.
          </div>
        ) : (
          <>
            {/* ESCRITORIO */}

            <div className="desktop-only">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Sucursales</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosFiltrados.map(
                    (usuario) => {
                      const sucursales =
                        usuario.rol ===
                        "superadmin"
                          ? "Todas"
                          : usuario
                              .usuario_sucursales
                              .map(
                                (
                                  relacion
                                ) =>
                                  relacion
                                    .sucursales
                                    ?.nombre
                              )
                              .filter(
                                Boolean
                              )
                              .join(", ") ||
                            "Sin asignar";

                      return (
                        <tr
                          key={
                            usuario.usuario_id
                          }
                        >
                          <td>
                            <strong>
                              👤{" "}
                              {
                                usuario.nombre
                              }
                            </strong>
                          </td>

                          <td>
                            {nombreRol(
                              usuario.rol
                            )}
                          </td>

                          <td>
                            {sucursales}
                          </td>

                          <td>
                            <span
                              className={
                                usuario.activo
                                  ? "branch-status active"
                                  : "branch-status inactive"
                              }
                            >
                              {usuario.activo
                                ? "Activo"
                                : "Inactivo"}
                            </span>
                          </td>

                          <td>
<button
  type="button"
  className="secondary-button"
  onClick={() =>
    abrirEditarUsuario(usuario)
  }
>
  Editar
</button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* MÓVIL */}

            <div className="mobile-only user-mobile-list">
              {usuariosFiltrados.map(
                (usuario) => {
                  const sucursales =
                    usuario.rol ===
                    "superadmin"
                      ? ["Todas las sucursales"]
                      : usuario
                          .usuario_sucursales
                          .map(
                            (relacion) =>
                              relacion
                                .sucursales
                                ?.nombre
                          )
                          .filter(
                            Boolean
                          ) as string[];


                  return (
                    <div
                      key={
                        usuario.usuario_id
                      }
                      className="mobile-list-item"
                    >
                      <div className="branch-card-top">
                        <div className="mobile-list-title">
                          👤{" "}
                          {
                            usuario.nombre
                          }
                        </div>

                        <span
                          className={
                            usuario.activo
                              ? "branch-status active"
                              : "branch-status inactive"
                          }
                        >
                          {usuario.activo
                            ? "Activo"
                            : "Inactivo"}
                        </span>
                      </div>

                      <div className="mobile-list-grid">
                        <div>
                          <span className="mobile-list-label">
                            Rol
                          </span>

                          <strong>
                            {nombreRol(
                              usuario.rol
                            )}
                          </strong>
                        </div>

                        <div
                          style={{
                            gridColumn:
                              "1 / -1",
                          }}
                        >
                          <span className="mobile-list-label">
                            Sucursales
                          </span>

                          <strong>
                            {sucursales.length > 0
                              ? sucursales.join(
                                  ", "
                                )
                              : "Sin asignar"}
                          </strong>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: "14px",
                        }}
                      >
<button
  type="button"
  className="secondary-button"
  style={{
    width: "100%",
  }}
  onClick={() =>
    abrirEditarUsuario(usuario)
  }
>
  Editar usuario
</button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </section>

{modalNuevo && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (
        e.target ===
        e.currentTarget
      ) {
        cerrarNuevoUsuario();
      }
    }}
  >
    <div className="modal">

      <div className="modal-header">
        <h2>
          Nuevo usuario
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={
            cerrarNuevoUsuario
          }
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
c
      <div className="modal-body">

      <form
  onSubmit={(e) => {
    e.preventDefault();
    crearNuevoUsuario();
  }}
>
          <div className="form-grid">

            <div className="form-group full">
              <label className="form-label">
                Nombre *
              </label>

              <input
                className="form-input"
                value={nombreNuevo}
                onChange={(e) =>
                  setNombreNuevo(
                    e.target.value
                  )
                }
                required
                autoFocus
              />
            </div>

            <div className="form-group full">
              <label className="form-label">
                Correo *
              </label>

              <input
                type="email"
                className="form-input"
                value={correoNuevo}
                onChange={(e) =>
                  setCorreoNuevo(
                    e.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-group full">
              <label className="form-label">
                Contraseña temporal *
              </label>

              <input
                type="password"
                className="form-input"
                value={passwordNuevo}
                onChange={(e) =>
                  setPasswordNuevo(
                    e.target.value
                  )
                }
                minLength={8}
                required
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
                Rol *
              </label>

              <select
                className="form-input"
                value={rolNuevo}
                onChange={(e) =>
                  setRolNuevo(
                    e.target.value as
                      | "administrador"
                      | "operador"
                      | "consulta"
                      | "superadmin"
                  )
                }
              >
                <option value="operador">
                  Operador
                </option>

                <option value="consulta">
                  Consulta
                </option>

                <option value="administrador">
                  Administrador
                </option>

                <option value="superadmin">
                  Superadministrador
                </option>
              </select>
            </div>

            {rolNuevo !== "superadmin" && (
              <div className="form-group full">
                <label className="form-label">
                  Sucursales *
                </label>

                <div
                  style={{
                    display: "grid",
                    gap: "8px",
                    marginTop: "4px",
                  }}
                >
                  {sucursales.length === 0 ? (
                    <div
                      style={{
                        color:
                          "var(--color-text-secondary)",
                      }}
                    >
                      No hay sucursales activas.
                    </div>
                  ) : (
                    sucursales.map(
                      (sucursal) => (
                        <label
                          key={sucursal.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px",
                            border:
                              "1px solid var(--color-border)",
                            borderRadius:
                              "9px",
                            cursor:
                              "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              sucursalesSeleccionadas.includes(
                                sucursal.id
                              )
                            }
                            onChange={() =>
                              cambiarSucursal(
                                sucursal.id
                              )
                            }
                          />

                          <span>
                            {sucursal.nombre}
                          </span>
                        </label>
                      )
                    )
                  )}
                </div>
              </div>
            )}

            <div className="form-group full">
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={activoNuevo}
                  onChange={(e) =>
                    setActivoNuevo(
                      e.target.checked
                    )
                  }
                />

                <span>
                  Usuario activo
                </span>
              </label>
            </div>

          </div>

          <div className="modal-footer">
        <button
  type="submit"
  className="primary-button"
  disabled={
    guardandoNuevo
  }
>
  {guardandoNuevo
    ? "Creando..."
    : "Crear usuario"}
</button>

      
          </div>

        </form>

      </div>
    </div>
  </div>
)}



{modalEditar && usuarioEditando && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (
        e.target === e.currentTarget
      ) {
        cerrarEditarUsuario();
      }
    }}
  >
    <div className="modal">

      <div className="modal-header">
        <h2>
          Editar usuario
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={
            cerrarEditarUsuario
          }
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      <div className="modal-body">

        <form
        
  onSubmit={(e) => {
  e.preventDefault();
  guardarUsuarioEditado();
}}
        >
          <div className="form-grid">

            <div className="form-group full">
              <label className="form-label">
                Nombre *
              </label>

              <input
                className="form-input"
                value={nombreEditar}
                onChange={(e) =>
                  setNombreEditar(
                    e.target.value
                  )
                }
                required
                autoFocus
              />
            </div>

            <div className="form-group full">
              <label className="form-label">
                Rol *
              </label>

              <select
                className="form-input"
                value={rolEditar}
                onChange={(e) =>
                  setRolEditar(
                    e.target.value as
                      PerfilUsuario["rol"]
                  )
                }
              >
                <option value="operador">
                  Operador
                </option>

                <option value="consulta">
                  Consulta
                </option>

                <option value="administrador">
                  Administrador
                </option>

                <option value="superadmin">
                  Superadministrador
                </option>
              </select>
            </div>

            {rolEditar !== "superadmin" && (
              <div className="form-group full">
                <label className="form-label">
                  Sucursales *
                </label>

                <div
                  style={{
                    display: "grid",
                    gap: "8px",
                    marginTop: "4px",
                  }}
                >
                  {sucursales.length === 0 ? (
                    <div
                      style={{
                        color:
                          "var(--color-text-secondary)",
                      }}
                    >
                      No hay sucursales activas.
                    </div>
                  ) : (
                    sucursales.map(
                      (sucursal) => (
                        <label
                          key={sucursal.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px",
                            border:
                              "1px solid var(--color-border)",
                            borderRadius:
                              "9px",
                            cursor:
                              "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              sucursalesEditar.includes(
                                sucursal.id
                              )
                            }
                            onChange={() =>
                              cambiarSucursalEditar(
                                sucursal.id
                              )
                            }
                          />

                          <span>
                            {sucursal.nombre}
                          </span>
                        </label>
                      )
                    )
                  )}
                </div>
              </div>
            )}

            <div className="form-group full">
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={activoEditar}
                  onChange={(e) =>
                    setActivoEditar(
                      e.target.checked
                    )
                  }
                />

                <span>
                  Usuario activo
                </span>
              </label>
            </div>

          </div>

          <div className="modal-footer">

            <button
              type="button"
              className="secondary-button"
              onClick={
                cerrarEditarUsuario
              }
              disabled={
                guardandoEditar
              }
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                guardandoEditar
              }
            >
              {guardandoEditar
                ? "Guardando..."
                : "Guardar cambios"}
            </button>

          </div>

        </form>

      </div>
    </div>
  </div>
)}

    </div>
  );
}