
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePermisos } from "@/hooks/usePermisos";
import { RequierePermiso } from "@/components/RequierePermiso";

type PerritoReserva = {
  id: number;
  perrito_id: number;
  dias_calculados: number | null;
  precio_hotel_aplicado: number | null;
  precio_guarderia_aplicado: number | null;
  subtotal_hotel_estimado: number | null;
  subtotal_guarderia_estimado: number | null;
  perritos: { nombre: string } | { nombre: string }[] | null;
};

type Reserva = {
  id: number;
  numero_reserva: string;
  propietario_id: number;
  sucursal_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  turno_entrada: string;
  tipo_estadia_id: number;
  estado: string;
  monto_estimado: number | null;
  observaciones_cliente: string | null;
  observaciones_admin: string | null;
  created_at: string;
  propietarios:
    | {
        nombre: string;
        apellidos: string | null;
        telefono: string | null;
      }
    | {
        nombre: string;
        apellidos: string | null;
        telefono: string | null;
      }[]
    | null;
  sucursales:
    | { id: number; nombre: string }
    | { id: number; nombre: string }[]
    | null;
  tipos_estadia:
    | { nombre: string }
    | { nombre: string }[]
    | null;
  reserva_perritos: PerritoReserva[] | null;
};

type RespuestaAPI = {
  ok?: boolean;
  mensaje?: string;
  error?: string;
  reservas?: Reserva[];
};

type FiltroEstado =
  | "Pendiente"
  | "Aprobada"
  | "Rechazada"
  | "Cancelada"
  | "Todas";

function primero<T>(
  valor: T | T[] | null | undefined
): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function fechaCorta(fecha: string) {
  if (!fecha) return "—";

  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

function moneda(valor: number | null | undefined) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(Number(valor ?? 0));
}

function nombrePropietario(reserva: Reserva) {
  const propietario = primero(reserva.propietarios);

  if (!propietario) return "Propietario no disponible";

  return `${propietario.nombre} ${propietario.apellidos ?? ""}`.trim();
}

function nombresPerritos(reserva: Reserva) {
  return (reserva.reserva_perritos ?? [])
    .map((detalle) => primero(detalle.perritos)?.nombre)
    .filter(Boolean)
    .join(", ");
}

function etiquetaEstado(estado: string) {
  switch (estado) {
    case "Pendiente":
      return {
        texto: "Pendiente",
        fondo: "#fff3cd",
        color: "#856404",
      };
    case "Aprobada":
      return {
        texto: "Aprobada",
        fondo: "#d1e7dd",
        color: "#0f5132",
      };
    case "Rechazada":
      return {
        texto: "Rechazada",
        fondo: "#f8d7da",
        color: "#842029",
      };
    case "Cancelada":
      return {
        texto: "Cancelada",
        fondo: "#e2e3e5",
        color: "#41464b",
      };
    default:
      return {
        texto: estado || "Sin estado",
        fondo: "#e9ecef",
        color: "#343a40",
      };
  }
}

