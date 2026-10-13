
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validarSaludPerrito } from "@/lib/reservas/validarSaludPerrito";
import { consultarDisponibilidad } from "@/lib/reservas/consultarDisponibilidad";
import { enviarNotificacionReserva } from "@/lib/notificacionesReservas";

export const runtime = "nodejs";

function esFechaReal(fecha: unknown): fecha is string {
  if (
    typeof fecha !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
  ) {
    return false;
  }

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fechaUTC.getUTCFullYear() === anio &&
    fechaUTC.getUTCMonth() === mes - 1 &&
    fechaUTC.getUTCDate() === dia
  );
}

function obtenerHoyCostaRica(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function respuestaErrorReserva(mensaje: string) {
  const mensajeNormalizado = mensaje.toLowerCase();

  if (
    mensajeNormalizado.includes("capacidad máxima") ||
    mensajeNormalizado.includes("bloqueo activo")
  ) {
    return NextResponse.json(
      {
        error:
          "No hay disponibilidad para las fechas solicitadas. Revisá las fechas o seleccioná otras.",
      },
      { status: 409 }
    );
  }

  if (
    mensajeNormalizado.includes("al menos un día antes") ||
    mensajeNormalizado.includes("fechas") ||
    mensajeNormalizado.includes("fecha de salida") ||
    mensajeNormalizado.includes("datos de la reserva") ||
    mensajeNormalizado.includes("selección de perritos") ||
    mensajeNormalizado.includes("perritos duplicados") ||
    mensajeNormalizado.includes("no pertenecen") ||
    mensajeNormalizado.includes("no están activos") ||
    mensajeNormalizado.includes("propietario no pertenece")
  ) {
    return NextResponse.json(
      { error: mensaje },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: "No fue posible registrar la reserva." },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const codigo =
      typeof body?.codigo === "string"
        ? body.codigo.trim().toUpperCase()
        : "";

    const fechaEntrada = body?.fechaEntrada;
    const fechaSalida = body?.fechaSalida;
    const turnoEntrada = body?.turnoEntrada;
    const tipoEstadiaId = body?.tipoEstadiaId;
    const perritosIds: unknown = body?.perritosIds;

    const observacionesCliente =
      typeof body?.observacionesCliente === "string"
        ? body.observacionesCliente.trim()
        : null;

    // 1. Validar el código de reserva.
    if (!/^PF-[A-Z0-9]{5,12}$/.test(codigo)) {
      return NextResponse.json(
        { error: "Código de reserva inválido o no habilitado." },
        { status: 400 }
      );
    }

    // 2. Validar las fechas.
    if (
      !esFechaReal(fechaEntrada) ||
      !esFechaReal(fechaSalida) ||
      fechaSalida < fechaEntrada
    ) {
      return NextResponse.json(
        { error: "Las fechas de la reserva no son válidas." },
        { status: 400 }
      );
    }

    if (fechaEntrada <= obtenerHoyCostaRica()) {
      return NextResponse.json(
        {
          error:
            "La reserva debe solicitarse al menos un día antes de la entrada.",
        },
        { status: 400 }
      );
    }

    // 3. Validar el turno de entrada.
    if (
      turnoEntrada !== "manana" &&
      turnoEntrada !== "tarde"
    ) {
      return NextResponse.json(
        { error: "Seleccioná un turno de entrada válido." },
        { status: 400 }
      );
    }

    // 4. Solo permitir Hotel o Guardería en reservas públicas.
    if (tipoEstadiaId !== 1 && tipoEstadiaId !== 2) {
      return NextResponse.json(
        {
          error:
            "El tipo de reserva debe ser Hotel o Guardería.",
        },
        { status: 400 }
      );
    }

    // 5. Validar la selección de perritos.
    if (
      !Array.isArray(perritosIds) ||
      perritosIds.length === 0 ||
      perritosIds.length > 15 ||
      !perritosIds.every(
        (id: unknown) =>
          typeof id === "number" &&
          Number.isSafeInteger(id) &&
          id > 0
      ) ||
      new Set(perritosIds).size !== perritosIds.length
    ) {
      return NextResponse.json(
        { error: "Seleccioná al menos un perrito válido." },
        { status: 400 }
      );
    }

    if (
      observacionesCliente &&
      observacionesCliente.length > 2000
    ) {
      return NextResponse.json(
        {
          error:
            "Las observaciones no pueden superar 2000 caracteres.",
        },
        { status: 400 }
      );
    }

    // 6. Buscar al propietario mediante su código.
    const {
      data: propietario,
      error: errorPropietario,
    } = await supabaseAdmin
      .from("propietarios")
      .select("id, sucursal_id")
      .eq("codigo_reserva", codigo)
      .maybeSingle();

    if (errorPropietario) {
      console.error(
        "Error validando propietario:",
        errorPropietario.message
      );

      return NextResponse.json(
        {
          error:
            "No fue posible validar el código de reserva.",
        },
        { status: 500 }
      );
    }

    if (!propietario) {
      return NextResponse.json(
        {
          error:
            "Código de reserva inválido o no habilitado.",
        },
        { status: 404 }
      );
    }

    // 7. PRIMERO comprobar que los perritos pertenecen
    // al propietario y están activos en su sucursal.
    // No consultar información sanitaria antes de esta comprobación.
    const {
      data: perritos,
      error: errorPerritos,
    } = await supabaseAdmin
      .from("perritos")
      .select("id")
      .eq("propietario_id", propietario.id)
      .eq("sucursal_id", propietario.sucursal_id)
      .eq("activo", true)
      .in("id", perritosIds);

    if (errorPerritos) {
      console.error(
        "Error validando perritos:",
        errorPerritos.message
      );

      return NextResponse.json(
        {
          error:
            "No fue posible validar los perritos seleccionados.",
        },
        { status: 500 }
      );
    }

    if (
      !perritos ||
      perritos.length !== perritosIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "Uno o más perritos no pertenecen al propietario o no están activos.",
        },
        { status: 400 }
      );
    }

    // 8. SOLO después de validar la pertenencia,
    // comprobar vacunas y desparasitaciones de cada perrito.
    const resultadosSalud = await Promise.all(
      (perritosIds as number[]).map(async (perritoId) => ({
        perritoId,
        ...(await validarSaludPerrito(
          perritoId,
          fechaSalida
        )),
      }))
    );

    const perritosConProblemas = resultadosSalud.filter(
      (resultado) => !resultado.cumple
    );

    if (perritosConProblemas.length > 0) {
      return NextResponse.json(
        {
          error:
            "Uno o más perritos no cumplen los requisitos sanitarios.",
          perritos: resultadosSalud,
        },
        { status: 400 }
      );
    }

    // 9. Comprobar disponibilidad y bloqueos antes de guardar.
    // La función SQL volverá a comprobar capacidad y bloqueos.
    const disponibilidad = await consultarDisponibilidad({
      sucursalId: propietario.sucursal_id,
      fechaEntrada,
      fechaSalida,
      cantidadPerritos: perritosIds.length,
    });

    if (!disponibilidad.disponible) {
      return NextResponse.json(
        {
          error:
            "No hay disponibilidad para todas las fechas solicitadas.",
          disponibilidad,
        },
        { status: 409 }
      );
    }

    // 10. Crear la solicitud y sus detalles mediante la función SQL.
    const {
      data: reserva,
      error: errorReserva,
    } = await supabaseAdmin.rpc(
      "crear_reserva_publica",
      {
        p_propietario_id: propietario.id,
        p_sucursal_id: propietario.sucursal_id,
        p_fecha_entrada: fechaEntrada,
        p_fecha_salida: fechaSalida,
        p_turno_entrada: turnoEntrada,
        p_tipo_estadia_id: tipoEstadiaId,
        p_perritos_ids: perritosIds,
        p_observaciones_cliente: observacionesCliente,
      }
    );

    if (errorReserva) {
      // Registrar el detalle únicamente en los logs del servidor.
      console.error(
        "Error creando reserva:",
        errorReserva.message
      );

      return respuestaErrorReserva(errorReserva.message);
    }


    // Notificar al administrador sin afectar la reserva si falla el correo.
    await enviarNotificacionReserva({
      asunto: `Nueva solicitud de reserva: ${reserva.numero_reserva}`,
      mensaje: [
        "Se ha recibido una nueva solicitud de reserva en PetFunCR.",
        "",
        `Número de reserva: ${reserva.numero_reserva}`,
        `Estado: ${reserva.estado}`,
        `Fecha de entrada: ${fechaEntrada}`,
        `Fecha de salida: ${fechaSalida}`,
        `Turno de entrada: ${turnoEntrada}`,
        `Tipo de estadía: ${tipoEstadiaId === 1 ? "Hotel" : "Guardería"}`,
        `Cantidad de perritos: ${perritosIds.length}`,
        "",
        "Ingresa al panel administrativo de PetFunCR para revisar la solicitud.",
      ].join("\n"),
    });


    // 11. Confirmar la recepción de la solicitud.
    return NextResponse.json(
      {
        mensaje:
          "Solicitud de reserva registrada correctamente.",
        reserva,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Error procesando solicitud de reserva:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No fue posible procesar la solicitud." },
      { status: 500 }
    );
  }
}
