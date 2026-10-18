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

    // 2. Leer y validar el cuerpo.
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

    const reservaId = body.reservaId;
    const observacionesAdmin =
      typeof body.observacionesAdmin === "string"
        ? body.observacionesAdmin.trim()
        : "";

    if (
      typeof reservaId !== "number" ||
      !Number.isSafeInteger(reservaId) ||
      reservaId <= 0
    ) {
      return NextResponse.json(
        { error: "El identificador de la reserva no es válido." },
        { status: 400 }
      );
    }

    if (observacionesAdmin.length > 2000) {
      return NextResponse.json(
        { error: "Las observaciones no pueden superar 2000 caracteres." },
        { status: 400 }
      );
    }

    // 3. Consultar la reserva para verificar el acceso a la sucursal.
    const { data: reserva, error: errorReserva } = await supabaseAdmin
      .from("reservas")
      .select("id, sucursal_id, estado")
      .eq("id", reservaId)
      .maybeSingle();

    if (errorReserva) {
      console.error(
        "Error consultando reserva para cancelar:",
        errorReserva.message
      );
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

    // 5. Comprobación preliminar. La función SQL vuelve a validar
    // el estado definitivo bajo bloqueo de fila.
    if (!["Pendiente", "Aprobada"].includes(reserva.estado)) {
      return NextResponse.json(
        {
          error:
            `La reserva no se puede cancelar desde su estado actual: ${reserva.estado}.`,
        },
        { status: 409 }
      );
    }

    // 6. Cancelar mediante la función SQL transaccional.
    // La función solo cambia la reserva; no elimina ni modifica estadías.
    const { data: resultadoCancelacion, error: errorCancelacion } =
      await supabaseAdmin.rpc("cancelar_reserva_publica", {
        p_reserva_id: reservaId,
        p_observaciones_admin: observacionesAdmin || null,
      });

    if (errorCancelacion) {
      console.error(
        "Error cancelando reserva mediante RPC:",
        errorCancelacion.message
      );

      const mensaje = errorCancelacion.message.toLowerCase();

      if (
        mensaje.includes("no se puede cancelar") ||
        mensaje.includes("estado actual") ||
        mensaje.includes("no fue posible cancelar")
      ) {
        return NextResponse.json(
          {
            error:
              "La reserva cambió de estado o ya no se puede cancelar. Actualizá la lista y verificá su estado.",
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

      if (mensaje.includes("observaciones")) {
        return NextResponse.json(
          { error: "Las observaciones no pueden superar 2000 caracteres." },
          { status: 400 }
        );
      }

      if (mensaje.includes("identificador")) {
        return NextResponse.json(
          { error: "El identificador de la reserva no es válido." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "No se pudo cancelar la reserva." },
        { status: 500 }
      );
    }

    // 7. Confirmar la cancelación.
    return NextResponse.json(
      {
        ok: true,
        mensaje: "Reserva cancelada correctamente.",
        reserva: resultadoCancelacion,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error(
      "Error inesperado cancelando reserva:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "Ocurrió un error inesperado al cancelar la reserva." },
      { status: 500 }
    );
  }
}
