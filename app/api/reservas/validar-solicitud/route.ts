
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validarSaludPerrito } from "@/lib/reservas/validarSaludPerrito";
import { consultarDisponibilidad } from "@/lib/reservas/consultarDisponibilidad";

export const runtime = "nodejs";

function esFechaReal(fecha: string): boolean {
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

function obtenerHoyCostaRica(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const obtenerParte = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value;

  const anio = obtenerParte("year");
  const mes = obtenerParte("month");
  const dia = obtenerParte("day");

  if (!anio || !mes || !dia) {
    throw new Error("No fue posible obtener la fecha de Costa Rica.");
  }

  return `${anio}-${mes}-${dia}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const codigo =
      typeof body?.codigo === "string"
        ? body.codigo.trim().toUpperCase()
        : "";

    const fechaEntrada: unknown = body?.fechaEntrada;
    const fechaSalida: unknown = body?.fechaSalida;
    const perritosIds: unknown = body?.perritosIds;

    // 1. Validar código.
    if (!/^PF-[A-Z0-9]{5,12}$/.test(codigo)) {
      return NextResponse.json(
        { error: "Código de reserva inválido o no habilitado." },
        { status: 400 }
      );
    }

    // 2. Validar fechas reales y orden correcto.
    if (
      typeof fechaEntrada !== "string" ||
      typeof fechaSalida !== "string" ||
      !esFechaReal(fechaEntrada) ||
      !esFechaReal(fechaSalida) ||
      fechaSalida < fechaEntrada
    ) {
      return NextResponse.json(
        { error: "Las fechas de entrada y salida no son válidas." },
        { status: 400 }
      );
    }

    // 3. La solicitud debe hacerse al menos un día antes.
    if (fechaEntrada <= obtenerHoyCostaRica()) {
      return NextResponse.json(
        {
          error:
            "La reserva debe solicitarse al menos un día antes de la entrada.",
        },
        { status: 400 }
      );
    }

    // 4. Validar los identificadores de los perritos.
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

    // 5. Buscar propietario por código.
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

      return NextResponse.json(
        { error: "No fue posible validar la solicitud." },
        { status: 500 }
      );
    }

    if (!propietario) {
      return NextResponse.json(
        { error: "Código de reserva inválido o no habilitado." },
        { status: 404 }
      );
    }

    // 6. Confirmar que todos los perritos pertenecen al propietario,
    // están activos y pertenecen a la misma sucursal.
    const { data: perritos, error: errorPerritos } =
      await supabaseAdmin
        .from("perritos")
        .select("id, nombre")
        .eq("propietario_id", propietario.id)
        .eq("sucursal_id", propietario.sucursal_id)
        .eq("activo", true)
        .in("id", perritosIds as number[]);

    if (errorPerritos) {
      console.error(
        "Error consultando perritos:",
        errorPerritos.message
      );

      return NextResponse.json(
        { error: "No fue posible validar los perritos." },
        { status: 500 }
      );
    }

    if (!perritos || perritos.length !== perritosIds.length) {
      return NextResponse.json(
        {
          error:
            "Uno o más perritos no pertenecen al propietario o no están activos.",
        },
        { status: 400 }
      );
    }

    // 7. Consultar disponibilidad. Si falla, no continuar
    // como si hubiera disponibilidad confirmada.
    let disponibilidad;

    try {
      disponibilidad = await consultarDisponibilidad({
        sucursalId: propietario.sucursal_id,
        fechaEntrada,
        fechaSalida,
        cantidadPerritos: perritos.length,
      });
    } catch (error) {
      console.error(
        "Error consultando disponibilidad:",
        error instanceof Error ? error.message : error
      );

      return NextResponse.json(
        {
          error:
            "No fue posible comprobar la disponibilidad. Intentá nuevamente más tarde.",
        },
        { status: 503 }
      );
    }

    // 8. Validar vacunas y desparasitaciones hasta la fecha de salida.
    const resultados = await Promise.all(
      perritos.map(async (perrito) => ({
        perritoId: perrito.id,
        nombre: perrito.nombre,
        ...(await validarSaludPerrito(
          perrito.id,
          fechaSalida
        )),
      }))
    );

    const todosCumplen = resultados.every(
      (resultado) => resultado.cumple
    );

    // 9. Responder con la validación sanitaria y de capacidad.
    return NextResponse.json(
      {
        valido: todosCumplen && disponibilidad.disponible,
        fechaEntrada,
        fechaSalida,
        perritos: resultados,
        disponibilidad: {
          disponible: disponibilidad.disponible,
          capacidadMaxima: disponibilidad.capacidadMaxima,
          dias: disponibilidad.dias,
          motivo: disponibilidad.motivo,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Error validando solicitud de reserva:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No fue posible validar la solicitud." },
      { status: 500 }
    );
  }
}