export default function ReservasPage() {
  const { puede } = usePermisos();

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] =
    useState<FiltroEstado>("Pendiente");

  const [reservaSeleccionada, setReservaSeleccionada] =
    useState<Reserva | null>(null);

  const [observacionesAdmin, setObservacionesAdmin] =
    useState("");

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] =
    useState<"exito" | "error" | "info">("info");

  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] =
    useState<number | null>(null);

  const [confirmarAprobacion, setConfirmarAprobacion] =
    useState(false);

  const [confirmarRechazo, setConfirmarRechazo] =
    useState(false);

  const cargarReservas = useCallback(async () => {
    setCargando(true);

    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      if (errorSesion) {
        throw new Error(
          "No se pudo comprobar la sesión actual."
        );
      }

      if (!session?.access_token) {
        throw new Error(
          "Tu sesión no está activa. Iniciá sesión nuevamente."
        );
      }

      const respuesta = await fetch("/api/admin/reservas", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      const datos: RespuestaAPI = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ?? "No se pudieron cargar las reservas."
        );
      }

      setReservas(datos.reservas ?? []);
    } catch (error) {
      console.error("Error cargando reservas:", error);

      setTipoMensaje("error");
      setMensaje(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar las reservas."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarReservas();
  }, [cargarReservas]);

  const reservasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return reservas.filter((reserva) => {
      const propietario = nombrePropietario(reserva);
      const sucursal = primero(reserva.sucursales)?.nombre ?? "";
      const numero = reserva.numero_reserva ?? "";
      const perritos = nombresPerritos(reserva);

      const coincideTexto =
        !texto ||
        `${numero} ${propietario} ${sucursal} ${perritos}`
          .toLowerCase()
          .includes(texto);

      const coincideEstado =
        filtroEstado === "Todas" ||
        reserva.estado === filtroEstado;

      return coincideTexto && coincideEstado;
    });
  }, [reservas, busqueda, filtroEstado]);

  const pendientes = reservas.filter(
    (reserva) => reserva.estado === "Pendiente"
  ).length;

  const aprobadas = reservas.filter(
    (reserva) => reserva.estado === "Aprobada"
  ).length;

  const rechazadas = reservas.filter(
    (reserva) => reserva.estado === "Rechazada"
  ).length;

  function abrirDetalle(reserva: Reserva) {
    setReservaSeleccionada(reserva);
    setObservacionesAdmin(reserva.observaciones_admin ?? "");
    setConfirmarAprobacion(false);
    setConfirmarRechazo(false);
    setMensaje("");
  }

  function cerrarDetalle() {
    if (procesandoId !== null) return;

    setReservaSeleccionada(null);
    setObservacionesAdmin("");
    setConfirmarAprobacion(false);
    setConfirmarRechazo(false);
  }

  async function ejecutarAccion(
    accion: "aprobar" | "rechazar"
  ) {
    if (!reservaSeleccionada) return;

    if (reservaSeleccionada.estado !== "Pendiente") {
      setTipoMensaje("error");
      setMensaje(
        "Esta solicitud ya no está pendiente. Actualizá la lista."
      );
      return;
    }

    if (accion === "aprobar" && !confirmarAprobacion) {
      setTipoMensaje("error");
      setMensaje("Marcá la confirmación antes de aprobar.");
      return;
    }

    if (accion === "rechazar" && !confirmarRechazo) {
      setTipoMensaje("error");
      setMensaje("Marcá la confirmación antes de rechazar.");
      return;
    }

    const propietario = nombrePropietario(reservaSeleccionada);
    const numero = reservaSeleccionada.numero_reserva;

    const confirmacion =
      accion === "aprobar"
        ? `¿Confirmás aprobar la reserva ${numero} de ${propietario}? La operación intentará crear las estadías de los perritos.`
        : `¿Confirmás rechazar la reserva ${numero} de ${propietario}? No se crearán estadías.`;

    if (!window.confirm(confirmacion)) return;

    setProcesandoId(reservaSeleccionada.id);
    setMensaje("");

    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      if (errorSesion || !session?.access_token) {
        throw new Error(
          "Tu sesión no está activa. Iniciá sesión nuevamente."
        );
      }

      const ruta =
        accion === "aprobar"
          ? "/api/admin/reservas/aprobar"
          : "/api/admin/reservas/rechazar";

      const respuesta = await fetch(ruta, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservaId: reservaSeleccionada.id,
          observacionesAdmin: observacionesAdmin.trim(),
        }),
        cache: "no-store",
      });

      const datos: RespuestaAPI = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ?? `No se pudo ${accion} la reserva.`
        );
      }

      setTipoMensaje("exito");
      setMensaje(
        datos.mensaje ??
          (accion === "aprobar"
            ? "Reserva aprobada correctamente."
            : "Reserva rechazada correctamente.")
      );

      setReservaSeleccionada(null);
      setObservacionesAdmin("");
      setConfirmarAprobacion(false);
      setConfirmarRechazo(false);

      await cargarReservas();
    } catch (error) {
      console.error(`Error al ${accion} reserva:`, error);
      setTipoMensaje("error");
      setMensaje(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al procesar la reserva."
      );
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <RequierePermiso permiso="reservas.ver">
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Reservas</h1>
            <p className="page-description">
              Consultá y gestioná las solicitudes de hotel y guardería
              de PetFunCR.
            </p>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => void cargarReservas()}
              disabled={cargando || procesandoId !== null}
            >
              {cargando ? "Actualizando..." : "↻ Actualizar"}
            </button>
          </div>
        </div>

        {mensaje && (
          <div
            className="status-message"
            role="status"
            style={{
              marginBottom: 16,
              borderLeft:
                tipoMensaje === "error"
                  ? "4px solid #b42318"
                  : tipoMensaje === "exito"
                    ? "4px solid #198754"
                    : undefined,
            }}
          >
            {mensaje}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <div className="list-card" style={{ padding: 18 }}>
            <div style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
              Solicitudes pendientes
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 5 }}>
              {pendientes}
            </div>
          </div>

          <div className="list-card" style={{ padding: 18 }}>
            <div style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
              Aprobadas
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 5 }}>
              {aprobadas}
            </div>
          </div>

          <div className="list-card" style={{ padding: 18 }}>
            <div style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
              Rechazadas
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 5 }}>
              {rechazadas}
            </div>
          </div>
        </div>

        <section className="list-card">
          <div
            className="list-toolbar"
            style={{ flexWrap: "wrap", gap: 12 }}
          >
            <div>
              <strong>Solicitudes recibidas</strong>
              <div
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: 14,
                  marginTop: 3,
                }}
              >
                Resultados: {reservasFiltradas.length}
              </div>
            </div>

            <input
              className="search-input"
              placeholder="Buscar número, propietario, perrito o sucursal..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />

            <select
              className="form-input"
              value={filtroEstado}
              onChange={(event) =>
                setFiltroEstado(event.target.value as FiltroEstado)
              }
              style={{ maxWidth: 210 }}
              aria-label="Filtrar reservas por estado"
            >
              <option value="Pendiente">Pendientes</option>
              <option value="Aprobada">Aprobadas</option>
              <option value="Rechazada">Rechazadas</option>
              <option value="Cancelada">Canceladas</option>
              <option value="Todas">Todos los estados</option>
            </select>
          </div>

          {cargando ? (
            <div className="empty-state">
              Cargando solicitudes de reserva...
            </div>
          ) : reservasFiltradas.length === 0 ? (
            <div className="empty-state">
              No se encontraron reservas con estos criterios.
            </div>
          ) : (
            <>
              <div className="desktop-only">
                <div className="table-scroll-x">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Reserva</th>
                        <th>Propietario</th>
                        <th>Perritos</th>
                        <th>Sucursal</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Servicio</th>
                        <th>Estado</th>
                        <th>Detalle</th>
                      </tr>
                    </thead>

                    <tbody>
                      {reservasFiltradas.map((reserva) => {
                        const estado = etiquetaEstado(reserva.estado);

                        return (
                          <tr key={reserva.id}>
                            <td>
                              <strong>{reserva.numero_reserva}</strong>
                            </td>
                            <td>{nombrePropietario(reserva)}</td>
                            <td>{nombresPerritos(reserva) || "—"}</td>
                            <td>
                              {primero(reserva.sucursales)?.nombre ?? "—"}
                            </td>
                            <td>{fechaCorta(reserva.fecha_entrada)}</td>
                            <td>{fechaCorta(reserva.fecha_salida)}</td>
                            <td>
                              {primero(reserva.tipos_estadia)?.nombre ??
                                (reserva.tipo_estadia_id === 1
                                  ? "Hotel"
                                  : reserva.tipo_estadia_id === 2
                                    ? "Guardería"
                                    : "—")}
                            </td>
                            <td>
                              <span
                                style={{
                                  display: "inline-block",
                                  background: estado.fondo,
                                  color: estado.color,
                                  padding: "5px 9px",
                                  borderRadius: 20,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {estado.texto}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => abrirDetalle(reserva)}
                              >
                                Ver detalle
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mobile-only">
                <div className="mobile-list">
                  {reservasFiltradas.map((reserva) => {
                    const estado = etiquetaEstado(reserva.estado);

                    return (
                      <div
                        key={reserva.id}
                        className="mobile-record-card"
                        style={{
                          background: "var(--color-card, #fff)",
                          color: "inherit",
                          border: "1px solid var(--color-border, #e5e7eb)",
                          textAlign: "left",
                        }}
                      >
                        <div className="mobile-record-title">
                          {reserva.numero_reserva}
                        </div>

                        <div className="mobile-record-grid">
                          <div className="mobile-record-full">
                            <span className="mobile-record-label">
                              Propietario
                            </span>
                            <strong>{nombrePropietario(reserva)}</strong>
                          </div>

                          <div className="mobile-record-full">
                            <span className="mobile-record-label">
                              Perritos
                            </span>
                            <strong>{nombresPerritos(reserva) || "—"}</strong>
                          </div>

                          <div>
                            <span className="mobile-record-label">Entrada</span>
                            <strong>{fechaCorta(reserva.fecha_entrada)}</strong>
                          </div>

                          <div>
                            <span className="mobile-record-label">Salida</span>
                            <strong>{fechaCorta(reserva.fecha_salida)}</strong>
                          </div>

                          <div className="mobile-record-full">
                            <span className="mobile-record-label">Sucursal</span>
                            <strong>
                              {primero(reserva.sucursales)?.nombre ?? "—"}
                            </strong>
                          </div>
                        </div>

                        <div style={{ margin: "12px 0" }}>
                          <span
                            style={{
                              display: "inline-block",
                              background: estado.fondo,
                              color: estado.color,
                              padding: "5px 9px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {estado.texto}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => abrirDetalle(reserva)}
                        >
                          Ver detalle →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>

        {reservaSeleccionada && (
          <div
            className="modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                cerrarDetalle();
              }
            }}
          >
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-detalle-reserva"
              style={{ maxWidth: 760, width: "100%" }}
            >
              <div className="modal-header">
                <h2 id="titulo-detalle-reserva">
                  Detalle de reserva
                </h2>

                <button
                  type="button"
                  className="icon-button"
                  onClick={cerrarDetalle}
                  disabled={procesandoId !== null}
                  aria-label="Cerrar detalle"
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div>
                    <div className="form-label">Número de reserva</div>
                    <strong>{reservaSeleccionada.numero_reserva}</strong>
                  </div>

                  <div>
                    <div className="form-label">Estado</div>
                    <strong>{reservaSeleccionada.estado}</strong>
                  </div>

                  <div>
                    <div className="form-label">Propietario</div>
                    <strong>{nombrePropietario(reservaSeleccionada)}</strong>
                  </div>

                  <div>
                    <div className="form-label">Teléfono</div>
                    <strong>
                      {primero(reservaSeleccionada.propietarios)?.telefono ??
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <div className="form-label">Sucursal</div>
                    <strong>
                      {primero(reservaSeleccionada.sucursales)?.nombre ?? "—"}
                    </strong>
                  </div>

                  <div>
                    <div className="form-label">Servicio</div>
                    <strong>
                      {primero(reservaSeleccionada.tipos_estadia)?.nombre ??
                        (reservaSeleccionada.tipo_estadia_id === 1
                          ? "Hotel"
                          : reservaSeleccionada.tipo_estadia_id === 2
                            ? "Guardería"
                            : "—")}
                    </strong>
                  </div>

                  <div>
                    <div className="form-label">Fecha de entrada</div>
                    <strong>
                      {fechaCorta(reservaSeleccionada.fecha_entrada)}
                    </strong>
                  </div>

                  <div>
                    <div className="form-label">Fecha de salida</div>
                    <strong>
                      {fechaCorta(reservaSeleccionada.fecha_salida)}
                    </strong>
                  </div>

                  <div>
                    <div className="form-label">Turno de entrada</div>
                    <strong>
                      {reservaSeleccionada.turno_entrada === "manana"
                        ? "Mañana"
                        : reservaSeleccionada.turno_entrada === "tarde"
                          ? "Tarde"
                          : reservaSeleccionada.turno_entrada || "—"}
                    </strong>
                  </div>

                  <div>
                    <div className="form-label">Monto estimado</div>
                    <strong>
                      {moneda(reservaSeleccionada.monto_estimado)}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: 22 }}>
                  <h3 style={{ marginBottom: 10 }}>Perritos incluidos</h3>

                  {(reservaSeleccionada.reserva_perritos ?? []).length ===
                  0 ? (
                    <p>No hay perritos asociados a esta solicitud.</p>
                  ) : (
                    <div className="table-scroll-x">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>Días</th>
                            <th>Subtotal hotel</th>
                            <th>Subtotal guardería</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(reservaSeleccionada.reserva_perritos ?? []).map(
                            (detalle) => (
                              <tr key={detalle.id}>
                                <td>
                                  {primero(detalle.perritos)?.nombre ?? "—"}
                                </td>
                                <td>{detalle.dias_calculados ?? "—"}</td>
                                <td>
                                  {moneda(detalle.subtotal_hotel_estimado)}
                                </td>
                                <td>
                                  {moneda(detalle.subtotal_guarderia_estimado)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 18 }}>
                  <label className="form-label" htmlFor="observaciones-admin">
                    Observaciones administrativas
                  </label>
                  <textarea
                    id="observaciones-admin"
                    className="form-textarea"
                    value={observacionesAdmin}
                    onChange={(event) =>
                      setObservacionesAdmin(event.target.value)
                    }
                    maxLength={2000}
                    rows={3}
                    placeholder="Notas internas sobre esta solicitud..."
                    disabled={procesandoId !== null}
                  />
                  <div
                    style={{
                      textAlign: "right",
                      color: "var(--color-text-secondary)",
                      fontSize: 12,
                    }}
                  >
                    {observacionesAdmin.length}/2000
                  </div>
                </div>

                {reservaSeleccionada.observaciones_cliente && (
                  <div style={{ marginTop: 16 }}>
                    <div className="form-label">
                      Observaciones del cliente
                    </div>
                    <p style={{ whiteSpace: "pre-wrap" }}>
                      {reservaSeleccionada.observaciones_cliente}
                    </p>
                  </div>
                )}

                {reservaSeleccionada.estado === "Pendiente" && (
                  <div
                    style={{
                      marginTop: 22,
                      padding: 14,
                      borderRadius: 8,
                      background: "var(--color-background, #f8f9fa)",
                    }}
                  >
                    {puede("reservas.gestionar") ? (
                      <>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 9,
                            marginBottom: 12,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={confirmarAprobacion}
                            onChange={(event) =>
                              setConfirmarAprobacion(
                                event.target.checked
                              )
                            }
                            disabled={procesandoId !== null}
                            style={{ marginTop: 4 }}
                          />
                          <span>
                            Confirmo que revisé las fechas, los perritos y
                            los requisitos de esta solicitud. Entiendo que
                            aprobarla intentará crear las estadías.
                          </span>
                        </label>

                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => void ejecutarAccion("aprobar")}
                          disabled={
                            procesandoId !== null ||
                            !confirmarAprobacion
                          }
                        >
                          {procesandoId === reservaSeleccionada.id
                            ? "Procesando..."
                            : "✓ Aprobar reserva"}
                        </button>

                        <div
                          style={{
                            height: 1,
                            background: "var(--color-border, #ddd)",
                            margin: "18px 0",
                          }}
                        />

                        <label
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 9,
                            marginBottom: 12,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={confirmarRechazo}
                            onChange={(event) =>
                              setConfirmarRechazo(event.target.checked)
                            }
                            disabled={procesandoId !== null}
                            style={{ marginTop: 4 }}
                          />
                          <span>
                            Confirmo que deseo rechazar esta solicitud.
                          </span>
                        </label>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => void ejecutarAccion("rechazar")}
                          disabled={
                            procesandoId !== null ||
                            !confirmarRechazo
                          }
                          style={{
                            border: "1px solid #b42318",
                            color: "#b42318",
                          }}
                        >
                          Rechazar reserva
                        </button>
                      </>
                    ) : (
                      <p>
                        Tu perfil puede consultar las reservas, pero no
                        aprobarlas ni rechazarlas.
                      </p>
                    )}
                  </div>
                )}

                <div className="modal-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={cerrarDetalle}
                    disabled={procesandoId !== null}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequierePermiso>
  );
}
