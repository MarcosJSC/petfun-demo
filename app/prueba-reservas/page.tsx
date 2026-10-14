
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type RespuestaAPI = {
  ok?: boolean;
  mensaje?: string;
  error?: string;
  reservas?: unknown[];
  resultado?: unknown;
  reserva?: unknown;
};

export default function PruebaReservasPage() {
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState("");
  const [confirmarAprobacion, setConfirmarAprobacion] =
    useState(false);
  const [confirmarRechazo, setConfirmarRechazo] =
    useState(false);
  const [confirmarCancelacion, setConfirmarCancelacion] =
    useState(false);

  async function obtenerToken(): Promise<string> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error("No se pudo comprobar la sesión actual.");
    }

    if (!session?.access_token) {
      throw new Error(
        "No hay una sesión activa. Iniciá sesión en PetFunCR."
      );
    }

    return session.access_token;
  }

  async function ejecutarSolicitud(
    ruta: string,
    cuerpo?: Record<string, unknown>
  ) {
    setCargando(true);
    setMensaje("");
    setResultado("");

    try {
      const token = await obtenerToken();

      const respuesta = await fetch(ruta, {
        method: cuerpo ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(cuerpo ? { "Content-Type": "application/json" } : {}),
        },
        ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
        cache: "no-store",
      });

      const datos: RespuestaAPI = await respuesta.json();

      setMensaje(`Respuesta HTTP: ${respuesta.status}`);
      setResultado(JSON.stringify(datos, null, 2));
    } catch (error) {
      console.error("Error en prueba de reservas:", error);
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo completar la prueba."
      );
    } finally {
      setCargando(false);
    }
  }

  async function probarAcceso() {
    await ejecutarSolicitud("/api/admin/reservas");
  }

  async function aprobarReservaPrueba() {
    if (!confirmarAprobacion) {
      setMensaje("Primero confirmá la aprobación de la reserva ID 1.");
      return;
    }

    if (
      !window.confirm(
        "Esta operación aprobará la reserva ID 1 e intentará crear una estadía. ¿Deseás continuar?"
      )
    ) {
      return;
    }

    await ejecutarSolicitud("/api/admin/reservas/aprobar", {
      reservaId: 1,
      observacionesAdmin:
        "PRUEBA TÉCNICA DE APROBACIÓN - CARTAGO",
    });
  }


