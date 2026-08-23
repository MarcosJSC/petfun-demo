"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Propietario = {
  id: number;
  nombre: string;
  apellidos: string | null;
};

type Raza = {
  id: number;
  nombre: string;
};

type Perrito = {
  id: number;
  nombre: string;
  sexo: string | null;
  peso_kg: number | null;
  fecha_nacimiento: string | null;
  propietario_id: number;
  raza_id: number | null;

  propietarios: {
    nombre: string;
    apellidos: string | null;
  } | null;

  razas: {
    nombre: string;
  } | null;
};

function PerritosContent() {
  const searchParams = useSearchParams();

  const propietarioDesdeUrl =
    searchParams.get("propietario");

  const [perritos, setPerritos] =
    useState<Perrito[]>([]);

  const [propietarios, setPropietarios] =
    useState<Propietario[]>([]);

  const [razas, setRazas] =
    useState<Raza[]>([]);

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [nombre, setNombre] = useState("");
  const [sexo, setSexo] = useState("");
  const [peso, setPeso] = useState("");
  const [fechaNacimiento, setFechaNacimiento] =
    useState("");

 const [precioHotel, setPrecioHotel] =
  useState("");

const [precioGuarderia, setPrecioGuarderia] =
  useState("");   

  const [propietarioId, setPropietarioId] =
    useState("");

  const [razaId, setRazaId] = useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);

  async function cargarPerritos() {
    const { data, error } = await supabase
      .from("perritos")
      .select(`
        id,
        nombre,
        sexo,
        peso_kg,
        fecha_nacimiento,
        propietario_id,
        raza_id,
        propietarios (
          nombre,
          apellidos
        ),
        razas (
          nombre
        )
      `)
      .eq("activo", true)
      .order("nombre");

    if (error) {
      console.error(error);
      setMensaje(
        "No se pudieron cargar los perritos."
      );
      return;
    }

    setPerritos(
  (data ?? []) as unknown as Perrito[]
);
  }

  async function cargarPropietarios() {
    const { data, error } = await supabase
      .from("propietarios")
      .select("id, nombre, apellidos")
      .order("nombre");

    if (error) {
      console.error(error);
      return;
    }

    setPropietarios(data ?? []);
  }

  async function cargarRazas() {
    const { data, error } = await supabase
      .from("razas")
      .select("id, nombre")
      .eq("activa", true)
      .order("nombre");

    if (error) {
      console.error(error);
      return;
    }

    setRazas(data ?? []);
  }

  useEffect(() => {
    cargarPerritos();
    cargarPropietarios();
    cargarRazas();
  }, []);

  useEffect(() => {
    if (propietarioDesdeUrl) {
      setPropietarioId(propietarioDesdeUrl);
      setModalAbierto(true);
    }
  }, [propietarioDesdeUrl]);

  function limpiarFormulario() {
    setNombre("");
    setSexo("");
    setPeso("");
    setFechaNacimiento("");
    setRazaId("");
    setPrecioHotel("");
setPrecioGuarderia("");

    if (propietarioDesdeUrl) {
      setPropietarioId(propietarioDesdeUrl);
    } else {
      setPropietarioId("");
    }
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

  async function guardarPerrito(
    e: FormEvent
  ) {
    e.preventDefault();

    setGuardando(true);
    setMensaje("");

    const { error } = await supabase
      .from("perritos")
      .insert({
        nombre,
        propietario_id:
          Number(propietarioId),

        raza_id:
          razaId
            ? Number(razaId)
            : null,

        sexo:
          sexo || null,

        peso_kg:
          peso
            ? Number(peso)
            : null,

        fecha_nacimiento:
          fechaNacimiento || null,

precio_hotel:
  precioHotel
    ? Number(precioHotel)
    : null,

precio_guarderia:
  precioGuarderia
    ? Number(precioGuarderia)
    : null,

      });

    setGuardando(false);

    if (error) {
      console.error(error);

      setMensaje(
        "Ocurrió un error al guardar el perrito."
      );

      return;
    }

    limpiarFormulario();

    setModalAbierto(false);

    setMensaje(
      "Perrito guardado correctamente 🐶"
    );

    await cargarPerritos();
  }

  const perritosFiltrados =
    useMemo(() => {
      const texto =
        busqueda.trim().toLowerCase();

      if (!texto) {
        return perritos;
      }

      return perritos.filter(
        (perrito) => {

          const contenido = `
            ${perrito.nombre}
            ${perrito.razas?.nombre ?? ""}
            ${perrito.sexo ?? ""}
            ${perrito.propietarios?.nombre ?? ""}
            ${perrito.propietarios?.apellidos ?? ""}
          `.toLowerCase();

          return contenido.includes(texto);
        }
      );
    }, [busqueda, perritos]);

  return (
    <div>

      <div className="page-header">

        <div>
          <h1 className="page-title">
            Perritos
          </h1>

          <p className="page-description">
            Administra los perritos registrados
            en PetFunCR.
          </p>
        </div>

        <div className="page-header-actions">

          <button
            type="button"
            className="primary-button"
            onClick={abrirModal}
          >
            + Nuevo perrito
          </button>

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
              Perritos registrados
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

          <input
            className="search-input"
            placeholder="Buscar por nombre, raza o propietario..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
          />

        </div>

{perritosFiltrados.length === 0 ? (
  <div className="empty-state">
    No se encontraron perritos.
  </div>
) : (
  <>
    {/* Vista escritorio */}
    <div className="desktop-only">
      <table className="data-table">

        <thead>
          <tr>
            <th>Nombre</th>
            <th>Raza</th>
            <th>Sexo</th>
            <th>Peso</th>
            <th>Propietario</th>
          </tr>
        </thead>

        <tbody>
          {perritosFiltrados.map(
            (perrito) => (
              <tr
                key={perrito.id}
                className="clickable-row"
                onClick={() => {
                  window.location.href =
                    `/perritos/${perrito.id}`;
                }}
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

                <td>
                  {perrito.propietarios
                    ? `${perrito.propietarios.nombre} ${
                        perrito.propietarios.apellidos ?? ""
                      }`
                    : "—"}
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
        {perritosFiltrados.map(
          (perrito) => (
            <button
              key={perrito.id}
              type="button"
              className="mobile-record-card"
              onClick={() => {
                window.location.href =
                  `/perritos/${perrito.id}`;
              }}
            >
              <div className="mobile-record-title">
                🐾 {perrito.nombre}
              </div>

              <div className="mobile-record-grid">

                <div>
                  <span className="mobile-record-label">
                    Raza
                  </span>

                  <strong>
                    {perrito.razas?.nombre || "—"}
                  </strong>
                </div>

                <div>
                  <span className="mobile-record-label">
                    Sexo
                  </span>

                  <strong>
                    {perrito.sexo || "—"}
                  </strong>
                </div>

                <div>
                  <span className="mobile-record-label">
                    Peso
                  </span>

                  <strong>
                    {perrito.peso_kg
                      ? `${perrito.peso_kg} kg`
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span className="mobile-record-label">
                    Propietario
                  </span>

                  <strong>
                    {perrito.propietarios
                      ? `${perrito.propietarios.nombre} ${
                          perrito.propietarios.apellidos ?? ""
                        }`
                      : "—"}
                  </strong>
                </div>

              </div>

              <div className="mobile-record-action">
                Ver perrito →
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
                Nuevo perrito
              </h2>

              <button
                type="button"
                className="icon-button"
                onClick={cerrarModal}
              >
                ×
              </button>

            </div>

            <div className="modal-body">

              <form
                onSubmit={guardarPerrito}
              >

                <div className="form-grid">

                  <div className="form-group full">

                    <label className="form-label">
                      Propietario *
                    </label>

                    <select
                      className="form-select"
                      value={propietarioId}
                      onChange={(e) =>
                        setPropietarioId(
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        Selecciona propietario
                      </option>

                      {propietarios.map(
                        (propietario) => (

                          <option
                            key={propietario.id}
                            value={propietario.id}
                          >
                            {propietario.nombre}{" "}
                            {propietario.apellidos}
                          </option>

                        )
                      )}

                    </select>

                  </div>

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
                      Raza
                    </label>

                    <select
                      className="form-select"
                      value={razaId}
                      onChange={(e) =>
                        setRazaId(
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Selecciona raza
                      </option>

                      {razas.map((raza) => (

                        <option
                          key={raza.id}
                          value={raza.id}
                        >
                          {raza.nombre}
                        </option>

                      ))}

                    </select>

                  </div>

                  <div className="form-group">

                    <label className="form-label">
                      Sexo
                    </label>

                    <select
                      className="form-select"
                      value={sexo}
                      onChange={(e) =>
                        setSexo(
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Selecciona sexo
                      </option>

                      <option value="Macho">
                        Macho
                      </option>

                      <option value="Hembra">
                        Hembra
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label className="form-label">
                      Peso kg
                    </label>

                    <input
                      className="form-input"
                      type="number"
                      step="0.1"
                      min="0"
                      value={peso}
                      onChange={(e) =>
                        setPeso(
                          e.target.value
                        )
                      }
                    />

                  </div>

              <div className="form-group full">

  <label className="form-label">
    Fecha de nacimiento
  </label>

  <input
    className="form-input"
    type="date"
    value={fechaNacimiento}
    onChange={(e) =>
      setFechaNacimiento(
        e.target.value
      )
    }
  />

</div>


{/* PRECIOS */}

<div className="form-group">

  <label className="form-label">
    Precio Hotel
  </label>

  <input
    className="form-input"
    type="number"
    min="0"
    step="100"
    placeholder="Ej: 10000"
    value={precioHotel}
    onChange={(e) =>
      setPrecioHotel(
        e.target.value
      )
    }
  />

</div>


<div className="form-group">

  <label className="form-label">
    Precio Guardería
  </label>

  <input
    className="form-input"
    type="number"
    min="0"
    step="100"
    placeholder="Ej: 7000"
    value={precioGuarderia}
    onChange={(e) =>
      setPrecioGuarderia(
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
                      : "Guardar perrito"}
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

export default function PerritosPage() {
  return (
    <Suspense
      fallback={
        <div className="empty-state">
          Cargando perritos...
        </div>
      }
    >
      <PerritosContent />
    </Suspense>
  );
}