"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
  codigo_reserva: string | null;

  sucursal_id: number;

  sucursales: {
    id: number;
    nombre: string;
  } | null;
};

type Perrito = {
  id: number;
  nombre: string;
  sexo: string | null;
  peso_kg: number | null;

  razas: {
    nombre: string;
  } | null;
};



export default function PropietarioDetallePage() {
  const params = useParams();
  const router = useRouter();

  const propietarioId = Number(params.id);

  const [propietario, setPropietario] =
    useState<Propietario | null>(null);

  const [perritos, setPerritos] =
    useState<Perrito[]>([]);

  const [cargando, setCargando] = useState(true);

  const [modalEditar, setModalEditar] =
    useState(false);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

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

  const [observaciones, setObservaciones] =
    useState("");

  const [codigoReserva, setCodigoReserva] = useState("");
  const [errorCodigoReserva, setErrorCodigoReserva] = useState("");

 const [cedula, setCedula] =
  useState("");   

  const { puede } =
  usePermisos();

  async function cargarPropietario() {
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
        observaciones,
        codigo_reserva,
        sucursal_id,
        sucursales (
      id,
      nombre
    )
      `)
      .eq("id", propietarioId)
      .single();

    if (error) {
      console.error(error);
      setCargando(false);
      return;
    }

   setPropietario(
  data as unknown as Propietario
);

    setNombre(data.nombre ?? "");
    setApellidos(data.apellidos ?? "");
    setCedula(data.cedula ?? "");
    setTelefono(data.telefono ?? "");
    setWhatsapp(data.whatsapp ?? "");
    setCorreo(data.correo ?? "");

    setContactoEmergenciaNombre(
      data.contacto_emergencia_nombre ?? ""
    );

    setContactoEmergenciaTelefono(
      data.contacto_emergencia_telefono ?? ""
    );

    setObservaciones(data.observaciones ?? "");
    setCodigoReserva(data.codigo_reserva ?? "");
  }

  async function cargarPerritos() {
    const { data, error } = await supabase
      .from("perritos")
      .select(`
        id,
        nombre,
        sexo,
        peso_kg,
        razas (
          nombre
        )
      `)
      .eq("propietario_id", propietarioId)
      .order("nombre");

    if (error) {
      console.error(error);
      return;
    }

    setPerritos((data ?? []) as unknown as Perrito[]);
  }

  useEffect(() => {
    async function cargarTodo() {
      setCargando(true);

      await Promise.all([
        cargarPropietario(),
        cargarPerritos(),
      ]);

      setCargando(false);
    }

    cargarTodo();
  }, [propietarioId]);

  async function guardarCambios(
    e: FormEvent
  ) {
    e.preventDefault();

    const codigoReservaLimpio = codigoReserva.trim().toUpperCase();
    setErrorCodigoReserva("");

    // Formato utilizado por las rutas públicas de reservas: PF- + 5 a 12 caracteres alfanuméricos.
    if (
      codigoReservaLimpio &&
      !/^PF-[A-Z0-9]{5,12}$/.test(codigoReservaLimpio)
    ) {
      setErrorCodigoReserva(
        "El código debe comenzar con PF- y contener de 5 a 12 letras o números después del guion. Ejemplo: PF-MAX2026."
      );
      return;
    }

    setGuardando(true);
    setMensaje("");

    // Comprobación preventiva para evitar asignar un código que ya pertenezca a otro propietario.
    // La unicidad definitiva también debe protegerse en Supabase con una restricción/índice único.
    if (codigoReservaLimpio) {
      const { data: codigoExistente, error: errorConsultaCodigo } =
        await supabase
          .from("propietarios")
          .select("id")
          .ilike("codigo_reserva", codigoReservaLimpio)
          .neq("id", propietarioId)
          .limit(1)
          .maybeSingle();

      if (errorConsultaCodigo) {
        console.error("Error verificando código de reserva:", errorConsultaCodigo);
        setGuardando(false);
        setErrorCodigoReserva(
          "No se pudo comprobar si el código de reserva está disponible. No se guardaron los cambios."
        );
        return;
      }

      if (codigoExistente) {
        setGuardando(false);
        setErrorCodigoReserva("Ese código de reserva ya está asignado a otro propietario.");
        return;
      }
    }

    const { error } = await supabase
      .from("propietarios")
      .update({
        nombre,
        apellidos: apellidos || null,
        cedula: cedula.trim() || null,
        telefono: telefono || null,
        whatsapp: whatsapp || null,
        correo: correo || null,
        codigo_reserva: codigoReservaLimpio || null,

        contacto_emergencia_nombre:
          contactoEmergenciaNombre || null,

        contacto_emergencia_telefono:
          contactoEmergenciaTelefono || null,

        observaciones:
          observaciones || null,
      })
      .eq("id", propietarioId);

    setGuardando(false);

    if (error) {
      console.error(error);
      const errorRelacionadoCodigoReserva =
        error.code === "23505" &&
        `${error.message} ${error.details ?? ""}`
          .toLowerCase()
          .includes("codigo_reserva");

      if (errorRelacionadoCodigoReserva) {
        setErrorCodigoReserva("Ese código de reserva ya está asignado a otro propietario.");
      } else {
        setMensaje("No se pudieron guardar los cambios.");
      }
      return;
    }

    setModalEditar(false);

    setMensaje(
      "Propietario actualizado correctamente."
    );

    await cargarPropietario();
  }

  async function eliminarPropietario() {
  if (!propietario) {
    return;
  }

  const confirmar = window.confirm(
    `¿Seguro que deseas eliminar a ${propietario.nombre} ${propietario.apellidos ?? ""}?\n\nSe eliminarán también todos sus perritos y, junto con ellos, sus vacunas y desparasitaciones registradas.\n\nEsta acción no se puede deshacer.`
  );

  if (!confirmar) {
    return;
  }

  setMensaje("");

  const { error } = await supabase
    .from("propietarios")
    .delete()
    .eq("id", propietario.id);

  if (error) {
    console.error(error);

    setMensaje(
      "No se pudo eliminar el propietario."
    );

    return;
  }

  router.push("/propietarios");
}

  if (cargando) {
    return (
      <div>
        <h1 className="page-title">
          Cargando...
        </h1>
      </div>
    );
  }

  if (!propietario) {
    return (
      <div>
        <h1 className="page-title">
          Propietario no encontrado
        </h1>

        <button
          className="secondary-button"
          onClick={() =>
            router.push("/propietarios")
          }
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div>

     <div className="page-header owner-detail-header">

        <div>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              router.push("/propietarios")
            }
            style={{
              marginBottom: "18px",
            }}
          >
            ← Volver a propietarios
          </button>

          <h1 className="page-title">
            {propietario.nombre}{" "}
            {propietario.apellidos}
          </h1>

          <p className="page-description">
            Información del propietario y sus
            perritos registrados.
          </p>

        </div>

      <div className="page-header-actions owner-detail-actions">

{puede("propietarios.eliminar") && (
  <button
    className="danger-button"
    type="button"
    onClick={eliminarPropietario}
  >
    Eliminar propietario
  </button>
)}

{puede("propietarios.editar") && (
  <button
    className="primary-button"
    type="button"
    onClick={() =>
      setModalEditar(true)
    }
  >
    Editar propietario
  </button>
)}

</div>

      </div>

      {mensaje && (
        <div className="status-message">
          {mensaje}
        </div>
      )}

  <div
  className="dashboard-grid owner-info-grid"
  style={{
    marginBottom: "24px",
  }}
>

      <div className="card">
  <div className="card-label">
    Cédula / Identificación
  </div>

  <strong>
    {propietario.cedula || "—"}
  </strong>
</div>

        <div className="card">
          <div className="card-label">
            Teléfono
          </div>

          <div>
            {propietario.telefono || "—"}
          </div>
        </div>

        <div className="card">
          <div className="card-label">
            WhatsApp
          </div>

          <div>
            {propietario.whatsapp || "—"}
          </div>
        </div>

        <div className="card">
          <div className="card-label">
            Correo
          </div>

          <div>
            {propietario.correo || "—"}
          </div>
        </div>

        <div className="card">
          <div className="card-label">
            Perritos registrados
          </div>

          <div className="card-value">
            {perritos.length}
          </div>
        </div>

<div className="card">
  <div className="card-label">
    Código de reserva
  </div>

  <strong>
    {propietario.codigo_reserva || "Sin asignar"}
  </strong>
</div>

<div className="card">
  <div className="card-label">
    Sucursal
  </div>

  <strong>
    {propietario.sucursales?.nombre || "—"}
  </strong>
</div>

      </div>

      <section
        className="card"
        style={{
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Contacto de emergencia
        </h2>

        <p>
          <strong>Nombre:</strong>{" "}
          {propietario
            .contacto_emergencia_nombre ||
            "—"}
        </p>

        <p>
          <strong>Teléfono:</strong>{" "}
          {propietario
            .contacto_emergencia_telefono ||
            "—"}
        </p>
      </section>

      <section
        className="card"
        style={{
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Observaciones
        </h2>

        <p style={{ marginBottom: 0 }}>
          {propietario.observaciones ||
            "Sin observaciones registradas."}
        </p>
      </section>

      <section className="list-card">

        <div className="list-toolbar">

          <div>
            <strong>
              Perritos del propietario
            </strong>

            <div
              style={{
                color:
                  "var(--color-text-secondary)",
                fontSize: "14px",
                marginTop: "3px",
              }}
            >
              Total: {perritos.length}
            </div>
          </div>

{puede("perritos.crear") && (
  <button
    className="primary-button"
    type="button"
    onClick={() =>
      router.push(
        `/perritos?propietario=${propietarioId}`
      )
    }
  >
    + Agregar perrito
  </button>
)}

        </div>

        {perritos.length === 0 ? (
          <div className="empty-state">
            Este propietario todavía no tiene
            perritos registrados.
          </div>
        ) : (

        <>
  {/* ESCRITORIO */}
  <div className="desktop-only">
    <table className="data-table">

      <thead>
        <tr>
          <th>Nombre</th>
          <th>Raza</th>
          <th>Sexo</th>
          <th>Peso</th>
        </tr>
      </thead>

      <tbody>
        {perritos.map((perrito) => (

          <tr
            key={perrito.id}
            className="clickable-row"
            onClick={() =>
              router.push(
                `/perritos/${perrito.id}`
              )
            }
          >

            <td>
              <strong>
                🐾 {perrito.nombre}
              </strong>
            </td>

            <td>
              {perrito.razas?.nombre || "—"}
            </td>

            <td>
              {perrito.sexo || "—"}
            </td>

            <td>
              {perrito.peso_kg
                ? `${perrito.peso_kg} kg`
                : "—"}
            </td>

          </tr>

        ))}
      </tbody>

    </table>
  </div>


  {/* MÓVIL */}
  <div className="mobile-only owner-dogs-mobile">

    {perritos.map((perrito) => (

      <div
        key={perrito.id}
        className="mobile-list-item"
        onClick={() =>
          router.push(
            `/perritos/${perrito.id}`
          )
        }
      >

        <div className="mobile-list-title">
          🐾 {perrito.nombre}
        </div>

        <div className="mobile-list-grid">

          <div>
            <span className="mobile-list-label">
              Raza
            </span>

            <strong>
              {perrito.razas?.nombre || "—"}
            </strong>
          </div>

          <div>
            <span className="mobile-list-label">
              Sexo
            </span>

            <strong>
              {perrito.sexo || "—"}
            </strong>
          </div>

          <div>
            <span className="mobile-list-label">
              Peso
            </span>

            <strong>
              {perrito.peso_kg
                ? `${perrito.peso_kg} kg`
                : "—"}
            </strong>
          </div>

        </div>

        <div className="mobile-list-link">
          Ver perrito →
        </div>

      </div>

    ))}

  </div>
</>

        )}

      </section>

      {modalEditar && (

        <div className="modal-backdrop">

          <div className="modal">

            <div className="modal-header">

              <h2>
                Editar propietario
              </h2>

              <button
                className="icon-button"
                type="button"
                onClick={() =>
                  setModalEditar(false)
                }
              >
                ×
              </button>

            </div>

            <div className="modal-body">

              <form
                onSubmit={guardarCambios}
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
                    <label className="form-label" htmlFor="codigo-reserva">
                      Código de reserva (opcional)
                    </label>
                    <input
                      id="codigo-reserva"
                      className="form-input"
                      value={codigoReserva}
                      onChange={(e) => {
                        setCodigoReserva(e.target.value.toUpperCase());
                        setErrorCodigoReserva("");
                      }}
                      placeholder="Ej: PF-MAX2026"
                      maxLength={15}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <small style={{ display: "block", marginTop: 6, color: "var(--color-text-secondary)" }}>
                      Debe iniciar con PF- y llevar de 5 a 12 letras o números. Dejalo vacío si no vas a habilitar reservas públicas para este propietario.
                    </small>
                    {errorCodigoReserva && (
                      <p role="alert" style={{ color: "#dc2626", fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>
                        {errorCodigoReserva}
                      </p>
                    )}
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
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      setModalEditar(false)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={guardando}
                  >
                    {guardando
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