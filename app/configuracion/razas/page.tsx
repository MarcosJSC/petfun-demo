"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "@/lib/supabase";


type Raza = {
  id: number;
  nombre: string;
  activa: boolean;
};


export default function RazasPage() {
  const router = useRouter();

  const [razas, setRazas] =
    useState<Raza[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [autorizado, setAutorizado] =
    useState<boolean | null>(null);

  const [mensaje, setMensaje] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [
    razaEditando,
    setRazaEditando,
  ] =
    useState<Raza | null>(null);

  const [nombre, setNombre] =
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

    const {
      data: perfil,
      error,
    } =
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

    await cargarRazas();
  }


  async function cargarRazas() {
    setCargando(true);

    const {
      data,
      error,
    } =
      await supabase
        .from("razas")
        .select(`
          id,
          nombre,
          activa
        `)
        .order(
          "nombre",
          {
            ascending: true,
          }
        );

    if (error) {
      console.error(
        "Error cargando razas:",
        error
      );

      setMensaje(
        "No se pudieron cargar las razas."
      );

      setCargando(false);
      return;
    }

    setRazas(
      (data ?? []) as Raza[]
    );

    setCargando(false);
  }


  function limpiarFormulario() {
    setNombre("");
    setRazaEditando(null);
  }


  function abrirNuevaRaza() {
    limpiarFormulario();

    setMensaje("");
    setModalAbierto(true);
  }


  function abrirEditarRaza(
    raza: Raza
  ) {
    setRazaEditando(raza);

    setNombre(
      raza.nombre
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


  async function guardarRaza(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const nombreLimpio =
      nombre.trim();

    if (!nombreLimpio) {
      setMensaje(
        "El nombre de la raza es obligatorio."
      );

      return;
    }

    setGuardando(true);
    setMensaje("");

    /*
     * Comprobamos si ya existe
     * otra raza con el mismo nombre.
     */
    const razaDuplicada =
      razas.find(
        (raza) =>
          raza.nombre
            .trim()
            .toLowerCase() ===
            nombreLimpio.toLowerCase() &&
          raza.id !==
            razaEditando?.id
      );

    if (razaDuplicada) {
      setMensaje(
        "Ya existe una raza con ese nombre."
      );

      setGuardando(false);
      return;
    }


    if (razaEditando) {
      const {
        error,
      } =
        await supabase
          .from("razas")
          .update({
            nombre:
              nombreLimpio,
          })
          .eq(
            "id",
            razaEditando.id
          );

      if (error) {
        console.error(
          "Error actualizando raza:",
          error
        );

        setMensaje(
          "No se pudo actualizar la raza."
        );

        setGuardando(false);
        return;
      }

      setMensaje(
        "Raza actualizada correctamente."
      );
    } else {
      const {
        error,
      } =
        await supabase
          .from("razas")
          .insert({
            nombre:
              nombreLimpio,

            activa:
              true,
          });

      if (error) {
        console.error(
          "Error creando raza:",
          error
        );

        setMensaje(
          "No se pudo crear la raza."
        );

        setGuardando(false);
        return;
      }

      setMensaje(
        "Raza creada correctamente."
      );
    }

    setGuardando(false);

    setModalAbierto(false);

    limpiarFormulario();

    await cargarRazas();
  }


  async function cambiarEstadoRaza(
    raza: Raza
  ) {
    const nuevoEstado =
      !raza.activa;

    const accion =
      nuevoEstado
        ? "activar"
        : "desactivar";

    const confirmado =
      window.confirm(
        `¿Deseas ${accion} la raza "${raza.nombre}"?`
      );

    if (!confirmado) {
      return;
    }

    setMensaje("");

    const {
      error,
    } =
      await supabase
        .from("razas")
        .update({
          activa:
            nuevoEstado,
        })
        .eq(
          "id",
          raza.id
        );

    if (error) {
      console.error(
        "Error cambiando estado de raza:",
        error
      );

      setMensaje(
        "No se pudo cambiar el estado de la raza."
      );

      return;
    }

    setMensaje(
      nuevoEstado
        ? "Raza activada correctamente."
        : "Raza desactivada correctamente."
    );

    await cargarRazas();
  }


  const razasFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return razas;
      }

      return razas.filter(
        (raza) =>
          raza.nombre
            .toLowerCase()
            .includes(texto)
      );
    }, [
      razas,
      busqueda,
    ]);


  const razasActivas =
    razas.filter(
      (raza) =>
        raza.activa
    ).length;

  const razasInactivas =
    razas.length -
    razasActivas;


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
              Razas
            </h1>

            <p className="page-description">
              Administración del catálogo
              de razas de PetFunCR.
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
            Solo un superadministrador
            puede administrar las razas.
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
            🐾 Razas
          </h1>

          <p className="page-description">
            Administra el catálogo de razas
            utilizado por PetFunCR.
          </p>
        </div>


        <div className="page-header-actions">
          <button
            type="button"
            className="primary-button"
            onClick={
              abrirNuevaRaza
            }
          >
            + Nueva raza
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
            Total de razas
          </div>

          <div className="card-value">
            {razas.length}
          </div>
        </div>


        <div className="card">
          <div className="card-label">
            Razas activas
          </div>

          <div className="card-value">
            {razasActivas}
          </div>
        </div>


        <div className="card">
          <div className="card-label">
            Razas inactivas
          </div>

          <div className="card-value">
            {razasInactivas}
          </div>
        </div>
      </div>


      <section className="list-card">

        <div className="list-toolbar">
          <div>
            <strong>
              Razas registradas
            </strong>

            <div
              style={{
                color:
                  "var(--color-text-secondary)",
                fontSize: "14px",
                marginTop: "3px",
              }}
            >
              Total: {razasFiltradas.length}
            </div>
          </div>


          <input
            className="search-input"
            placeholder="Buscar raza..."
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
            Cargando razas...
          </div>
        ) : razasFiltradas.length === 0 ? (
          <div className="empty-state">
            No se encontraron razas.
          </div>
        ) : (
          <>
            {/* ESCRITORIO */}

            <div className="desktop-only">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Raza</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {razasFiltradas.map(
                    (raza) => (
                      <tr
                        key={
                          raza.id
                        }
                      >
                        <td>
                          <strong>
                            🐾{" "}
                            {
                              raza.nombre
                            }
                          </strong>
                        </td>

                        <td>
                          <span
                            className={
                              raza.activa
                                ? "branch-status active"
                                : "branch-status inactive"
                            }
                          >
                            {raza.activa
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
                                abrirEditarRaza(
                                  raza
                                )
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className={
                                raza.activa
                                  ? "danger-button"
                                  : "secondary-button"
                              }
                              onClick={() =>
                                cambiarEstadoRaza(
                                  raza
                                )
                              }
                            >
                              {raza.activa
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

              {razasFiltradas.map(
                (raza) => (
                  <div
                    key={
                      raza.id
                    }
                    className="mobile-list-item"
                  >
                    <div className="branch-card-top">

                      <div className="mobile-list-title">
                        🐾{" "}
                        {
                          raza.nombre
                        }
                      </div>

                      <span
                        className={
                          raza.activa
                            ? "branch-status active"
                            : "branch-status inactive"
                        }
                      >
                        {raza.activa
                          ? "Activa"
                          : "Inactiva"}
                      </span>

                    </div>


                    <div className="branch-card-actions">

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          abrirEditarRaza(
                            raza
                          )
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className={
                          raza.activa
                            ? "danger-button"
                            : "secondary-button"
                        }
                        onClick={() =>
                          cambiarEstadoRaza(
                            raza
                          )
                        }
                      >
                        {raza.activa
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
                {razaEditando
                  ? "Editar raza"
                  : "Nueva raza"}
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
                  guardarRaza
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
                      : razaEditando
                        ? "Guardar cambios"
                        : "Crear raza"}
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