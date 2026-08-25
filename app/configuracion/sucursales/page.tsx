"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";


type Sucursal = {
  id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  activa: boolean;
  created_at: string;
};


export default function SucursalesPage() {
  const router = useRouter();

  const [sucursales, setSucursales] =
    useState<Sucursal[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [autorizado, setAutorizado] =
    useState<boolean | null>(null);

  const [mensaje, setMensaje] =
    useState("");

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [
    sucursalEditando,
    setSucursalEditando,
  ] = useState<Sucursal | null>(null);

  const [nombre, setNombre] =
    useState("");

  const [direccion, setDireccion] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [correo, setCorreo] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);


  useEffect(() => {
    async function iniciar() {
      await verificarPermiso();
    }

    iniciar();
  }, []);


  async function verificarPermiso() {
    setCargando(true);

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      setAutorizado(false);
      setCargando(false);
      return;
    }

    const { data: perfil, error } =
      await supabase
        .from("perfiles_usuario")
        .select(`
          nombre,
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

    await cargarSucursales();
  }


  async function cargarSucursales() {
    setCargando(true);

    const { data, error } =
      await supabase
        .from("sucursales")
        .select(`
          id,
          nombre,
          direccion,
          telefono,
          correo,
          activa,
          created_at
        `)
        .order(
          "nombre",
          {
            ascending: true,
          }
        );

    if (error) {
      console.error(
        "Error cargando sucursales:",
        error
      );

      setMensaje(
        "No se pudieron cargar las sucursales."
      );

      setCargando(false);
      return;
    }

    setSucursales(
      (data ?? []) as Sucursal[]
    );

    setCargando(false);
  }


  function limpiarFormulario() {
    setNombre("");
    setDireccion("");
    setTelefono("");
    setCorreo("");

    setSucursalEditando(null);
  }


  function abrirNuevaSucursal() {
    limpiarFormulario();

    setMensaje("");
    setModalAbierto(true);
  }


  function abrirEditarSucursal(
    sucursal: Sucursal
  ) {
    setSucursalEditando(
      sucursal
    );

    setNombre(
      sucursal.nombre
    );

    setDireccion(
      sucursal.direccion || ""
    );

    setTelefono(
      sucursal.telefono || ""
    );

    setCorreo(
      sucursal.correo || ""
    );

    setMensaje("");
    setModalAbierto(true);
  }


  function cerrarModal() {
    if (guardando) {
      return;
    }

    setModalAbierto(false);

    limpiarFormulario();
  }


  async function guardarSucursal(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const nombreLimpio =
      nombre.trim();

    if (!nombreLimpio) {
      setMensaje(
        "El nombre de la sucursal es obligatorio."
      );

      return;
    }

    setGuardando(true);
    setMensaje("");

    const datosSucursal = {
      nombre: nombreLimpio,

      direccion:
        direccion.trim() ||
        null,

      telefono:
        telefono.trim() ||
        null,

      correo:
        correo.trim() ||
        null,
    };


    if (sucursalEditando) {
      const { error } =
        await supabase
          .from("sucursales")
          .update(
            datosSucursal
          )
          .eq(
            "id",
            sucursalEditando.id
          );

      if (error) {
        console.error(
          "Error actualizando sucursal:",
          error
        );

        setMensaje(
          "No se pudo actualizar la sucursal."
        );

        setGuardando(false);
        return;
      }

      setMensaje(
        "Sucursal actualizada correctamente."
      );
    } else {
      const { error } =
        await supabase
          .from("sucursales")
          .insert({
            ...datosSucursal,
            activa: true,
          });

      if (error) {
        console.error(
          "Error creando sucursal:",
          error
        );

        setMensaje(
          "No se pudo crear la sucursal."
        );

        setGuardando(false);
        return;
      }

      setMensaje(
        "Sucursal creada correctamente."
      );
    }


    setGuardando(false);
    setModalAbierto(false);

    limpiarFormulario();

    await cargarSucursales();
  }


  async function cambiarEstadoSucursal(
    sucursal: Sucursal
  ) {
    const nuevoEstado =
      !sucursal.activa;

    const accion =
      nuevoEstado
        ? "activar"
        : "desactivar";

    const confirmado =
      window.confirm(
        `¿Deseas ${accion} la sucursal "${sucursal.nombre}"?`
      );

    if (!confirmado) {
      return;
    }

    setMensaje("");

    const { error } =
      await supabase
        .from("sucursales")
        .update({
          activa:
            nuevoEstado,
        })
        .eq(
          "id",
          sucursal.id
        );

    if (error) {
      console.error(
        "Error cambiando estado de sucursal:",
        error
      );

      setMensaje(
        "No se pudo cambiar el estado de la sucursal."
      );

      return;
    }

    setMensaje(
      nuevoEstado
        ? "Sucursal activada correctamente."
        : "Sucursal desactivada correctamente."
    );

    await cargarSucursales();
  }


  if (
    cargando &&
    autorizado === null
  ) {
    return (
      <div className="empty-state">
        Cargando configuración...
      </div>
    );
  }


  if (autorizado === false) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">
              Sucursales
            </h1>

            <p className="page-description">
              Administración de sucursales de PetFunCR.
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
            administrar las sucursales.
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
            🏢 Sucursales
          </h1>

          <p className="page-description">
            Administra las sucursales de PetFunCR.
          </p>
        </div>


        <div className="page-header-actions">
          <button
            type="button"
            className="primary-button"
            onClick={
              abrirNuevaSucursal
            }
          >
            + Nueva sucursal
          </button>
        </div>
      </div>


      {mensaje && (
        <div className="status-message">
          {mensaje}
        </div>
      )}


      <div
        className="dashboard-grid branch-summary-grid"
        style={{
          marginBottom: "24px",
        }}
      >
        <div className="card">
          <div className="card-label">
            Total de sucursales
          </div>

          <div className="card-value">
            {sucursales.length}
          </div>
        </div>


        <div className="card">
          <div className="card-label">
            Sucursales activas
          </div>

          <div className="card-value">
            {
              sucursales.filter(
                (sucursal) =>
                  sucursal.activa
              ).length
            }
          </div>
        </div>
      </div>


      <section className="list-card">

        <div className="list-toolbar">
          <div>
            <strong>
              Sucursales registradas
            </strong>

            <div
              style={{
                color:
                  "var(--color-text-secondary)",
                fontSize: "14px",
                marginTop: "3px",
              }}
            >
              Total: {sucursales.length}
            </div>
          </div>
        </div>


        {cargando ? (
          <div className="empty-state">
            Cargando sucursales...
          </div>
        ) : sucursales.length === 0 ? (
          <div className="empty-state">
            No hay sucursales registradas.
          </div>
        ) : (
          <>
            {/* ESCRITORIO */}

            <div className="desktop-only">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sucursal</th>
                    <th>Dirección</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {sucursales.map(
                    (sucursal) => (
                      <tr
                        key={
                          sucursal.id
                        }
                      >
                        <td>
                          <strong>
                            🏢{" "}
                            {
                              sucursal.nombre
                            }
                          </strong>
                        </td>

                        <td>
                          {sucursal.direccion ||
                            "—"}
                        </td>

                        <td>
                          {sucursal.telefono ||
                            "—"}
                        </td>

                        <td>
                          {sucursal.correo ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={
                              sucursal.activa
                                ? "branch-status active"
                                : "branch-status inactive"
                            }
                          >
                            {sucursal.activa
                              ? "Activa"
                              : "Inactiva"}
                          </span>
                        </td>

                        <td>
                          <div
                            style={{
                              display:
                                "flex",
                              gap: "8px",
                              flexWrap:
                                "wrap",
                            }}
                          >
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                abrirEditarSucursal(
                                  sucursal
                                )
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className={
                                sucursal.activa
                                  ? "danger-button"
                                  : "secondary-button"
                              }
                              onClick={() =>
                                cambiarEstadoSucursal(
                                  sucursal
                                )
                              }
                            >
                              {sucursal.activa
                                ? "Desactivar"
                                : "Activar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>


            {/* MÓVIL */}

            <div className="mobile-only branch-mobile-list">

              {sucursales.map(
                (sucursal) => (
                  <div
                    key={
                      sucursal.id
                    }
                    className="mobile-list-item"
                  >
                    <div className="branch-card-top">

                      <div className="mobile-list-title">
                        🏢{" "}
                        {
                          sucursal.nombre
                        }
                      </div>

                      <span
                        className={
                          sucursal.activa
                            ? "branch-status active"
                            : "branch-status inactive"
                        }
                      >
                        {sucursal.activa
                          ? "Activa"
                          : "Inactiva"}
                      </span>

                    </div>


                    <div className="mobile-list-grid">

                      <div
                        style={{
                          gridColumn:
                            "1 / -1",
                        }}
                      >
                        <span className="mobile-list-label">
                          Dirección
                        </span>

                        <strong>
                          {sucursal.direccion ||
                            "—"}
                        </strong>
                      </div>


                      <div>
                        <span className="mobile-list-label">
                          Teléfono
                        </span>

                        <strong>
                          {sucursal.telefono ||
                            "—"}
                        </strong>
                      </div>


                      <div>
                        <span className="mobile-list-label">
                          Correo
                        </span>

                        <strong>
                          {sucursal.correo ||
                            "—"}
                        </strong>
                      </div>

                    </div>


                    <div className="branch-card-actions">

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          abrirEditarSucursal(
                            sucursal
                          )
                        }
                      >
                        Editar
                      </button>


                      <button
                        type="button"
                        className={
                          sucursal.activa
                            ? "danger-button"
                            : "secondary-button"
                        }
                        onClick={() =>
                          cambiarEstadoSucursal(
                            sucursal
                          )
                        }
                      >
                        {sucursal.activa
                          ? "Desactivar"
                          : "Activar"}
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          </>
        )}

      </section>


      {/* MODAL */}

      {modalAbierto && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              cerrarModal();
            }
          }}
        >
          <div className="modal">

            <div className="modal-header">
              <h2>
                {sucursalEditando
                  ? "Editar sucursal"
                  : "Nueva sucursal"}
              </h2>

              <button
                type="button"
                className="icon-button"
                onClick={
                  cerrarModal
                }
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>


            <div className="modal-body">

              <form
                onSubmit={
                  guardarSucursal
                }
              >
                <div className="form-grid">

                  <div className="form-group full">
                    <label className="form-label">
                      Nombre *
                    </label>

                    <input
                      className="form-input"
                      value={nombre}
                      onChange={(e) =>
                        setNombre(
                          e.target.value
                        )
                      }
                      required
                      autoFocus
                    />
                  </div>


                  <div className="form-group full">
                    <label className="form-label">
                      Dirección
                    </label>

                    <input
                      className="form-input"
                      value={direccion}
                      onChange={(e) =>
                        setDireccion(
                          e.target.value
                        )
                      }
                    />
                  </div>


                  <div className="form-group">
                    <label className="form-label">
                      Teléfono
                    </label>

                    <input
                      className="form-input"
                      value={telefono}
                      onChange={(e) =>
                        setTelefono(
                          e.target.value
                        )
                      }
                    />
                  </div>


                  <div className="form-group">
                    <label className="form-label">
                      Correo
                    </label>

                    <input
                      type="email"
                      className="form-input"
                      value={correo}
                      onChange={(e) =>
                        setCorreo(
                          e.target.value
                        )
                      }
                    />
                  </div>

                </div>


                <div className="modal-footer">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      cerrarModal
                    }
                    disabled={
                      guardando
                    }
                  >
                    Cancelar
                  </button>


                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      guardando
                    }
                  >
                    {guardando
                      ? "Guardando..."
                      : sucursalEditando
                        ? "Guardar cambios"
                        : "Crear sucursal"}
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