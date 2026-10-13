
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { autorizarReserva } from "@/lib/reservas/autorizarReserva";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar sesión, rol y perfil activo.
    const resultado = await autorizarReserva(request);

    if (!resultado.autorizado) {
      return resultado.respuesta;
    }

    const { usuario } = resultado;

    // 2. Leer el cuerpo de la solicitud.
    let body: {
      reservaId?: unknown;
      observacionesAdmin?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud no es válido." },
        { status: 400 }
      );
    }

    const reservaId = Number(body.reservaId);

    const observacionesAdmin =
      typeof body.observacionesAdmin === "string"
        ? body.observacionesAdmin.trim()
        : "";

    if (!Number.isSafeInteger(reservaId) || reservaId <= 0) {
      return NextResponse.json(
        { error: "El identificador de la reserva no es válido." },
        { status: 400 }
      );
    }

    if (observacionesAdmin.length > 2000) {
      return NextResponse.json(
        {
          error: "Las observaciones no pueden superar 2000 caracteres.",
        },
        { status: 400 }
      );
    }

    // 3. Consultar la reserva para verificar su existencia
    // y el acceso del usuario a la sucursal.
    const { data: reserva, error: errorReserva } =
      await supabaseAdmin
        .from("reservas")
        .select("id, sucursal_id, estado")
        .eq("id", reservaId)
        .maybeSingle();

    if (errorReserva) {
      console.error("Error consultando reserva:", errorReserva.message);

      return NextResponse.json(
        { error: "No se pudo consultar la reserva." },
        { status: 500 }
      );
    }

    if (!reserva) {
      return NextResponse.json(
        { error: "La reserva no existe." },
        { status: 404 }
      );
    }

    // 4. Verificar acceso a la sucursal.
    if (
      usuario.sucursalesIds !== null &&
      !usuario.sucursalesIds.includes(Number(reserva.sucursal_id))
    ) {
      return NextResponse.json(
        { error: "No tienes acceso a la sucursal de esta reserva." },
        { status: 403 }
      );
    }

    // 5. Comprobación preliminar.
    // La función SQL volverá a comprobar el estado bajo bloqueo de fila.
    if (reserva.estado !== "Pendiente") {
      return NextResponse.json(
        {
          error:
            `La reserva no está pendiente. Estado actual: ${reserva.estado}.`,
        },
        { status: 409 }
      );
    }

    // 6. Rechazar dentro de PostgreSQL.
    // FOR UPDATE en la función SQL coordina operaciones concurrentes.
    const { data: resultadoRechazo, error: errorRechazo } =
      await supabaseAdmin.rpc("rechazar_reserva_publica", {
        p_reserva_id: reservaId,
        p_observaciones_admin: observacionesAdmin || null,
      });

    if (errorRechazo) {
      console.error(
        "Error rechazando reserva mediante RPC:",
        errorRechazo.message
      );

      const mensaje = errorRechazo.message.toLowerCase();

      if (
        mensaje.includes("no está pendiente") ||
        mensaje.includes("estado actual")
      ) {
        // Consultar el estado definitivo para informar al usuario.
        const { data: estadoActual, error: errorEstado } =
          await supabaseAdmin
            .from("reservas")
            .select("estado")
            .eq("id", reservaId)
            .maybeSingle();

        if (errorEstado) {
          console.error(
            "Error comprobando estado de reserva:",
            errorEstado.message
          );

          return NextResponse.json(
            {
              error:
                "La reserva cambió durante la operación, pero no se pudo comprobar su estado actual.",
            },
            { status: 500 }
          );
        }

        if (!estadoActual) {
          return NextResponse.json(
            { error: "La reserva no existe." },
            { status: 404 }
          );
        }

        return NextResponse.json(
          {
            error:
              `La reserva no está pendiente. Estado actual: ${estadoActual.estado}.`,
          },
          { status: 409 }
        );
      }

      if (mensaje.includes("no existe")) {
        return NextResponse.json(
          { error: "La reserva no existe." },
          { status: 404 }
        );
      }

      if (
        mensaje.includes("identificador") ||
        mensaje.includes("observaciones")
      ) {
        return NextResponse.json(
          { error: errorRechazo.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "No se pudo rechazar la reserva." },
        { status: 500 }
      );
    }

    // 7. Confirmar el rechazo.
    return NextResponse.json(
      {
        ok: true,
        mensaje: "Reserva rechazada correctamente.",
        resultado: resultadoRechazo,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error inesperado rechazando reserva:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado al rechazar la reserva." },
      { status: 500 }
    );
  }
}
