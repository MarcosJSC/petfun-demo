
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { enviarNotificacionReserva } from "@/lib/notificacionesReservas";

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

    if (!/^RES-\d{8}-[A-F0-9]{8}$/i.test(numeroReserva)) {
      return NextResponse.json(
        { error: "El número de reserva no es válido." },
        { status: 400 }
      );
    }

    // Recuperar los datos para el correo antes de cancelar.
    // Si falla esta consulta, la cancelación todavía puede continuar.
    let datosCorreo: {
      propietario: string;
      perritos: string[];
      fechaEntrada: string;
      fechaSalida: string;
      turnoEntrada: string;
      tipoEstadia: string;
    } = {
      propietario: "No disponible",
      perritos: [],
      fechaEntrada: "No disponible",
      fechaSalida: "No disponible",
      turnoEntrada: "No disponible",
      tipoEstadia: "No disponible",
    };

    try {
      const { data: propietario, error: errorPropietario } =
        await supabaseAdmin
          .from("propietarios")
          .select("id, nombre")
          .eq("codigo_reserva", codigo)
          .maybeSingle();

      if (errorPropietario) {
        console.error(
          "Error consultando propietario para notificación:",
          errorPropietario.message
        );
      } else if (propietario) {
        const { data: reserva, error: errorReserva } =
          await supabaseAdmin
            .from("reservas")
            .select(
              "id, numero_reserva, propietario_id, fecha_entrada, fecha_salida, turno_entrada, tipo_estadia_id"
            )
            .eq("numero_reserva", numeroReserva)
            .eq("propietario_id", propietario.id)
            .maybeSingle();

        if (errorReserva) {
          console.error(
            "Error consultando reserva para notificación:",
            errorReserva.message
          );
        } else if (reserva) {
          const { data: relaciones, error: errorPerritos } =
            await supabaseAdmin
              .from("reserva_perritos")
              .select("perritos(nombre)")
              .eq("reserva_id", reserva.id);

          if (errorPerritos) {
            console.error(
              "Error consultando perritos para notificación:",
              errorPerritos.message
            );
          }

          const filas = (relaciones ?? []) as unknown as {
            perritos: { nombre: string } | { nombre: string }[] | null;
          }[];

          const nombresPerritos = filas.flatMap((fila) => {
            if (!fila.perritos) return [];

            const perritos = Array.isArray(fila.perritos)
              ? fila.perritos
              : [fila.perritos];

            return perritos.map((perrito) => perrito.nombre);
          });

          datosCorreo = {
            propietario: propietario.nombre || "No disponible",
            perritos: nombresPerritos,
            fechaEntrada: reserva.fecha_entrada,
            fechaSalida: reserva.fecha_salida,
            turnoEntrada: reserva.turno_entrada,
            tipoEstadia: Number(reserva.tipo_estadia_id) === 1
              ? "Hotel"
              : Number(reserva.tipo_estadia_id) === 2
                ? "Guardería"
                : "No disponible",
          };
        }
      }
    } catch (error) {
      console.error(
        "No se pudieron recuperar todos los datos del correo:",
        error instanceof Error ? error.message : error
      );
    }

    // Ejecutar la cancelación pública existente.
    const { data, error } = await supabaseAdmin.rpc(
      "cancelar_reserva_publica",
      {
        p_codigo_propietario: codigo,
        p_numero_reserva: numeroReserva,
      }
    );

    if (error) {
      console.error("Error cancelando reserva:", error.message);

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

    // Notificar al administrador después de confirmar la cancelación.
    // La función de notificación maneja sus propios errores.
    await enviarNotificacionReserva({
      asunto: `Reserva cancelada desde la web: ${numeroReserva}`,
      mensaje: [
        "Se ha cancelado una reserva desde la web pública de PetFunCR.",
        "",
        `Número de reserva: ${numeroReserva}`,
        "Estado: Cancelada",
        `Propietario: ${datosCorreo.propietario}`,
        "",
        "Perritos seleccionados:",
        ...(datosCorreo.perritos.length > 0
          ? datosCorreo.perritos.map((nombre) => `- ${nombre}`)
          : ["No fue posible recuperar los nombres de los perritos."]),
        "",
        `Fecha de entrada: ${datosCorreo.fechaEntrada}`,
        `Fecha de salida: ${datosCorreo.fechaSalida}`,
        `Turno de entrada: ${datosCorreo.turnoEntrada}`,
        `Tipo de estadía: ${datosCorreo.tipoEstadia}`,
        "",
        "Origen de la cancelación: web pública de reservas.",
      ].join("\n"),
    });

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
