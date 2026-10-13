
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { consultarDisponibilidad } from "@/lib/reservas/consultarDisponibilidad";
import { validarSaludPerrito } from "@/lib/reservas/validarSaludPerrito";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAXIMO_PERRITOS_POR_SOLICITUD = 15;

function esFechaReal(fecha: unknown): fecha is string {
  if (typeof fecha !== "string") return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
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

function obtenerFechaCostaRica(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return `${obtener("year")}-${obtener("month")}-${obtener("day")}`;
}

function responder(
  datos: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(datos, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
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
    const perritosIds = body?.perritosIds;

    // 1. Validar el código del propietario.
    if (!/^PF-[A-Z0-9]{5,12}$/.test(codigo)) {
      return responder(
        { error: "Revisá el código de propietario." },
        400
      );
    }

    // 2. Validar las fechas.
    if (
      !esFechaReal(fechaEntrada) ||
      !esFechaReal(fechaSalida)
    ) {
      return responder(
        { error: "Ingresá fechas de entrada y salida válidas." },
        400
      );
    }

    if (fechaSalida < fechaEntrada) {
      return responder(
        {
          error:
            "La fecha de salida no puede ser anterior a la entrada.",
        },
        400
      );
    }

    const hoyCostaRica = obtenerFechaCostaRica();

    if (fechaEntrada <= hoyCostaRica) {
      return responder(
        {
          error:
            "Las reservas deben solicitarse al menos un día antes de la entrada.",
        },
        400
      );
    }

    // 3. Validar los perritos seleccionados.
    if (
      !Array.isArray(perritosIds) ||
      perritosIds.length === 0 ||
      perritosIds.length > MAXIMO_PERRITOS_POR_SOLICITUD
    ) {
      return responder(
        {
          error:
            "Seleccioná entre 1 y 15 perritos para continuar.",
        },
        400
      );
    }

    const idsValidos = perritosIds.every(
      (id: unknown) =>
        typeof id === "number" &&
        Number.isSafeInteger(id) &&
        id > 0
    );

    if (!idsValidos || new Set(perritosIds).size !== perritosIds.length) {
      return responder(
        {
          error:
            "La selección de perritos no es válida. Revisala e intentá nuevamente.",
        },
        400
      );
    }

    // 4. Buscar al propietario en el servidor.
    const { data: propietario, error: errorPropietario } =
      await supabaseAdmin
        .from("propietarios")
        .select("id, sucursal_id")
        .eq("codigo_reserva", codigo)
        .maybeSingle();

    if (errorPropietario) {
      console.error(
        "Error consultando propietario:",
        errorPropietario.message
      );

      return responder(
        { error: "No fue posible validar los datos en este momento." },
        500
      );
    }

    if (!propietario) {
      return responder(
        { error: "Código inválido o sin acceso a reservas." },
        401
      );
    }

    // 5. Confirmar que todos los perritos pertenecen al propietario
    // y a su sucursal, y que están activos.
    const { data: perritos, error: errorPerritos } =
      await supabaseAdmin
        .from("perritos")
        .select("id, nombre")
        .eq("propietario_id", propietario.id)
        .eq("sucursal_id", propietario.sucursal_id)
        .eq("activo", true)
        .in("id", perritosIds);

    if (errorPerritos) {
      console.error(
        "Error consultando perritos:",
        errorPerritos.message
      );

      return responder(
        { error: "No fue posible validar los perritos en este momento." },
        500
      );
    }

    if (!perritos || perritos.length !== perritosIds.length) {
      return responder(
        {
          error:
            "Uno o más perritos no están disponibles para este propietario.",
        },
        400
      );
    }

    // 6. Comprobar disponibilidad de la sucursal.
    const disponibilidad = await consultarDisponibilidad({
      sucursalId: propietario.sucursal_id,
      fechaEntrada,
      fechaSalida,
      cantidadPerritos: perritos.length,
    });

    // 7. Revisar vacunas y desparasitaciones de cada perrito.
    const resultadosSalud = await Promise.all(
      perritos.map(async (perrito) => {
        const salud = await validarSaludPerrito(
          perrito.id,
          fechaSalida
        );

        return {
          id: perrito.id,
          nombre: perrito.nombre,
          cumple: salud.cumple,
          fechaEvaluacion: salud.fechaEvaluacion,
          requisitosPendientes: salud.requisitosPendientes,
        };
      })
    );

    const todosCumplen = resultadosSalud.every(
      (perrito) => perrito.cumple
    );

    // 8. Devolver el resultado sin crear una reserva.
    return responder({
      valido: todosCumplen && disponibilidad.disponible,
      fechaEntrada,
      fechaSalida,
      perritos: resultadosSalud,
      disponibilidad: {
        disponible: disponibilidad.disponible,
        capacidadMaxima: disponibilidad.capacidadMaxima,
        dias: disponibilidad.dias,
        motivo: disponibilidad.motivo ?? null,
      },
    });
  } catch (error) {
    console.error(
      "Error validando solicitud pública:",
      error instanceof Error ? error.message : error
    );

    return responder(
      {
        error:
          "No fue posible validar la solicitud. Intentá nuevamente.",
      },
      500
    );
  }
}
