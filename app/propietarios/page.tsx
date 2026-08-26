"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import { obtenerContextoSucursal } from "@/lib/sucursalActiva";
import { usePermisos } from "@/hooks/usePermisos";

type Propietario = {
  id: number;
  nombre: string;
  apellidos: string | null;
  cedula: string | null;
  telefono: string | null;
  whatsapp: string | null;
  correo: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
  observaciones: string | null;
};

export default function PropietariosPage() {
  const [propietarios, setPropietarios] =
    useState<Propietario[]>([]);

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [correo, setCorreo] = useState("");

  const [
    contactoEmergenciaNombre,
    setContactoEmergenciaNombre,
  ] = useState("");

  const [
    contactoEmergenciaTelefono,
    setContactoEmergenciaTelefono,
  ] = useState("");

  const [cedula, setCedula] =
  useState("");

  const [observaciones, setObservaciones] =
    useState("");

    const { puede } =
  usePermisos();

  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] =
    useState(false);

  async function cargarPropietarios() {
    const { data, error } = await supabase
      .from("propietarios")
      .select(`
        id,
        nombre,
        apellidos,
        cedula,
        telefono,
        whatsapp,
        correo,
        contacto_emergencia_nombre,
        contacto_emergencia_telefono,
        observaciones
      `)
      .order("nombre");

    if (error) {
      console.error(error);

      setMensaje(
        "No se pudieron cargar los propietarios."
      );

      return;
    }

    setPropietarios(data ?? []);
  }

  useEffect(() => {
    cargarPropietarios();
  }, []);

  function limpiarFormulario() {
    setNombre("");
    setApellidos("");
    setTelefono("");
    setWhatsapp("");
    setCorreo("");
    setCedula(""); 
    setContactoEmergenciaNombre("");
    setContactoEmergenciaTelefono("");

    setObservaciones("");
  }

  function abrirModal() {
    limpiarFormulario();
    setMensaje("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
  }

  async function guardarPropietario(
    e: FormEvent
  ) {
    e.preventDefault();

    setGuardando(true);
    setMensaje("");

    const contextoSucursal =
  await obtenerContextoSucursal();

if (!contextoSucursal.sucursalActivaId) {
  setGuardando(false);

  setMensaje(
    "No hay una sucursal activa disponible para guardar el propietario."
  );

  return;
}

    const { error } = await supabase
      .from("propietarios")
      .insert({
        nombre,
        apellidos: apellidos || null,
        telefono: telefono || null,
        whatsapp: whatsapp || null,
        correo: correo || null,
        cedula: cedula.trim() || null,
        contacto_emergencia_nombre:
          contactoEmergenciaNombre || null,

        contacto_emergencia_telefono:
          contactoEmergenciaTelefono || null,

        observaciones:
          observaciones || null,

          sucursal_id: contextoSucursal.sucursalActivaId,
      });

    setGuardando(false);

  if (error) {
  console.error("Error guardando propietario:", {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });

      return;
    }

    limpiarFormulario();

    setModalAbierto(false);

    setMensaje(
      "Propietario guardado correctamente."
    );

    await cargarPropietarios();
  }

  const propietariosFiltrados =
    useMemo(() => {
      const texto = busqueda
        .trim()
        .toLowerCase();

      if (!texto) {
        return propietarios;
      }

      return propietarios.filter(
        (propietario) => {
          const contenido = `
            ${propietario.nombre}
            ${propietario.apellidos ?? ""}
             ${propietario.cedula ?? ""}
            ${propietario.telefono ?? ""}
            ${propietario.whatsapp ?? ""}
            ${propietario.correo ?? ""}
          `.toLowerCase();

          return contenido.includes(texto);
        }
      );
    }, [busqueda, propietarios]);

  return (
    <div>

      <div className="page-header">

        <div>
          <h1 className="page-title">
            Propietarios
          </h1>

          <p className="page-description">
            Administra los responsables de los
            perritos registrados en PetFunCR.
          </p>
        </div>

        <div className="page-header-actions">
        
{puede("propietarios.crear") && (
          <button
            className="primary-button"
            type="button"
            onClick={abrirModal}
          >
            + Nuevo propietario
          </button>
)}

        </div>

      </div>

      {mensaje && (
        <div className="status-message">
          {mensaje}
        </div>
      )}

      <section className="list-card">

        <div className="list-toolbar">

          <div>
            <strong>
              Propietarios registrados
            </strong>

            <div
              style={{
                color:
                  "var(--color-text-secondary)",
                fontSize: "14px",
                marginTop: "3px",
              }}
            >
              Total: {propietarios.length}
            </div>
          </div>

          <input
            className="search-input"
            placeholder="Buscar por nombre, cédula, teléfono o correo..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
          />

        </div>

      
{propietariosFiltrados.length === 0 ? (
  <div className="empty-state">
    No se encontraron propietarios.
  </div>
) : (
  <>
    {/* Vista escritorio */}
    <div className="desktop-only">
      <table className="data-table">

        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>WhatsApp</th>
            <th>Correo</th>
          </tr>
        </thead>

        <tbody>
          {propietariosFiltrados.map(
            (propietario) => (
              <tr
                key={propietario.id}
                className="clickable-row"
                onClick={() => {
                  window.location.href =
                    `/propietarios/${propietario.id}`;
                }}
              >
                <td>
                  <strong>
                    {propietario.nombre}{" "}
                    {propietario.apellidos}
                  </strong>
                </td>

                <td>
                  {propietario.telefono || "—"}
                </td>

                <td>
                  {propietario.whatsapp || "—"}
                </td>

                <td>
                  {propietario.correo || "—"}
                </td>
              </tr>
            )
          )}
        </tbody>

      </table>
    </div>


    {/* Vista móvil */}
    <div className="mobile-only">
      <div className="mobile-list">
        {propietariosFiltrados.map(
          (propietario) => (
            <button
              key={propietario.id}
              type="button"
              className="mobile-record-card"
              onClick={() => {
                window.location.href =
                  `/propietarios/${propietario.id}`;
              }}
            >
              <div className="mobile-record-title">
                👤 {propietario.nombre}{" "}
                {propietario.apellidos}
              </div>

              <div className="mobile-record-grid">

                <div>
                  <span className="mobile-record-label">
                    Teléfono
                  </span>

                  <strong>
                    {propietario.telefono || "—"}
                  </strong>
                </div>

                <div>
                  <span className="mobile-record-label">
                    WhatsApp
                  </span>

                  <strong>
                    {propietario.whatsapp || "—"}
                  </strong>
                </div>

                <div className="mobile-record-full">
                  <span className="mobile-record-label">
                    Correo
                  </span>

                  <strong>
                    {propietario.correo || "—"}
                  </strong>
                </div>

              </div>

              <div className="mobile-record-action">
                Ver propietario →
              </div>
            </button>
          )
        )}
      </div>
    </div>
  </>
)}



      </section>

      {modalAbierto && (

        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              cerrarModal();
            }
          }}
        >

          <div className="modal">

            <div className="modal-header">

              <h2>
                Nuevo propietario
              </h2>

              <button
                type="button"
                className="icon-button"
                onClick={cerrarModal}
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>

            <div className="modal-body">

              <form
                onSubmit={guardarPropietario}
              >

                <div className="form-grid">

                  <div className="form-group">

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

                  <div className="form-group">

                    <label className="form-label">
                      Apellidos
                    </label>

                    <input
                      className="form-input"
                      value={apellidos}
                      onChange={(e) =>
                        setApellidos(
                          e.target.value
                        )
                      }
                    />

                  </div>

 <div className="form-group">

  <label className="form-label">
    Cédula / Identificación
  </label>

  <input
    className="form-input"
    value={cedula}
    onChange={(e) =>
      setCedula(e.target.value)
    }
    placeholder="Ej: 1-1234-5678"
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
                      WhatsApp
                    </label>

                    <input
                      className="form-input"
                      value={whatsapp}
                      onChange={(e) =>
                        setWhatsapp(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <div className="form-group full">

                    <label className="form-label">
                      Correo
                    </label>

                    <input
                      className="form-input"
                      type="email"
                      value={correo}
                      onChange={(e) =>
                        setCorreo(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label className="form-label">
                      Contacto de emergencia
                    </label>

                    <input
                      className="form-input"
                      value={
                        contactoEmergenciaNombre
                      }
                      onChange={(e) =>
                        setContactoEmergenciaNombre(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label className="form-label">
                      Teléfono de emergencia
                    </label>

                    <input
                      className="form-input"
                      value={
                        contactoEmergenciaTelefono
                      }
                      onChange={(e) =>
                        setContactoEmergenciaTelefono(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <div className="form-group full">

                    <label className="form-label">
                      Observaciones
                    </label>

                    <textarea
                      className="form-textarea"
                      value={observaciones}
                      onChange={(e) =>
                        setObservaciones(
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
                    onClick={cerrarModal}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={guardando}
                  >
                    {guardando
                      ? "Guardando..."
                      : "Guardar propietario"}
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