async function rechazarReservaPrueba() {
  if (!confirmarRechazo) {
    setMensaje("Primero confirmá el rechazo de la reserva ID 4.");
    return;
  }

  if (
    !window.confirm(
      "Vas a rechazar la reserva ID 4 de Cartago. ¿Querés continuar?"
    )
  ) {
    return;
  }

  await ejecutarSolicitud("/api/admin/reservas/rechazar", {
    reservaId: 4,
    observacionesAdmin:
      "PRUEBA TÉCNICA DE RECHAZO CON RPC - CARTAGO",
  });
}


  async function cancelarReservaPrueba() {
    if (!confirmarCancelacion) {
      setMensaje("Primero confirmá la cancelación de la reserva ID 5.");
      return;
    }

    if (
      !window.confirm(
        "Vas a cancelar únicamente la reserva ID 5 de Cartago. No se deben crear estadías. ¿Querés continuar?"
      )
    ) {
      return;
    }

    await ejecutarSolicitud("/api/admin/reservas/cancelar", {
      reservaId: 5,
      observacionesAdmin:
        "PRUEBA TÉCNICA DE CANCELACIÓN ADMINISTRATIVA - CARTAGO",
    });
  }

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <h1>Pruebas de reservas PetFunCR</h1>

      <p>
        Página temporal para comprobar la autorización administrativa
        y los flujos de aprobación, rechazo y cancelación.
      </p>

      <section
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid #555",
          borderRadius: 10,
        }}
      >
        <h2>1. Comprobar acceso</h2>
        <p>
          Comprueba la sesión y consulta las reservas. No crea ni
          modifica registros.
        </p>
        <button
          type="button"
          onClick={probarAcceso}
          disabled={cargando}
          style={{ padding: "10px 16px", borderRadius: 8 }}
        >
          {cargando ? "Procesando..." : "Probar acceso"}
        </button>
      </section>

      <section
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid #b7791f",
          borderRadius: 10,
        }}
      >
        <h2>2. Aprobar reserva de prueba</h2>
        <p>
          Reserva ID 1 · Cartago · Pulguitas Huesos · Entrada
          20/10/2026 · Salida 21/10/2026.
        </p>
        <p>
          Esta operación modifica la base de datos y puede crear
          una estadía.
        </p>

        <label style={{ display: "flex", gap: 8, margin: "16px 0" }}>
          <input
            type="checkbox"
            checked={confirmarAprobacion}
            onChange={(event) =>
              setConfirmarAprobacion(event.target.checked)
            }
          />
          Confirmo que quiero aprobar la reserva ID 1 y crear su estadía.
        </label>

        <button
          type="button"
          onClick={aprobarReservaPrueba}
          disabled={cargando || !confirmarAprobacion}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            cursor:
              cargando || !confirmarAprobacion
                ? "not-allowed"
                : "pointer",
            opacity: cargando || !confirmarAprobacion ? 0.6 : 1,
          }}
        >
          {cargando ? "Procesando..." : "Aprobar reserva de prueba"}
        </button>
      </section>

      <section
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid #b91c1c",
          borderRadius: 10,
        }}
      >
        <h2>3. Rechazar reserva de prueba</h2>
        <p>
          Reserva ID 4 · Cartago · Pulguitas Huesos · Entrada
          10/11/2026 · Salida 11/11/2026.
        </p>
        <p>
          Esta operación cambia la reserva de Pendiente a Rechazada.
          No debe crear ni modificar estadías.
        </p>

        <label style={{ display: "flex", gap: 8, margin: "16px 0" }}>
          <input
            type="checkbox"
            checked={confirmarRechazo}
            onChange={(event) =>
              setConfirmarRechazo(event.target.checked)
            }
          />
          Confirmo que quiero rechazar únicamente la reserva ID 2.
        </label>

        <button
          type="button"
          onClick={rechazarReservaPrueba}
          disabled={cargando || !confirmarRechazo}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            cursor:
              cargando || !confirmarRechazo
                ? "not-allowed"
                : "pointer",
            opacity: cargando || !confirmarRechazo ? 0.6 : 1,
          }}
        >
          {cargando ? "Procesando..." : "Rechazar reserva de prueba"}
        </button>
      </section>

      <section
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid #2563eb",
          borderRadius: 10,
        }}
      >
        <h2>4. Cancelar solicitud pendiente</h2>
        <p>
          Reserva ID 5 · Cartago · Pulguitas Huesos · Entrada
          12/11/2026 · Salida 13/11/2026.
        </p>
        <p>
          Esta operación cambiará el estado a Cancelada. No debe crear
          ninguna estadía.
        </p>

        <label style={{ display: "flex", gap: 8, margin: "16px 0" }}>
          <input
            type="checkbox"
            checked={confirmarCancelacion}
            onChange={(event) =>
              setConfirmarCancelacion(event.target.checked)
            }
          />
          Confirmo que quiero cancelar únicamente la reserva ID 5.
        </label>

        <button
          type="button"
          onClick={cancelarReservaPrueba}
          disabled={cargando || !confirmarCancelacion}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            cursor:
              cargando || !confirmarCancelacion
                ? "not-allowed"
                : "pointer",
            opacity: cargando || !confirmarCancelacion ? 0.6 : 1,
          }}
        >
          {cargando ? "Procesando..." : "Cancelar reserva de prueba"}
        </button>
      </section>

      {mensaje && (
        <p style={{ marginTop: 24, fontWeight: 600 }}>{mensaje}</p>
      )}

      {resultado && (
        <pre
          style={{
            marginTop: 12,
            padding: 16,
            borderRadius: 8,
            background: "#f3f4f6",
            color: "#111827",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            fontSize: 13,
          }}
        >
          {resultado}
        </pre>
      )}
    </main>
  );
}
