
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const codigo =
      typeof body?.codigo === "string"
        ? body.codigo.trim().toUpperCase()
        : "";

    const numeroReserva =
      typeof body?.numeroReserva === "string"
        ? body.numeroReserva.trim()
        : "";

    if (!/^PF-[A-Z0-9]{5,12}$/.test(codigo)) {
      return NextResponse.json(
        { error: "Código de propietario inválido." },
        { status: 400 }
      );
    }

    if (
      !/^RES-\d{8}-[A-F0-9]{8}$/i.test(numeroReserva)
    ) {
      return NextResponse.json(
        { error: "El número de reserva no es válido." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc(
      "cancelar_reserva_publica",
      {
        p_codigo_propietario: codigo,
        p_numero_reserva: numeroReserva,
      }
    );

    if (error) {
      console.error(
        "Error cancelando reserva:",
        error.message
      );

      const mensaje = error.message.toLowerCase();

      if (
        mensaje.includes("no está pendiente") ||
        mensaje.includes("no se encontró la reserva")
      ) {
        return NextResponse.json(
          {
            error:
              "No se puede cancelar esta reserva. Si ya no está pendiente, contactá a PetFunCR.",
          },
          { status: 409 }
        );
      }

      if (
        mensaje.includes("código") ||
        mensaje.includes("propietario")
      ) {
        return NextResponse.json(
          { error: "No fue posible validar la reserva." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "No fue posible cancelar la reserva." },
        { status: 500 }
      );
    }

    if (
  !data ||
  typeof data !== "object" ||
  data.estado !== "Cancelada"
) {
  console.error(
    "Respuesta inesperada al cancelar la reserva:",
    data
  );

  return NextResponse.json(
    {
      error:
        "No pudimos confirmar la cancelación. Consultá nuevamente tus reservas.",
    },
    { status: 500 }
  );
}

    return NextResponse.json(
      {
        ok: true,
        mensaje: "La reserva se canceló correctamente.",
        resultado: data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error inesperado cancelando reserva:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado al cancelar la reserva." },
      { status: 500 }
    );
  }
}
